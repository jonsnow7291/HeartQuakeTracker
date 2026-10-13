import { AppException } from '../../contracts/types';
import type { AidRequestInput, DamageReportInput, OwnReportSummary, ReportService } from '../../contracts/sync';
import type { Clock, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';
import type { SyncServiceImpl } from './SyncServiceImpl';

const REPORTS_STORE_KEY = 'reports.own';

export interface ReportServiceDeps {
  syncService: SyncServiceImpl;
  store: KeyValueStore;
  clock?: Clock;
}

interface StoredReportItem {
  id: string;
  kind: string;
  ts: string;
  synced: boolean;
}

/**
 * ReportService real (RF-12, D-25).
 * - Encola reportes de daños y solicitudes de ayuda en SyncService.
 * - Almacena copia local en KeyValueStore.
 * - Mantiene sincronizado el estado 'synced' según los ACKs recibidos por SyncService.
 */
export class ReportServiceImpl implements ReportService {
  private readonly syncService: SyncServiceImpl;
  private readonly store: KeyValueStore;
  private readonly clock: Clock;

  constructor(deps: ReportServiceDeps) {
    this.syncService = deps.syncService;
    this.store = deps.store;
    this.clock = deps.clock ?? systemClock;
  }

  async reportDamage(input: DamageReportInput): Promise<void> {
    if (!input.description || !input.description.trim()) {
      throw new AppException('VALIDATION', 'La descripción del daño es obligatoria');
    }
    const validCategories = ['ESTRUCTURAL', 'SERVICIOS', 'VIAS', 'OTRO'];
    if (!validCategories.includes(input.category)) {
      throw new AppException('VALIDATION', 'Categoría de daño inválida');
    }

    const now = this.clock.now();
    const id = `rep_${now}_${Math.random().toString(36).substring(2, 8)}`;
    const ts = new Date(now).toISOString();

    const summary: StoredReportItem = {
      id,
      // «Estoy a salvo» viaja como un reporte con descripción ESTOY_A_SALVO: se etiqueta con su propio tipo, no como daño.
      kind: input.description.trim().toUpperCase() === 'ESTOY_A_SALVO' ? 'ESTOY_A_SALVO' : `DAÑO: ${input.category}`,
      ts,
      synced: false,
    };

    // 1. Guardar localmente
    await this.addReportLocal(summary);

    // 2. Encolar en SyncService
    await this.syncService.enqueue({
      id,
      type: 'REPORT_DAMAGE',
      ts,
      payload: {
        category: input.category,
        description: input.description.trim(),
      },
      geo: input.position
        ? {
            lat: input.position.lat,
            lon: input.position.lon,
            acc: input.position.accuracyM,
          }
        : undefined,
    });
  }

  async requestAid(input: AidRequestInput): Promise<void> {
    if (!input.need || !input.need.trim()) {
      throw new AppException('VALIDATION', 'La necesidad de ayuda es obligatoria');
    }
    if (typeof input.people !== 'number' || input.people <= 0) {
      throw new AppException('VALIDATION', 'La cantidad de personas debe ser al menos 1');
    }

    const now = this.clock.now();
    const id = `aid_${now}_${Math.random().toString(36).substring(2, 8)}`;
    const ts = new Date(now).toISOString();

    const summary: StoredReportItem = {
      id,
      kind: `AYUDA: ${input.need.trim()} (${input.people} personas)`,
      ts,
      synced: false,
    };

    // 1. Guardar localmente
    await this.addReportLocal(summary);

    // 2. Encolar en SyncService
    await this.syncService.enqueue({
      id,
      type: 'REQUEST_AID',
      ts,
      payload: {
        need: input.need.trim(),
        people: input.people,
      },
      geo: input.position
        ? {
            lat: input.position.lat,
            lon: input.position.lon,
            acc: input.position.accuracyM,
          }
        : undefined,
    });
  }

  async listOwnReports(): Promise<OwnReportSummary[]> {
    const stored = await this.readReportsLocal();
    const queue = await this.syncService.getQueue();
    const pendingIds = new Set(queue.map((q) => q.id));

    let modified = false;
    const summaries: OwnReportSummary[] = stored.map((item) => {
      // Si ya no está en la cola pendiente, fue confirmado con éxito
      const isSynced = !pendingIds.has(item.id);
      if (item.synced !== isSynced) {
        item.synced = isSynced;
        modified = true;
      }
      return {
        id: item.id,
        kind: item.kind,
        ts: item.ts,
        synced: item.synced,
      };
    });

    if (modified) {
      await this.writeReportsLocal(stored);
    }

    // Ordenar descendente por fecha
    return summaries.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  }

  // ---- Internos ----

  private async readReportsLocal(): Promise<StoredReportItem[]> {
    const raw = await this.store.get(REPORTS_STORE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as StoredReportItem[];
    } catch {
      return [];
    }
  }

  private async writeReportsLocal(reports: StoredReportItem[]): Promise<void> {
    await this.store.set(REPORTS_STORE_KEY, JSON.stringify(reports));
  }

  private async addReportLocal(item: StoredReportItem): Promise<void> {
    const reports = await this.readReportsLocal();
    reports.unshift(item);
    await this.writeReportsLocal(reports);
  }
}
