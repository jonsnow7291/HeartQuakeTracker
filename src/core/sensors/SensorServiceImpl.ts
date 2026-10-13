import { AppException } from '../../contracts/types';
import type { Unsubscribe, ISODate } from '../../contracts/types';
import type { SeismicAlert, SensorService } from '../../contracts/sensors';
import type { Clock } from '../platform/ports';
import { systemClock } from '../platform/ports';
import { Emitter } from '../util/emitter';
import { DEFAULT_SENSOR_CONFIG, SensorThresholdConfig } from './config';
import type { AccelerometerPort } from './ports';
import { SeismicSignalDetector } from './filter';

export interface SensorServiceDeps {
  accelerometer: AccelerometerPort;
  config?: Partial<SensorThresholdConfig>;
  clock?: Clock;
  /** Identificador propio del nodo (para evitar duplicar quórum). */
  localNodeId?: string;
}

interface NodeReadingRecord {
  nodeId: string;
  peakG: number;
  timestamp: number;
}

/**
 * SensorService real (RF-09, D-18).
 * - Acelerómetro a 50 Hz con filtro paso-alto que elimina gravedad de 1g.
 * - Detección local: RMS > 0.03 g durante ≥ 1 s => alerta sísmica 'POSSIBLE'.
 * - Quórum colaborativo: ≥ 3 nodos distintos en ventana de 10 s => 'CONFIRMED'.
 */
export class SensorServiceImpl implements SensorService {
  private readonly accelerometer: AccelerometerPort;
  private readonly config: SensorThresholdConfig;
  private readonly clock: Clock;
  private readonly localNodeId: string;
  private readonly emitter = new Emitter<SeismicAlert>();
  private readonly detector: SeismicSignalDetector;

  private running = false;
  private available = true;
  private lastAlertTime = 0;
  private currentEventId: string | null = null;
  private currentEventPeakG = 0;
  private activeQuorumNodes = new Map<string, NodeReadingRecord>();
  private confirmedForCurrentEvent = false;

  constructor(deps: SensorServiceDeps) {
    this.accelerometer = deps.accelerometer;
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...deps.config };
    this.clock = deps.clock ?? systemClock;
    this.localNodeId = deps.localNodeId ?? 'self';
    this.detector = new SeismicSignalDetector(this.config);

    if ('available' in this.accelerometer && typeof (this.accelerometer as { available?: unknown }).available === 'boolean') {
      this.available = Boolean((this.accelerometer as { available?: boolean }).available);
    }

    // Verificar disponibilidad inicial asíncrona
    this.accelerometer.isAvailable().then(
      (avail) => {
        this.available = avail;
      },
      () => {
        this.available = false;
      },
    );
  }

  isAvailable(): boolean {
    if ('available' in this.accelerometer && typeof (this.accelerometer as { available?: unknown }).available === 'boolean') {
      return Boolean((this.accelerometer as { available?: boolean }).available);
    }
    return this.available;
  }

  async start(): Promise<void> {
    this.available = await this.accelerometer.isAvailable();
    if (!this.available) {
      throw new AppException('NO_SENSORS', 'Sensores inerciales no disponibles en el dispositivo', false);
    }
    if (this.running) return;

    this.detector.reset();
    try {
      await this.accelerometer.start(this.config.sampleRateHz, (sample) => {
        this.onSampleReceived(sample);
      });
      this.running = true;
    } catch (err) {
      this.available = false;
      this.running = false;
      throw new AppException('NO_SENSORS', 'Error al iniciar lecturas del acelerómetro', true);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.accelerometer.stop();
    this.running = false;
    this.detector.reset();
  }

  subscribe(cb: (a: SeismicAlert) => void): Unsubscribe {
    return this.emitter.subscribe(cb);
  }

  /**
   * Registra una lectura sísmica recibida de otro nodo vía malla o servidor (RF-09, D-18).
   * Si se alcanza el quórum de ≥ 3 nodos en 10 s, eleva el evento a 'CONFIRMED'.
   */
  recordCollaborativeReading(nodeId: string, peakG: number, ts?: ISODate): void {
    const now = this.clock.now();
    this.cleanExpiredQuorum(now);

    this.activeQuorumNodes.set(nodeId, {
      nodeId,
      peakG,
      timestamp: ts ? Date.parse(ts) || now : now,
    });

    if (peakG > this.currentEventPeakG) {
      this.currentEventPeakG = peakG;
    }

    this.checkAndElevateQuorum(now);
  }

  // ---- Internos ----

  private onSampleReceived(sample: import('./ports').AccelerometerSample): void {
    const res = this.detector.processSample(sample);
    if (!res.detected) return;

    const now = this.clock.now();
    this.cleanExpiredQuorum(now);

    // Actualizar registro propio en el quórum
    this.activeQuorumNodes.set(this.localNodeId, {
      nodeId: this.localNodeId,
      peakG: res.peakG,
      timestamp: now,
    });

    if (res.peakG > this.currentEventPeakG) {
      this.currentEventPeakG = res.peakG;
    }

    // Verificar si ya emitimos una alerta reciente para el mismo evento
    const timeSinceLastAlert = now - this.lastAlertTime;
    if (!this.currentEventId || timeSinceLastAlert > this.config.quorumWindowMs) {
      // Nuevo evento sísmico detectado localmente
      this.currentEventId = `seis_${now}_${Math.floor(Math.random() * 1000)}`;
      this.confirmedForCurrentEvent = false;
      this.currentEventPeakG = res.peakG;
      this.lastAlertTime = now;

      const quorumCount = this.activeQuorumNodes.size;
      const alert: SeismicAlert = {
        id: this.currentEventId,
        ts: new Date(now).toISOString(),
        level: quorumCount >= this.config.quorumNodesNeeded ? 'CONFIRMED' : 'POSSIBLE',
        peakG: this.currentEventPeakG,
        quorumNodes: quorumCount,
        note: `Vibración anómala detectada (${res.peakG}g) durante ${res.activeDurationMs} ms.`,
      };

      if (alert.level === 'CONFIRMED') {
        this.confirmedForCurrentEvent = true;
      }

      this.emitter.emit(alert);
    } else {
      // Evento ya activo: verificar si ahora alcanza quórum
      this.checkAndElevateQuorum(now);
    }
  }

  private checkAndElevateQuorum(now: number): void {
    if (this.confirmedForCurrentEvent) return;

    const quorumCount = this.activeQuorumNodes.size;
    if (quorumCount >= this.config.quorumNodesNeeded) {
      this.confirmedForCurrentEvent = true;
      const eventId = this.currentEventId ?? `seis_${now}_${Math.floor(Math.random() * 1000)}`;
      this.currentEventId = eventId;
      this.lastAlertTime = now;

      const alert: SeismicAlert = {
        id: eventId,
        ts: new Date(now).toISOString(),
        level: 'CONFIRMED',
        peakG: this.currentEventPeakG,
        quorumNodes: quorumCount,
        note: `Alerta sísmica confirmada por quórum de ${quorumCount} nodos en ${this.config.quorumWindowMs / 1000} s.`,
      };

      this.emitter.emit(alert);
    }
  }

  private cleanExpiredQuorum(now: number): void {
    const expirationLimit = now - this.config.quorumWindowMs;
    for (const [nodeId, record] of this.activeQuorumNodes.entries()) {
      if (record.timestamp < expirationLimit) {
        this.activeQuorumNodes.delete(nodeId);
      }
    }
  }
}
