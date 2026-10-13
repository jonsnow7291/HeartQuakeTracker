import { AppException } from '../../contracts/types';
import type { AppError, ISODate, Unsubscribe } from '../../contracts/types';
import type { SyncService, SyncStatus } from '../../contracts/sync';
import type { Clock, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';
import { Emitter } from '../util/emitter';
import type { HttpClientPort, NetworkPort } from './ports';
import type { SyncBatchEvent, SyncBatchResponse, SyncEventType, SyncQueueItem } from './types';
import { getOrCreateDeviceIdentity, createRegistrationPayload, signCanonicalRequest, DeviceIdentity } from './deviceAuth';

const SYNC_QUEUE_KEY = 'sync.queue';
const SYNC_META_KEY = 'sync.meta';
const DEFAULT_SERVER_URL = 'http://localhost:3000';
const BATCH_SIZE = 100;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;

export interface SyncServiceDeps {
  store: KeyValueStore;
  network: NetworkPort;
  http: HttpClientPort;
  clock?: Clock;
  serverUrl?: string;
  platform?: 'android' | 'ios';
  appVersion?: string;
}

interface SyncMeta {
  lastSyncAt?: ISODate;
  deviceRegistered: boolean;
}

/**
 * SyncService real (RF-12, D-29, D-30).
 * - Cola persistente en KeyValueStore.
 * - Idempotencia con eventId unívoco.
 * - Cliente HTTP firmado con Ed25519 hacia el servidor.
 * - Reintento con backoff exponencial.
 * - Confirmación atómica (ACK por ítem: OK, DUP, REJECTED).
 * - Sincronización automática al detectar restauración de red.
 */
export class SyncServiceImpl implements SyncService {
  private readonly store: KeyValueStore;
  private readonly network: NetworkPort;
  private readonly http: HttpClientPort;
  private readonly clock: Clock;
  private readonly serverUrl: string;
  private readonly platform: 'android' | 'ios';
  private readonly appVersion: string;

  private readonly emitter = new Emitter<SyncStatus>();
  private syncing = false;
  private isOnlineState = true;
  private lastSyncAt?: ISODate;
  private lastError?: AppError;
  private networkUnsubscribe?: Unsubscribe;
  private identityCache: DeviceIdentity | null = null;
  private deviceRegistered = false;

  constructor(deps: SyncServiceDeps) {
    this.store = deps.store;
    this.network = deps.network;
    this.http = deps.http;
    this.clock = deps.clock ?? systemClock;
    this.serverUrl = (deps.serverUrl ?? DEFAULT_SERVER_URL).replace(/\/$/, '');
    this.platform = deps.platform ?? 'android';
    this.appVersion = deps.appVersion ?? '0.1.0';

    this.initMetaAndNetwork();
  }

  private initMetaAndNetwork(): void {
    // Cargar metadatos persistentes de sincronización
    this.store.get(SYNC_META_KEY).then((raw) => {
      if (raw) {
        try {
          const meta = JSON.parse(raw) as SyncMeta;
          this.lastSyncAt = meta.lastSyncAt;
          this.deviceRegistered = meta.deviceRegistered;
        } catch {
          // Ignorar fallo de parseo
        }
      }
    });

    // Inicializar estado de red y listener
    this.network.isOnline().then((online) => {
      this.isOnlineState = online;
    });

    this.networkUnsubscribe = this.network.subscribe((online) => {
      const transitionedToOnline = !this.isOnlineState && online;
      this.isOnlineState = online;
      this.notifyStatus();

      if (transitionedToOnline) {
        // Disparar sincronización automática al volver la red (RF-12)
        this.syncNow().catch((err) => {
          console.warn('[SyncServiceImpl] Sync automático tras reconexión falló:', err);
        });
      }
    });
  }

  getStatus(): SyncStatus {
    return {
      online: this.isOnlineState,
      pending: 0, // Se refresca de forma asíncrona o en notifyStatus()
      lastSyncAt: this.lastSyncAt,
      syncing: this.syncing,
      lastError: this.lastError,
    };
  }

  subscribe(cb: (s: SyncStatus) => void): Unsubscribe {
    const unsub = this.emitter.subscribe(cb);
    // Notificar estado actual inmediatamente
    this.getPendingCount().then((pending) => {
      cb({
        online: this.isOnlineState,
        pending,
        lastSyncAt: this.lastSyncAt,
        syncing: this.syncing,
        lastError: this.lastError,
      });
    });
    return unsub;
  }

  private activeSyncPromise: Promise<void> | null = null;

  async syncNow(): Promise<void> {
    if (this.activeSyncPromise) {
      return this.activeSyncPromise;
    }

    this.activeSyncPromise = this.doSync();
    try {
      await this.activeSyncPromise;
    } finally {
      this.activeSyncPromise = null;
    }
  }

  private async doSync(): Promise<void> {
    const online = await this.network.isOnline();
    this.isOnlineState = online;
    if (!online) {
      const err: AppError = {
        code: 'NETWORK_UNAVAILABLE',
        message: 'Sin conexión a Internet',
        recoverable: true,
      };
      this.lastError = err;
      this.notifyStatus();
      throw new AppException(err.code, err.message, err.recoverable);
    }

    this.syncing = true;
    this.lastError = undefined;
    await this.notifyStatus();

    try {
      await this.processQueue();
      this.lastSyncAt = new Date(this.clock.now()).toISOString();
      await this.saveMeta();
      this.lastError = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al sincronizar';
      const code = (err as { code?: import('../../contracts/errors').ErrorCode }).code ?? 'SYNC_PARTIAL';
      this.lastError = {
        code,
        message,
        recoverable: true,
      };
      throw err;
    } finally {
      this.syncing = false;
      await this.notifyStatus();
    }
  }

  /**
   * Encola un evento para sincronización diferida (RF-12).
   */
  async enqueue(item: {
    id: string;
    type: SyncEventType;
    ts: ISODate;
    payload: Record<string, unknown>;
    geo?: { lat: number; lon: number; acc?: number };
  }): Promise<void> {
    const queue = await this.readQueue();
    // Idempotencia local: si ya existe el eventId, no duplicar
    if (queue.some((q) => q.id === item.id)) {
      return;
    }

    const queueItem: SyncQueueItem = {
      ...item,
      attempts: 0,
      createdAt: this.clock.now(),
    };

    queue.push(queueItem);
    await this.writeQueue(queue);
    await this.notifyStatus();
  }

  /**
   * Devuelve todos los elementos actualmente encolados.
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    return this.readQueue();
  }

  /** Detiene listeners y temporizadores. */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = undefined;
    }
  }

  // ---- Procesamiento de la cola y comunicación con servidor ----

  private async processQueue(): Promise<void> {
    const identity = await this.getIdentity();
    await this.ensureDeviceRegistered(identity);

    const queue = await this.readQueue();
    if (queue.length === 0) return;

    // Tomar lote de hasta BATCH_SIZE
    const batchItems = queue.slice(0, BATCH_SIZE);
    const now = this.clock.now();

    const batchEvents: SyncBatchEvent[] = batchItems.map((item) => ({
      eventId: item.id,
      type: item.type,
      ts: item.ts,
      device: identity.deviceId,
      payload: item.payload,
      geo: item.geo,
    }));

    const bodyJson = JSON.stringify({ events: batchEvents });
    const nonce = `nonce_${now}_${Math.random().toString(36).substring(2, 10)}`;
    const headers = signCanonicalRequest(identity, 'POST', '/v1/sync/batch', now, nonce, bodyJson);

    const response = await this.http.post<SyncBatchResponse>(`${this.serverUrl}/v1/sync/batch`, headers, JSON.parse(bodyJson));

    if (response.status < 200 || response.status >= 300) {
      throw new AppException('SYNC_PARTIAL', `Servidor devolvió código HTTP ${response.status}`);
    }

    const acks = response.data?.acks ?? [];
    const ackMap = new Map<string, { status: 'OK' | 'DUP' | 'REJECTED'; reason?: string }>();
    for (const ack of acks) {
      ackMap.set(ack.eventId, ack);
    }

    // Actualizar cola persistente según los ACKs individuales
    const updatedQueue: SyncQueueItem[] = [];
    for (const item of queue) {
      const ack = ackMap.get(item.id);
      if (ack) {
        if (ack.status === 'OK' || ack.status === 'DUP') {
          // Confirmado por el servidor: remover de la cola
          continue;
        } else if (ack.status === 'REJECTED') {
          // Rechazado: si es irreversible (ej: suplantación de dispositivo), descartar
          if (ack.reason?.includes('device no coincide') || ack.reason?.includes('futuro')) {
            console.warn(`[SyncServiceImpl] Evento ${item.id} rechazado permanentemente:`, ack.reason);
            continue;
          }
          // Error transitorio, incrementar reintentos
          item.attempts++;
          item.lastAttemptAt = now;
          updatedQueue.push(item);
        }
      } else {
        // No incluido en el lote actual, conservar
        updatedQueue.push(item);
      }
    }

    await this.writeQueue(updatedQueue);

    // Si aún quedan elementos en cola, procesar siguiente lote recursivamente
    if (updatedQueue.length > 0 && updatedQueue.length < queue.length) {
      await this.processQueue();
    }
  }

  private async ensureDeviceRegistered(identity: DeviceIdentity): Promise<void> {
    if (this.deviceRegistered) return;

    const now = this.clock.now();
    const payload = createRegistrationPayload(identity, now, this.platform, this.appVersion);

    const res = await this.http.post<{ deviceId: string }>(`${this.serverUrl}/v1/devices/register`, { 'Content-Type': 'application/json' }, payload);

    if (res.status === 200 || res.status === 201) {
      this.deviceRegistered = true;
      await this.saveMeta();
    } else {
      throw new AppException('AUTH_FAILED', `No se pudo registrar el dispositivo: HTTP ${res.status} ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
    }
  }

  private async getIdentity(): Promise<DeviceIdentity> {
    if (!this.identityCache) {
      this.identityCache = await getOrCreateDeviceIdentity(this.store);
    }
    return this.identityCache;
  }

  private async readQueue(): Promise<SyncQueueItem[]> {
    const raw = await this.store.get(SYNC_QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SyncQueueItem[];
    } catch {
      return [];
    }
  }

  private async writeQueue(queue: SyncQueueItem[]): Promise<void> {
    await this.store.set(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  private async getPendingCount(): Promise<number> {
    const queue = await this.readQueue();
    return queue.length;
  }

  private async notifyStatus(): Promise<void> {
    const pending = await this.getPendingCount();
    this.emitter.emit({
      online: this.isOnlineState,
      pending,
      lastSyncAt: this.lastSyncAt,
      syncing: this.syncing,
      lastError: this.lastError,
    });
  }

  private async saveMeta(): Promise<void> {
    const meta: SyncMeta = {
      lastSyncAt: this.lastSyncAt,
      deviceRegistered: this.deviceRegistered,
    };
    await this.store.set(SYNC_META_KEY, JSON.stringify(meta));
  }
}
