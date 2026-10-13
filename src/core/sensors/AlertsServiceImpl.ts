import type { Unsubscribe, Page, ISODate } from '../../contracts/types';
import type { AlertItem, AlertsService, SeismicAlert, SensorService } from '../../contracts/sensors';
import type { Clock, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';
import { Emitter } from '../util/emitter';

const ALERTS_STORE_KEY = 'alerts.history';
const PAGE_SIZE = 15;

export interface AlertsServiceDeps {
  sensorService: SensorService;
  store: KeyValueStore;
  clock?: Clock;
}

/**
 * AlertsService real (RF-09, RF-12).
 * - Historial persistente en KeyValueStore (SQLCipher / memoria).
 * - Escucha continua a SensorService: genera AlertItem con kind='SEISMIC' automáticamente.
 * - Paginación mediante cursor y programación de simulacros con scheduleDrill().
 */
export class AlertsServiceImpl implements AlertsService {
  private readonly sensorService: SensorService;
  private readonly store: KeyValueStore;
  private readonly clock: Clock;
  private readonly emitter = new Emitter<AlertItem>();
  private sensorUnsubscribe?: Unsubscribe;

  constructor(deps: AlertsServiceDeps) {
    this.sensorService = deps.sensorService;
    this.store = deps.store;
    this.clock = deps.clock ?? systemClock;

    this.initSensorListener();
  }

  private initSensorListener(): void {
    this.sensorUnsubscribe = this.sensorService.subscribe((seismic: SeismicAlert) => {
      // En fila: cada alerta lee y reescribe el historial; en paralelo se pisarían entre sí.
      this.alertQueue = this.alertQueue.then(() => this.handleSeismicAlert(seismic)).catch((err) => {
        console.error('[AlertsServiceImpl] Error al procesar alerta sísmica:', err);
      });
    });
  }

  async list(page?: string): Promise<Page<AlertItem>> {
    const all = await this.readAllAlerts();
    // Ordenar descendente por fecha
    all.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));

    const offset = page ? parseInt(page, 10) || 0 : 0;
    const items = all.slice(offset, offset + PAGE_SIZE);
    const nextOffset = offset + PAGE_SIZE;
    const next = nextOffset < all.length ? String(nextOffset) : undefined;

    return { items, next };
  }

  subscribeNew(cb: (a: AlertItem) => void): Unsubscribe {
    return this.emitter.subscribe(cb);
  }

  async scheduleDrill(at: ISODate, title: string): Promise<void> {
    const drillItem: AlertItem = {
      id: `drill_${this.clock.now()}_${++this.idSeq}`, // contador: hora + azar podía repetirse y un simulacro pisaba a otro
      kind: 'DRILL',
      title: title.trim(),
      body: `Simulacro agendado para ${at}`,
      ts: at,
    };

    await this.saveAlert(drillItem);
    this.emitter.emit(drillItem);
  }

  /** Detiene el listener al destruir el servicio. */
  destroy(): void {
    if (this.sensorUnsubscribe) {
      this.sensorUnsubscribe();
      this.sensorUnsubscribe = undefined;
    }
  }

  // ---- Internos ----

  private idSeq = 0;
  private alertQueue: Promise<unknown> = Promise.resolve();
  private inMemoryAlerts: AlertItem[] | null = null;

  private async handleSeismicAlert(seismic: SeismicAlert): Promise<void> {
    const isConfirmed = seismic.level === 'CONFIRMED';
    const item: AlertItem = {
      id: `alt_${seismic.id}`,
      kind: 'SEISMIC',
      title: isConfirmed ? '¡ALERTA SÍSMICA CONFIRMADA!' : 'Posible actividad sísmica detectada',
      body: isConfirmed
        ? `Aceleración detectada: ${seismic.peakG}g. Validador por quórum de ${seismic.quorumNodes} teléfonos.`
        : `Aceleración detectada: ${seismic.peakG}g. En espera de validación colaborativa...`,
      ts: seismic.ts,
      seismic,
    };

    if (!this.inMemoryAlerts) {
      this.inMemoryAlerts = [];
    }
    const idx = this.inMemoryAlerts.findIndex((a) => a.id === item.id);
    if (idx >= 0) {
      this.inMemoryAlerts[idx] = item;
    } else {
      this.inMemoryAlerts.unshift(item);
    }

    this.emitter.emit(item);
    await this.saveAlert(item);
  }

  private async readAllAlerts(): Promise<AlertItem[]> {
    if (this.inMemoryAlerts) {
      return [...this.inMemoryAlerts];
    }

    const raw = await this.store.get(ALERTS_STORE_KEY);
    if (!raw) {
      // Historial vacío: no se inventan alertas ni simulacros; solo existen los eventos que ocurren de verdad
      // (lecturas del acelerómetro) o los que el usuario agenda.
      this.inMemoryAlerts = [];
      return [];
    }

    try {
      this.inMemoryAlerts = JSON.parse(raw) as AlertItem[];
      return [...this.inMemoryAlerts];
    } catch {
      this.inMemoryAlerts = [];
      return [];
    }
  }

  private async saveAlert(item: AlertItem): Promise<void> {
    const all = await this.readAllAlerts();
    // Evitar duplicados por id
    const existingIdx = all.findIndex((a) => a.id === item.id);
    if (existingIdx >= 0) {
      all[existingIdx] = item;
    } else {
      all.unshift(item);
    }
    this.inMemoryAlerts = all;
    await this.store.set(ALERTS_STORE_KEY, JSON.stringify(all));
  }
}
