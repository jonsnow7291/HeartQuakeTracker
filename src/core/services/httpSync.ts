import {
  SyncService,
  ReportService,
  SyncStatus,
  DamageReportInput,
  AidRequestInput,
  OwnReportSummary,
} from '../../contracts/sync';
import { Unsubscribe } from '../../contracts/types';
import { ApiClient } from '../api/client';
import { MockDevScenarioController } from '../mocks/mockDevScenarios';

interface QueuedEvent {
  id: string;
  type: 'REPORT_DAMAGE' | 'REQUEST_AID' | 'MARK_SAFE' | 'POI_PROBLEM';
  payload: Record<string, unknown>;
  ts: string;
  synced: boolean;
}

export class HttpSyncService implements SyncService, ReportService {
  private client: ApiClient;
  private devController?: MockDevScenarioController;

  private queue: QueuedEvent[] = [];
  private listeners: ((s: SyncStatus) => void)[] = [];
  private syncing: boolean = false;
  private lastSyncAt?: string;
  private lastError?: any;

  constructor(client: ApiClient, devController?: MockDevScenarioController) {
    this.client = client;
    this.devController = devController;

    // Periodically sync every 30 seconds if online
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        if (this.queue.some((e) => !e.synced)) {
          this.syncNow().catch(() => {});
        }
      }, 30000);
    }
  }

  public getStatus(): SyncStatus {
    const isOffline = this.devController?.isScenarioActive('offline_total') ?? false;
    const pendingCount = this.queue.filter((e) => !e.synced).length;
    return {
      online: !isOffline,
      pending: pendingCount,
      lastSyncAt: this.lastSyncAt,
      syncing: this.syncing,
      lastError: this.lastError,
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
    if (this.devController?.isScenarioActive('offline_total')) {
      return;
    }

    const unsynced = this.queue.filter((e) => !e.synced);
    if (unsynced.length === 0) {
      return;
    }

    this.syncing = true;
    this.notify();

    try {
      const events = unsynced.map((item) => ({
        eventId: item.id,
        type: item.type,
        ts: item.ts,
        device: this.client.deviceId || 'dev_mobile_user',
        payload: item.payload,
      }));

      const res = await this.client.syncBatch(events);
      if (res.acks) {
        for (const ack of res.acks) {
          if (ack.status === 'OK' || ack.status === 'DUP') {
            const found = this.queue.find((q) => q.id === ack.eventId);
            if (found) found.synced = true;
          }
        }
      }

      this.lastSyncAt = new Date().toISOString();
      this.lastError = undefined;
    } catch (err: any) {
      this.lastError = {
        code: 'SYNC_PARTIAL',
        message: err.message || 'Error al sincronizar con el servidor',
        recoverable: true,
      };
    } finally {
      this.syncing = false;
      this.notify();
    }
  }

  public async reportDamage(input: DamageReportInput): Promise<void> {
    const id = `dmg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const event: QueuedEvent = {
      id,
      type: 'REPORT_DAMAGE',
      ts: new Date().toISOString(),
      payload: {
        category: input.category,
        description: input.description,
        position: input.position,
      },
      synced: false,
    };

    this.queue.push(event);
    this.notify();

    // Trigger immediate opportunistic sync
    this.syncNow().catch(() => {});
  }

  public async requestAid(input: AidRequestInput): Promise<void> {
    const id = `aid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const event: QueuedEvent = {
      id,
      type: 'REQUEST_AID',
      ts: new Date().toISOString(),
      payload: {
        need: input.need,
        people: input.people,
        position: input.position,
      },
      synced: false,
    };

    this.queue.push(event);
    this.notify();

    this.syncNow().catch(() => {});
  }

  public async listOwnReports(): Promise<OwnReportSummary[]> {
    return this.queue.map((q) => ({
      id: q.id,
      kind: q.type,
      ts: q.ts,
      synced: q.synced,
    }));
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }
}
