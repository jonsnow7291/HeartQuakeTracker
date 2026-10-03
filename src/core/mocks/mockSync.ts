import {
  SyncService,
  ReportService,
  SyncStatus,
  DamageReportInput,
  AidRequestInput,
  OwnReportSummary,
} from '../../contracts/sync';
import { Unsubscribe } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockSyncService implements SyncService {
  private devController?: MockDevScenarioController;
  private pendingCount: number = 0;
  private syncing: boolean = false;
  private listeners: ((s: SyncStatus) => void)[] = [];

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;

    if (this.devController) {
      this.devController.subscribe(() => {
        this.notify();
      });
    }
  }

  public getStatus(): SyncStatus {
    const isOffline = this.devController?.isScenarioActive('offline_total') ?? false;
    const isPartial = this.devController?.isScenarioActive('sync_parcial') ?? false;

    return {
      online: !isOffline,
      pending: isPartial ? Math.max(this.pendingCount, 2) : this.pendingCount,
      syncing: this.syncing,
      lastSyncAt: new Date().toISOString(),
      lastError: isPartial
        ? {
            code: 'SYNC_PARTIAL',
            message: 'Timeout al enviar parte de la cola de reportes',
            recoverable: true,
          }
        : undefined,
    };
  }

  public subscribe(cb: (s: SyncStatus) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async syncNow(): Promise<void> {
    const isOffline = this.devController?.isScenarioActive('offline_total') ?? false;
    if (isOffline) {
      const err = new Error('Sin conexión');
      (err as any).code = 'NETWORK_UNAVAILABLE';
      throw err;
    }

    this.syncing = true;
    this.notify();

    setTimeout(() => {
      this.syncing = false;
      this.pendingCount = 0;
      this.notify();
    }, 1200);
  }

  public addPending(): void {
    this.pendingCount += 1;
    this.notify();
  }

  private notify(): void {
    const st = this.getStatus();
    this.listeners.forEach((l) => l(st));
  }
}

export class MockReportService implements ReportService {
  private syncService: MockSyncService;
  private reports: OwnReportSummary[] = [];

  constructor(syncService: MockSyncService) {
    this.syncService = syncService;
  }

  public async reportDamage(input: DamageReportInput): Promise<void> {
    const item: OwnReportSummary = {
      id: `rep_${Date.now()}`,
      kind: `DAÑO: ${input.category}`,
      ts: new Date().toISOString(),
      synced: false,
    };
    this.reports.unshift(item);
    this.syncService.addPending();
  }

  public async requestAid(input: AidRequestInput): Promise<void> {
    const item: OwnReportSummary = {
      id: `aid_${Date.now()}`,
      kind: `AYUDA: ${input.need} (${input.people} personas)`,
      ts: new Date().toISOString(),
      synced: false,
    };
    this.reports.unshift(item);
    this.syncService.addPending();
  }

  public async listOwnReports(): Promise<OwnReportSummary[]> {
    return [...this.reports];
  }
}
