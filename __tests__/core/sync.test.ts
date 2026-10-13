import { AppException } from '../../src/contracts/types';
import type { HttpClientPort, HttpResponse, NetworkPort } from '../../src/core/sync/ports';
import type { SyncBatchResponse } from '../../src/core/sync/types';
import {
  createRegistrationPayload,
  deviceIdFromPubkey,
  getOrCreateDeviceIdentity,
  sha256Hex,
  signCanonicalRequest,
  verifyEd25519Signature,
} from '../../src/core/sync/deviceAuth';
import { SyncServiceImpl } from '../../src/core/sync/SyncServiceImpl';
import { ReportServiceImpl } from '../../src/core/sync/ReportServiceImpl';
import { buildSmsUrl, formatEmergencySmsText } from '../../src/core/sync/sms';
import { fromBase64, utf8 } from '../../src/core/util/bytes';
import { FakeClock, MemoryKeyValueStore } from './support/nodePorts';

class FakeNetworkPort implements NetworkPort {
  private online = true;
  private listeners: ((online: boolean) => void)[] = [];

  async isOnline(): Promise<boolean> {
    return this.online;
  }

  subscribe(cb: (online: boolean) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  setOnline(online: boolean): void {
    if (this.online !== online) {
      this.online = online;
      for (const l of this.listeners) l(online);
    }
  }
}

class FakeHttpClientPort implements HttpClientPort {
  registeredDevices = new Set<string>();
  receivedBatches: Array<{ headers: Record<string, string>; body: any }> = [];
  shouldFailBatch = false;
  batchResponseAcks?: Array<{ eventId: string; status: 'OK' | 'DUP' | 'REJECTED'; reason?: string }>;

  async post<T>(url: string, headers: Record<string, string>, body: unknown): Promise<HttpResponse<T>> {
    if (url.endsWith('/v1/devices/register')) {
      const payload = body as any;
      const deviceId = deviceIdFromPubkey(payload.publicKey);
      this.registeredDevices.add(deviceId);
      return {
        status: 201,
        data: { deviceId } as T,
      };
    }

    if (url.endsWith('/v1/sync/batch')) {
      if (this.shouldFailBatch) {
        return {
          status: 500,
          data: { error: 'INTERNAL_ERROR' } as T,
        };
      }

      this.receivedBatches.push({ headers, body });
      const events = (body as any)?.events ?? [];

      const acks =
        this.batchResponseAcks ??
        events.map((e: any) => ({
          eventId: e.eventId,
          status: 'OK',
        }));

      return {
        status: 200,
        data: { acks } as T,
      };
    }

    return {
      status: 404,
      data: { error: 'NOT_FOUND' } as T,
    };
  }
}

describe('P4 - Sincronización, reportes y SMS (RF-12, D-25)', () => {
  describe('deviceAuth - Criptografía Ed25519 y firmas de petición', () => {
    let store: MemoryKeyValueStore;

    beforeEach(() => {
      store = new MemoryKeyValueStore();
    });

    it('genera par de claves Ed25519 y deriva deviceId con formato dev_16hex', async () => {
      const id = await getOrCreateDeviceIdentity(store);
      expect(id.deviceId).toMatch(/^dev_[0-9a-f]{16}$/);
      expect(id.publicKeyBase64).toBeDefined();
      expect(id.privateKeyBase64).toBeDefined();

      // Persistencia: al llamar nuevamente debe recuperar la misma identidad
      const id2 = await getOrCreateDeviceIdentity(store);
      expect(id2.deviceId).toBe(id.deviceId);
      expect(id2.publicKeyBase64).toBe(id.publicKeyBase64);
    });

    it('genera prueba de posesión válida para el registro de dispositivo en el servidor', async () => {
      const identity = await getOrCreateDeviceIdentity(store);
      const ts = 1775235600000;
      const payload = createRegistrationPayload(identity, ts, 'android', '0.1.0');

      expect(payload.publicKey).toBe(identity.publicKeyBase64);
      expect(payload.ts).toBe(ts);

      // Verificar firma Ed25519 de "register|publicKey|ts" tal como lo hace el servidor
      const message = `register|${payload.publicKey}|${ts}`;
      const isValid = verifyEd25519Signature(payload.publicKey, message, payload.proof);
      expect(isValid).toBe(true);
    });

    it('construye cabeceras HTTP y firma canónica Ed25519 verificable por el servidor', async () => {
      const identity = await getOrCreateDeviceIdentity(store);
      const ts = 1775235600000;
      const nonce = 'nonce_abc123';
      const bodyJson = JSON.stringify({ events: [{ eventId: 'evt_1', type: 'MARK_SAFE' }] });

      const headers = signCanonicalRequest(identity, 'POST', '/v1/sync/batch', ts, nonce, bodyJson);

      expect(headers['X-Device-Id']).toBe(identity.deviceId);
      expect(headers['X-Timestamp']).toBe(String(ts));
      expect(headers['X-Nonce']).toBe(nonce);
      expect(headers['X-Signature']).toBeDefined();

      // Verificar la firma de la cadena canónica
      const bodyHash = sha256Hex(utf8(bodyJson));
      const canonical = ['POST', '/v1/sync/batch', String(ts), nonce, bodyHash].join('\n');
      const verified = verifyEd25519Signature(identity.publicKeyBase64, canonical, headers['X-Signature']!);
      expect(verified).toBe(true);
    });
  });

  describe('SyncServiceImpl', () => {
    let store: MemoryKeyValueStore;
    let network: FakeNetworkPort;
    let http: FakeHttpClientPort;
    let clock: FakeClock;
    let syncService: SyncServiceImpl;

    beforeEach(() => {
      store = new MemoryKeyValueStore();
      network = new FakeNetworkPort();
      http = new FakeHttpClientPort();
      clock = new FakeClock();
      syncService = new SyncServiceImpl({
        store,
        network,
        http,
        clock,
        serverUrl: 'http://localhost:3000',
      });
    });

    afterEach(() => {
      syncService.destroy();
    });

    it('encola eventos persistentemente y previene duplicados (idempotencia)', async () => {
      await syncService.enqueue({
        id: 'evt_001',
        type: 'REPORT_DAMAGE',
        ts: new Date(clock.now()).toISOString(),
        payload: { category: 'ESTRUCTURAL', description: 'Grietas' },
      });

      // Intento de encolar duplicado
      await syncService.enqueue({
        id: 'evt_001',
        type: 'REPORT_DAMAGE',
        ts: new Date(clock.now()).toISOString(),
        payload: { category: 'ESTRUCTURAL', description: 'Grietas duplicadas' },
      });

      const queue = await syncService.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0]?.id).toBe('evt_001');
    });

    it('falla con NETWORK_UNAVAILABLE si se intenta syncNow() sin conexión', async () => {
      network.setOnline(false);
      await expect(syncService.syncNow()).rejects.toThrow(AppException);
      const status = syncService.getStatus();
      expect(status.online).toBe(false);
      expect(status.lastError?.code).toBe('NETWORK_UNAVAILABLE');
    });

    it('registra el dispositivo y vacía la cola al recibir ACKs exitosos del servidor', async () => {
      await syncService.enqueue({
        id: 'evt_101',
        type: 'MARK_SAFE',
        ts: new Date(clock.now()).toISOString(),
        payload: {},
      });
      await syncService.enqueue({
        id: 'evt_102',
        type: 'REQUEST_AID',
        ts: new Date(clock.now()).toISOString(),
        payload: { need: 'Agua', people: 4 },
      });

      expect((await syncService.getQueue()).length).toBe(2);

      await syncService.syncNow();

      // El dispositivo debe haberse registrado
      expect(http.registeredDevices.size).toBe(1);
      // El lote debió enviarse con 2 eventos
      expect(http.receivedBatches.length).toBe(1);
      expect(http.receivedBatches[0]?.body.events.length).toBe(2);

      // Como el servidor respondió con status OK, la cola debe quedar vacía
      const remainingQueue = await syncService.getQueue();
      expect(remainingQueue.length).toBe(0);

      const status = syncService.getStatus();
      expect(status.pending).toBe(0);
      expect(status.lastSyncAt).toBeDefined();
    });

    it('dispara sincronización automática al detectar restauración de red (RF-12)', async () => {
      // Dispositivo offline con reporte generado
      network.setOnline(false);
      await syncService.enqueue({
        id: 'evt_offline_1',
        type: 'REPORT_DAMAGE',
        ts: new Date(clock.now()).toISOString(),
        payload: { category: 'VIAS', description: 'Derrumbe' },
      });

      expect(http.receivedBatches.length).toBe(0);

      // Se restablece la conectividad
      network.setOnline(true);

      // Esperar breve tick para evento reactivo
      await new Promise((r) => setTimeout(r, 50));

      expect(http.receivedBatches.length).toBe(1);
      expect((await syncService.getQueue()).length).toBe(0);
    });

    it('retiene en la cola los eventos rechazados con error recuperable o si falla el servidor', async () => {
      await syncService.enqueue({
        id: 'evt_fail_1',
        type: 'REPORT_DAMAGE',
        ts: new Date(clock.now()).toISOString(),
        payload: { category: 'OTRO', description: 'Poste caído' },
      });

      http.shouldFailBatch = true;

      await expect(syncService.syncNow()).rejects.toThrow();

      // Debe permanecer en la cola para reintento posterior
      const queue = await syncService.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0]?.id).toBe('evt_fail_1');
    });
  });

  describe('ReportServiceImpl', () => {
    let store: MemoryKeyValueStore;
    let syncStore: MemoryKeyValueStore;
    let network: FakeNetworkPort;
    let http: FakeHttpClientPort;
    let clock: FakeClock;
    let syncService: SyncServiceImpl;
    let reportService: ReportServiceImpl;

    beforeEach(() => {
      store = new MemoryKeyValueStore();
      syncStore = new MemoryKeyValueStore();
      network = new FakeNetworkPort();
      http = new FakeHttpClientPort();
      clock = new FakeClock();
      syncService = new SyncServiceImpl({
        store: syncStore,
        network,
        http,
        clock,
      });
      reportService = new ReportServiceImpl({
        syncService,
        store,
        clock,
      });
    });

    afterEach(() => {
      syncService.destroy();
    });

    it('valida campos obligatorios en reportDamage()', async () => {
      await expect(
        reportService.reportDamage({
          category: 'ESTRUCTURAL',
          description: '',
        }),
      ).rejects.toThrow(AppException);

      await expect(
        reportService.reportDamage({
          category: 'INVALID' as any,
          description: 'Algo',
        }),
      ).rejects.toThrow(AppException);
    });

    it('valida campos obligatorios en requestAid()', async () => {
      await expect(
        reportService.requestAid({
          need: '',
          people: 2,
        }),
      ).rejects.toThrow(AppException);

      await expect(
        reportService.requestAid({
          need: 'Medicinas',
          people: 0,
        }),
      ).rejects.toThrow(AppException);
    });

    it('crea reporte de daño, lo guarda localmente y actualiza synced a true tras confirmación', async () => {
      await reportService.reportDamage({
        category: 'ESTRUCTURAL',
        description: 'Grieta en columna principal',
        position: { lat: 4.6295, lon: -74.0655, ts: new Date(clock.now()).toISOString() },
      });

      // Antes de sincronizar con el servidor: synced = false
      let reports = await reportService.listOwnReports();
      expect(reports.length).toBe(1);
      expect(reports[0]?.kind).toBe('DAÑO: ESTRUCTURAL');
      expect(reports[0]?.synced).toBe(false);

      // Ejecutar sync
      await syncService.syncNow();

      // Tras sincronizar exitosamente: synced = true
      reports = await reportService.listOwnReports();
      expect(reports.length).toBe(1);
      expect(reports[0]?.synced).toBe(true);
    });

    it('crea solicitud de ayuda y la encola correctamente', async () => {
      await reportService.requestAid({
        need: 'Botiquín de primeros auxilios',
        people: 3,
      });

      const reports = await reportService.listOwnReports();
      expect(reports.length).toBe(1);
      expect(reports[0]?.kind).toContain('AYUDA: Botiquín');

      const queue = await syncService.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0]?.type).toBe('REQUEST_AID');
      expect(queue[0]?.payload['people']).toBe(3);
    });
  });

  describe('sms.ts - SMS prellenado de auxilio (Decisión D-25)', () => {
    it('formatea correctamente el texto del SMS con coordenadas geográficas y enlace a Google Maps', () => {
      const text = formatEmergencySmsText({
        severity: 'ATRAPADO',
        position: {
          lat: 4.62951,
          lon: -74.06552,
          accuracyM: 5,
          ts: '2026-10-03T11:45:00.000Z',
        },
        customNote: 'Sótano colapsado',
      });

      expect(text).toContain('ESTADO: ATRAPADO');
      expect(text).toContain('https://maps.google.com/?q=4.62951,-74.06552');
      expect(text).toContain('(4.62951, -74.06552)');
      expect(text).toContain('Precisión: ±5m');
      expect(text).toContain('Sótano colapsado');
    });

    it('construye una URL con esquema sms: codificada adecuadamente', () => {
      const url = buildSmsUrl({
        severity: 'CON_LESIONES',
        recipientNumber: '+573001234567',
        position: {
          lat: 4.6,
          lon: -74.1,
          ts: '2026-10-03T11:45:00.000Z',
        },
      });

      expect(url.startsWith('sms:+573001234567?body=')).toBe(true);
      const encodedBody = url.split('?body=')[1]!;
      const decodedBody = decodeURIComponent(encodedBody);
      expect(decodedBody).toContain('CON_LESIONES');
      expect(decodedBody).toContain('4.60000');
    });
  });
});
