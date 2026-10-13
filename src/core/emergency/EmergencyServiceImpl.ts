import {
  EmergencyPhase,
  EmergencyService,
  EmergencyState,
} from '../../contracts/emergency';
import { MedicalProfileService } from '../../contracts/medical';
import { MeshService } from '../../contracts/mesh';
import { PermissionKind, PermissionsService } from '../../contracts/permissions';
import { PowerService } from '../../contracts/power';
import { ReportService } from '../../contracts/sync';
import { GeoPoint, Severity, Unsubscribe } from '../../contracts/types';
import { Clock, KeyValueStore, systemClock } from '../platform/ports';
import {
  EmergencyEventRecord,
  ForegroundServicePort,
  LocationPort,
  SignalingPort,
} from './ports';

export interface EmergencyServiceDeps {
  permissions: PermissionsService;
  power?: PowerService;
  signaling?: SignalingPort;
  foreground?: ForegroundServicePort;
  location?: LocationPort;
  medical?: MedicalProfileService;
  mesh?: MeshService;
  reports?: ReportService;
  storage?: KeyValueStore;
  clock?: Clock;
  confirmTimeoutMs?: number; // Por defecto: 3000 ms (3 segundos cancelables)
  noBridgeTimeoutMs?: number; // Por defecto: 120_000 ms (2 minutos según D-25)
  stopResetDelayMs?: number; // Retardo breve antes de volver de STOPPED a IDLE (por defecto: 500 ms)
}

/**
 * Implementación del servicio de emergencia (RF-05, RF-06, RNF-05, D-25, D-26).
 * Máquina de estados:
 *   IDLE -> CONFIRMING (3 s cancelable) -> ACTIVE -> STOPPED -> IDLE
 *
 * Orquesta:
 * - Baliza BLE y malla (RF-07, RF-08)
 * - Señalización física simultánea: flash 4 Hz y tono 3 kHz en < 300 ms (RF-06)
 * - Ficha médica armada para socorristas (RF-13)
 * - Posicionamiento GPS y registro local persistente (JD-030)
 * - Servicio en primer plano y notificación persistente en Android
 * - Transición SOS prolongado (<20% batería) ajustando los pulsos (D-26)
 * - Detección de ausencia de nodos puente por 2 min (D-25)
 */
export class EmergencyServiceImpl implements EmergencyService {
  private deps: EmergencyServiceDeps;
  private clock: Clock;
  private confirmTimeoutMs: number;
  private noBridgeTimeoutMs: number;
  private stopResetDelayMs: number;

  private state: EmergencyState;
  private listeners: ((s: EmergencyState) => void)[] = [];

  private confirmTimer?: ReturnType<typeof setTimeout>;
  private bridgeTimer?: ReturnType<typeof setTimeout>;
  private stopResetTimer?: ReturnType<typeof setTimeout>;
  private powerUnsubscribe?: Unsubscribe;

  constructor(deps: EmergencyServiceDeps) {
    this.deps = deps;
    this.clock = deps.clock ?? systemClock;
    this.confirmTimeoutMs = deps.confirmTimeoutMs ?? 3000;
    this.noBridgeTimeoutMs = deps.noBridgeTimeoutMs ?? 120_000;
    this.stopResetDelayMs = deps.stopResetDelayMs ?? 500;

    const initialLowPower = deps.power ? deps.power.getLevel() < 20 : false;

    this.state = {
      phase: 'IDLE',
      lowPower: initialLowPower,
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
      noBridge2Min: false,
    };

    if (deps.power) {
      this.powerUnsubscribe = deps.power.subscribe((level: number, charging: boolean) => {
        const isLow = level < 20 && !charging;
        if (this.state.lowPower !== isLow) {
          this.state = { ...this.state, lowPower: isLow };
          if (this.state.phase === 'ACTIVE' && this.deps.signaling) {
            this.deps.signaling.updateLowPower(isLow).catch(() => {});
          }
          this.notify();
        }
      });
    }
  }

  public getState(): EmergencyState {
    return { ...this.state };
  }

  public subscribe(cb: (s: EmergencyState) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /**
   * Pre-chequeo antes de desplegar modal de gravedad.
   * Si faltan permisos requeridos para pánico y baliza (bluetooth, location),
   * los retorna para que la interfaz los solicite (RF-05 A2).
   */
  public async requestPanic(): Promise<{ missing: PermissionKind[] }> {
    const missing = await this.deps.permissions.missingForEmergency();
    return { missing };
  }

  /**
   * Selección de nivel de gravedad.
   * Inicia la fase CONFIRMING con cuenta regresiva cancelable de 3 segundos (RF-05).
   * Al vencer el temporizador, entra automáticamente a la fase ACTIVE.
   */
  public async selectSeverity(s: Severity): Promise<void> {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }

    const now = this.clock.now();
    const startedAt = new Date(now).toISOString();
    const cancelDeadline = new Date(now + this.confirmTimeoutMs).toISOString();

    this.state = {
      ...this.state,
      phase: 'CONFIRMING',
      severity: s,
      startedAt,
      cancelDeadline,
    };
    this.notify();

    this.confirmTimer = setTimeout(async () => {
      await this.activateEmergency();
    }, this.confirmTimeoutMs);
  }

  /**
   * Cancelación dentro de los 3 segundos de gracia (RF-05 A1).
   * Solo es válida mientras la fase sea CONFIRMING.
   */
  public async cancel(): Promise<void> {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }

    if (this.state.phase !== 'CONFIRMING') {
      return;
    }

    this.state = {
      ...this.state,
      phase: 'IDLE',
      severity: undefined,
      startedAt: undefined,
      cancelDeadline: undefined,
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
      noBridge2Min: false,
    };
    this.notify();
  }

  /**
   * Detención voluntaria de la emergencia (ACTIVE -> STOPPED -> IDLE).
   * Apaga la señalización física, el servicio en primer plano y las balizas de socorro.
   */
  public async stop(): Promise<void> {
    this.clearAllTimers();

    // Detener señalización física y servicio en primer plano
    if (this.deps.signaling) {
      try {
        await this.deps.signaling.stop();
      } catch (err) {
        console.warn('[EmergencyService] Error al apagar señalización:', err);
      }
    }

    if (this.deps.foreground) {
      try {
        await this.deps.foreground.stop();
      } catch (err) {
        console.warn('[EmergencyService] Error al detener foreground service:', err);
      }
    }

    this.state = {
      ...this.state,
      phase: 'STOPPED',
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
      noBridge2Min: false,
    };
    this.notify();

    // Transición visual breve para dar retroalimentación a la UI
    this.stopResetTimer = setTimeout(() => {
      this.state = {
        ...this.state,
        phase: 'IDLE',
        severity: undefined,
        startedAt: undefined,
        cancelDeadline: undefined,
        beaconActive: false,
        meshActive: false,
        medicalCardArmed: false,
        noBridge2Min: false,
      };
      this.notify();
    }, this.stopResetDelayMs);
  }

  /**
   * "Estoy a salvo" (RF-05, JD-034).
   * Detiene la emergencia, fija gravedad en ILESO y encola reporte si el servicio de reportes está disponible.
   */
  public async markSafe(): Promise<void> {
    this.clearAllTimers();

    if (this.deps.signaling) {
      try {
        await this.deps.signaling.stop();
      } catch {}
    }

    if (this.deps.foreground) {
      try {
        await this.deps.foreground.stop();
      } catch {}
    }

    this.state = {
      ...this.state,
      phase: 'IDLE',
      severity: 'ILESO',
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
      noBridge2Min: false,
    };
    this.notify();

    if (this.deps.reports) {
      this.deps.reports
        .reportDamage({
          category: 'OTRO',
          description: 'ESTOY_A_SALVO',
          position: this.state.lastPosition,
        })
        .catch(() => {});
    }
  }

  /**
   * Activación de emergencia una vez cumplidos los 3 segundos de confirmación.
   * Dispara flash y tono simultáneo en < 300 ms, inicia la baliza BLE,
   * arma la ficha médica si existe, adquiere GPS y lanza el servicio en primer plano.
   */
  private async activateEmergency(): Promise<void> {
    if (this.state.phase !== 'CONFIRMING') {
      return;
    }

    this.confirmTimer = undefined;

    // 1. Armar ficha médica si existe (RF-13)
    let medicalCardArmed = false;
    if (this.deps.medical) {
      try {
        medicalCardArmed = await this.deps.medical.exists();
      } catch {
        medicalCardArmed = false;
      }
    }

    // 2. Transición a estado ACTIVE
    this.state = {
      ...this.state,
      phase: 'ACTIVE',
      cancelDeadline: undefined,
      beaconActive: true,
      meshActive: true,
      medicalCardArmed,
    };
    this.notify();

    // 3. Activar señalización física < 300 ms (RF-06, RNF-05)
    if (this.deps.signaling) {
      try {
        await this.deps.signaling.start(this.state.lowPower);
      } catch (err) {
        console.warn('[EmergencyService] Error al activar señalización física:', err);
      }
    }

    // 4. Activar servicio en primer plano Android
    if (this.deps.foreground) {
      try {
        await this.deps.foreground.start(
          'EarthQuakeTracker - EMERGENCIA ACTIVA',
          'Baliza de socorro y señalización física en curso'
        );
      } catch (err) {
        console.warn('[EmergencyService] Error al iniciar foreground service:', err);
      }
    }

    // 5. Adquirir ubicación GPS
    if (this.deps.location) {
      try {
        const pos = await this.deps.location.getCurrentPosition();
        if (pos) {
          this.state = { ...this.state, lastPosition: pos };
          this.notify();
        }
      } catch {}
    }

    // 6. Persistir evento en almacenamiento local seguro (JD-030)
    if (this.deps.storage) {
      try {
        const record: EmergencyEventRecord = {
          id: `emergency_${this.clock.now()}`,
          startedAt: this.state.startedAt ?? new Date(this.clock.now()).toISOString(),
          severity: this.state.severity ?? 'ATRAPADO',
          position: this.state.lastPosition,
          lowPower: this.state.lowPower,
        };
        await this.deps.storage.set('evento_emergencia', JSON.stringify(record));
      } catch (err) {
        console.warn('[EmergencyService] No se pudo persistir evento_emergencia:', err);
      }
    }

    // 7. Monitoreo de nodos puente por 2 min (D-25)
    this.startBridgeMonitor();
  }

  private startBridgeMonitor(): void {
    if (this.bridgeTimer) {
      clearTimeout(this.bridgeTimer);
    }

    this.bridgeTimer = setTimeout(() => {
      if (this.state.phase === 'ACTIVE') {
        const bridgeNearby = this.deps.mesh?.getStatus().bridgeNearby ?? false;
        if (!bridgeNearby) {
          this.state = { ...this.state, noBridge2Min: true };
          this.notify();
        }
      }
    }, this.noBridgeTimeoutMs);
  }

  private clearAllTimers(): void {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }
    if (this.bridgeTimer) {
      clearTimeout(this.bridgeTimer);
      this.bridgeTimer = undefined;
    }
    if (this.stopResetTimer) {
      clearTimeout(this.stopResetTimer);
      this.stopResetTimer = undefined;
    }
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public dispose(): void {
    this.clearAllTimers();
    if (this.powerUnsubscribe) {
      this.powerUnsubscribe();
      this.powerUnsubscribe = undefined;
    }
    this.listeners = [];
  }
}
