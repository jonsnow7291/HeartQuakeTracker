import { EmergencyServiceImpl } from '../../src/core/emergency/EmergencyServiceImpl';
import {
  ForegroundServicePort,
  LocationPort,
  SignalingPort,
} from '../../src/core/emergency/ports';
import { FakeClock, MemoryKeyValueStore } from './support/nodePorts';
import { PermissionKind, PermissionsService, PermissionStatus } from '../../src/contracts/permissions';
import { PowerService } from '../../src/contracts/power';
import { Unsubscribe } from '../../src/contracts/types';
import { MedicalProfileService } from '../../src/contracts/medical';
import { MeshService, MeshStatus, NearbyNode } from '../../src/contracts/mesh';
import { ReportService, DamageReportInput, AidRequestInput, OwnReportSummary } from '../../src/contracts/sync';

class TestPermissionsService implements PermissionsService {
  constructor(public missing: PermissionKind[] = []) {}
  async status(kind: PermissionKind): Promise<PermissionStatus> {
    return this.missing.includes(kind) ? 'denied' : 'granted';
  }
  async request(kind: PermissionKind): Promise<PermissionStatus> {
    return this.status(kind);
  }
  async missingForEmergency(): Promise<PermissionKind[]> {
    return [...this.missing];
  }
  async openSettings(): Promise<void> {}
}

class TestPowerService implements PowerService {
  public listeners: ((level: number, charging: boolean) => void)[] = [];
  constructor(public level = 85, public charging = false) {}
  getLevel(): number {
    return this.level;
  }
  setLevel(level: number, charging = false) {
    this.level = level;
    this.charging = charging;
    this.listeners.forEach((l) => l(level, charging));
  }
  subscribe(cb: (level: number, charging: boolean) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.level, this.charging);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
}

class TestSignalingPort implements SignalingPort {
  public active = false;
  public lowPowerMode = false;
  public startCalls = 0;
  public stopCalls = 0;
  public updateCalls = 0;

  async start(lowPower: boolean): Promise<void> {
    this.active = true;
    this.lowPowerMode = lowPower;
    this.startCalls++;
  }

  async stop(): Promise<void> {
    this.active = false;
    this.stopCalls++;
  }

  async updateLowPower(lowPower: boolean): Promise<void> {
    this.lowPowerMode = lowPower;
    this.updateCalls++;
  }

  async isMuted(): Promise<boolean> {
    return false;
  }
}

class TestForegroundPort implements ForegroundServicePort {
  public running = false;
  public startCalls = 0;
  public stopCalls = 0;

  async start(): Promise<void> {
    this.running = true;
    this.startCalls++;
  }

  async stop(): Promise<void> {
    this.running = false;
    this.stopCalls++;
  }
}

class TestLocationPort implements LocationPort {
  constructor(
    public position = {
      lat: 4.60971,
      lon: -74.08175,
      accuracyM: 5,
      ts: new Date(1_700_000_000_000).toISOString(),
    }
  ) {}

  async getCurrentPosition() {
    return this.position;
  }
}

class TestMedicalService implements Partial<MedicalProfileService> {
  constructor(public hasProfile = true) {}
  async exists(): Promise<boolean> {
    return this.hasProfile;
  }
}

class TestMeshService implements MeshService {
  constructor(public bridgeNearby = false) {}
  getStatus(): MeshStatus {
    return {
      scanning: true,
      advertising: true,
      bluetoothOn: true,
      nodesInRange: 2,
      relayedLastMin: 0,
      bridgeNearby: this.bridgeNearby,
    };
  }
  subscribeStatus(cb: (s: MeshStatus) => void): Unsubscribe {
    cb(this.getStatus());
    return () => {};
  }
  listNearby(): NearbyNode[] {
    return [];
  }
  subscribeNearby(cb: (nodes: NearbyNode[]) => void): Unsubscribe {
    cb([]);
    return () => {};
  }
}

class TestReportService implements ReportService {
  public reports: DamageReportInput[] = [];
  async reportDamage(input: DamageReportInput): Promise<void> {
    this.reports.push(input);
  }
  async requestAid(_input: AidRequestInput): Promise<void> {}
  async listOwnReports(): Promise<OwnReportSummary[]> {
    return [];
  }
}

describe('EmergencyServiceImpl (P2 - RF-05, RF-06, RNF-05)', () => {
  let clock: FakeClock;
  let permissions: TestPermissionsService;
  let power: TestPowerService;
  let signaling: TestSignalingPort;
  let foreground: TestForegroundPort;
  let location: TestLocationPort;
  let medical: TestMedicalService;
  let mesh: TestMeshService;
  let reports: TestReportService;
  let storage: MemoryKeyValueStore;

  let activeServices: EmergencyServiceImpl[] = [];

  afterEach(() => {
    activeServices.forEach((s) => s.dispose());
    activeServices = [];
  });

  const createService = (opts?: {
    confirmTimeoutMs?: number;
    noBridgeTimeoutMs?: number;
    stopResetDelayMs?: number;
    initialPower?: number;
  }) => {
    clock = new FakeClock(1_700_000_000_000);
    permissions = new TestPermissionsService();
    power = new TestPowerService(opts?.initialPower ?? 85);
    signaling = new TestSignalingPort();
    foreground = new TestForegroundPort();
    location = new TestLocationPort();
    medical = new TestMedicalService(true);
    mesh = new TestMeshService(false);
    reports = new TestReportService();
    storage = new MemoryKeyValueStore();

    const service = new EmergencyServiceImpl({
      permissions,
      power,
      signaling,
      foreground,
      location,
      medical: medical as unknown as MedicalProfileService,
      mesh,
      reports,
      storage,
      clock,
      confirmTimeoutMs: opts?.confirmTimeoutMs ?? 50,
      noBridgeTimeoutMs: opts?.noBridgeTimeoutMs ?? 100,
      stopResetDelayMs: opts?.stopResetDelayMs ?? 10,
    });
    activeServices.push(service);
    return service;
  };

  it('inicia en fase IDLE con bajo consumo calculado según batería inicial', () => {
    const normalService = createService({ initialPower: 85 });
    expect(normalService.getState()).toMatchObject({
      phase: 'IDLE',
      lowPower: false,
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
    });

    const lowPowerService = createService({ initialPower: 15 });
    expect(lowPowerService.getState().lowPower).toBe(true);
  });

  it('requestPanic evalúa permisos faltantes para pánico y baliza BLE (RF-05 A2)', async () => {
    const service = createService();
    permissions.missing = ['bluetooth', 'location'];

    const res = await service.requestPanic();
    expect(res.missing).toEqual(['bluetooth', 'location']);
  });

  it('selectSeverity entra en fase CONFIRMING con fecha límite de 3 s', async () => {
    const service = createService({ confirmTimeoutMs: 3000 });
    await service.selectSeverity('ATRAPADO');

    const state = service.getState();
    expect(state.phase).toBe('CONFIRMING');
    expect(state.severity).toBe('ATRAPADO');
    expect(state.startedAt).toBe(new Date(1_700_000_000_000).toISOString());
    expect(state.cancelDeadline).toBe(new Date(1_700_000_003_000).toISOString());
    expect(signaling.active).toBe(false);
    expect(foreground.running).toBe(false);
  });

  it('cancel() dentro de la ventana de confirmación retorna a IDLE sin disparar señalización (RF-05 A1)', async () => {
    const service = createService({ confirmTimeoutMs: 100 });
    await service.selectSeverity('CON_LESIONES');
    expect(service.getState().phase).toBe('CONFIRMING');

    await service.cancel();
    expect(service.getState().phase).toBe('IDLE');
    expect(service.getState().severity).toBeUndefined();

    // Esperar más allá del tiempo original de confirmación
    await new Promise((r) => setTimeout(r, 150));
    expect(service.getState().phase).toBe('IDLE');
    expect(signaling.active).toBe(false);
    expect(foreground.running).toBe(false);
  });

  it('al cumplirse el tiempo de confirmación pasa a ACTIVE y dispara señalización, baliza, GPS y ficha médica', async () => {
    const service = createService({ confirmTimeoutMs: 30 });
    await service.selectSeverity('ATRAPADO');

    await new Promise((r) => setTimeout(r, 60));

    const state = service.getState();
    expect(state.phase).toBe('ACTIVE');
    expect(state.beaconActive).toBe(true);
    expect(state.meshActive).toBe(true);
    expect(state.medicalCardArmed).toBe(true);
    expect(state.lastPosition).toBeDefined();
    expect(state.lastPosition?.lat).toBe(4.60971);

    // Señalización física activada (RF-06, RNF-05)
    expect(signaling.active).toBe(true);
    expect(signaling.startCalls).toBe(1);

    // Servicio en primer plano Android activo
    expect(foreground.running).toBe(true);
    expect(foreground.startCalls).toBe(1);

    // Evento persistido localmente (JD-030)
    const stored = await storage.get('evento_emergencia');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toMatchObject({
      severity: 'ATRAPADO',
      lowPower: false,
    });
  });

  it('stop() desactiva señalización, foreground service y transita STOPPED -> IDLE', async () => {
    const service = createService({ confirmTimeoutMs: 20, stopResetDelayMs: 30 });
    await service.selectSeverity('ATRAPADO');
    await new Promise((r) => setTimeout(r, 40));

    expect(service.getState().phase).toBe('ACTIVE');
    await service.stop();

    expect(signaling.active).toBe(false);
    expect(foreground.running).toBe(false);
    expect(service.getState().phase).toBe('STOPPED');
    expect(service.getState().beaconActive).toBe(false);

    await new Promise((r) => setTimeout(r, 50));
    expect(service.getState().phase).toBe('IDLE');
  });

  it('markSafe() desactiva emergencia, reporta ILESO y encola reporte (JD-034)', async () => {
    const service = createService({ confirmTimeoutMs: 20 });
    await service.selectSeverity('ATRAPADO');
    await new Promise((r) => setTimeout(r, 40));

    await service.markSafe();

    expect(signaling.active).toBe(false);
    expect(foreground.running).toBe(false);
    expect(service.getState().phase).toBe('IDLE');
    expect(service.getState().severity).toBe('ILESO');
    expect(reports.reports.length).toBe(1);
    expect(reports.reports[0]?.description).toBe('ESTOY_A_SALVO');
  });

  it('cambio de batería < 20% conmuta a modo SOS prolongado en señalización activa (D-26)', async () => {
    const service = createService({ confirmTimeoutMs: 20, initialPower: 80 });
    await service.selectSeverity('ATRAPADO');
    await new Promise((r) => setTimeout(r, 40));

    expect(service.getState().lowPower).toBe(false);
    expect(signaling.lowPowerMode).toBe(false);

    // Batería cae al 15%
    power.setLevel(15, false);

    expect(service.getState().lowPower).toBe(true);
    expect(signaling.lowPowerMode).toBe(true);
    expect(signaling.updateCalls).toBe(1);
  });

  it('sin nodos puente por 2 min activa flag noBridge2Min para SMS prellenado (D-25)', async () => {
    mesh.bridgeNearby = false;
    const service = createService({ confirmTimeoutMs: 20, noBridgeTimeoutMs: 50 });
    await service.selectSeverity('ATRAPADO');
    await new Promise((r) => setTimeout(r, 30));

    expect(service.getState().noBridge2Min).toBe(false);

    await new Promise((r) => setTimeout(r, 70));
    expect(service.getState().noBridge2Min).toBe(true);
  });

  it('subscribe emite estado inicial y notifica en cada cambio', async () => {
    const service = createService({ confirmTimeoutMs: 20 });
    const states: string[] = [];

    const unsub = service.subscribe((s) => {
      states.push(s.phase);
    });

    await service.selectSeverity('ILESO');
    await new Promise((r) => setTimeout(r, 35));
    await service.cancel();

    unsub();
    expect(states[0]).toBe('IDLE');
    expect(states).toContain('CONFIRMING');
    expect(states).toContain('ACTIVE');
  });
});
