import { RealMeshService } from '../../../src/core/mesh/meshService';
import {
  BleAdvertiserPort,
  BleScannerPort,
  BluetoothStatePort,
  RawPacketHandler,
} from '../../../src/core/mesh/ports';
import { encodeMeshPacket } from '../../../src/core/mesh/codec';
import { MeshPacket } from '../../../src/core/mesh/types';
import { FakeClock } from '../support/nodePorts';

class MockAdvertiserPort implements BleAdvertiserPort {
  advertising = false;
  lastData: Uint8Array | null = null;
  startCalls = 0;
  stopCalls = 0;

  async startAdvertising(data: Uint8Array): Promise<void> {
    this.advertising = true;
    this.lastData = data;
    this.startCalls++;
  }

  async stopAdvertising(): Promise<void> {
    this.advertising = false;
    this.stopCalls++;
  }

  isAdvertising(): boolean {
    return this.advertising;
  }
}

class MockScannerPort implements BleScannerPort {
  scanning = false;
  handler: RawPacketHandler | null = null;

  async startScan(onPacket: RawPacketHandler): Promise<void> {
    this.scanning = true;
    this.handler = onPacket;
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
    this.handler = null;
  }

  isScanning(): boolean {
    return this.scanning;
  }

  simulatePacket(bytes: Uint8Array, rssi = -60, deviceId = 'dev1'): void {
    if (this.handler) {
      this.handler(bytes, rssi, deviceId);
    }
  }
}

class MockBtStatePort implements BluetoothStatePort {
  enabled = true;
  listener: ((e: boolean) => void) | null = null;

  async isBluetoothEnabled(): Promise<boolean> {
    return this.enabled;
  }

  subscribeBluetoothState(cb: (enabled: boolean) => void) {
    this.listener = cb;
    cb(this.enabled);
    return () => {
      this.listener = null;
    };
  }

  toggle(on: boolean) {
    this.enabled = on;
    if (this.listener) this.listener(on);
  }
}

describe('RealMeshService (RF-07, RF-08, RNF-02, RNF-06)', () => {
  let adv: MockAdvertiserPort;
  let scan: MockScannerPort;
  let bt: MockBtStatePort;
  let clock: FakeClock;
  let service: RealMeshService;

  beforeEach(() => {
    jest.useFakeTimers();
    adv = new MockAdvertiserPort();
    scan = new MockScannerPort();
    bt = new MockBtStatePort();
    clock = new FakeClock(1_776_000_000_000); // ms

    service = new RealMeshService({
      advertiser: adv,
      scanner: scan,
      bluetoothState: bt,
      clock,
      config: {
        minBackoffMs: 50,
        maxBackoffMs: 100,
      },
    });
  });

  afterEach(() => {
    service.destroy();
    jest.useRealTimers();
  });

  it('inicia y detiene el escaneo actualizando el estado de la malla', async () => {
    await service.start();
    expect(scan.isScanning()).toBe(true);
    expect(service.getStatus().scanning).toBe(true);

    await service.stop();
    expect(scan.isScanning()).toBe(false);
    expect(service.getStatus().scanning).toBe(false);
  });

  it('emite la baliza propia con tamaño de 26 B y activa advertising (RF-07)', async () => {
    await service.setBeaconState({
      active: true,
      severity: 'ATRAPADO',
      location: { lat: 4.60971, lon: -74.08175, ts: new Date().toISOString() },
    });

    expect(adv.isAdvertising()).toBe(true);
    expect(adv.lastData).not.toBeNull();
    expect(adv.lastData?.length).toBe(26);
    expect(service.getStatus().advertising).toBe(true);

    // Desactivar baliza
    await service.setBeaconState({ active: false });
    expect(adv.isAdvertising()).toBe(false);
    expect(service.getStatus().advertising).toBe(false);
  });

  it('procesa paquetes entrantes y actualiza nodos cercanos con distanceHint según RSSI (RF-08)', async () => {
    await service.start();

    const incomingPacket: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: false,
      medicalAvailable: true,
      hasLocation: true,
      type: 'SOS',
      idEphemeral: 'deadbeef1234',
      seq: 1,
      severity: 'CON_LESIONES',
      location: { lat: 4.60971, lon: -74.08175, ts: new Date().toISOString() },
      timestamp: Math.floor(clock.now() / 1000),
      ttl: 4,
      authTag: new Uint8Array(4),
    };

    const raw = encodeMeshPacket(incomingPacket);

    // Simular recepción con RSSI cercano
    scan.simulatePacket(raw, -58, 'dev-near');

    const nearby = service.listNearby();
    expect(nearby.length).toBe(1);
    expect(nearby[0]?.idEphemeral).toBe('deadbeef1234');
    expect(nearby[0]?.severity).toBe('CON_LESIONES');
    expect(nearby[0]?.distanceHint).toBe('near');
    expect(nearby[0]?.rssi).toBe(-58);

    // Estado refleja 1 nodo en rango
    expect(service.getStatus().nodesInRange).toBe(1);
  });

  it('retransmite el paquete decrementando el TTL tras backoff (D-24)', async () => {
    await service.start();

    const incomingPacket: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: false,
      medicalAvailable: false,
      hasLocation: false,
      type: 'SOS',
      idEphemeral: 'eph123456789',
      seq: 5,
      severity: 'ATRAPADO',
      timestamp: Math.floor(clock.now() / 1000),
      ttl: 4,
      authTag: new Uint8Array(4),
    };

    scan.simulatePacket(encodeMeshPacket(incomingPacket), -70, 'dev-1');

    // Durante el backoff aún no ha emitido el relé
    expect(adv.startCalls).toBe(0);

    // Avanzar temporizador más allá del backoff (150 ms)
    jest.advanceTimersByTime(150);

    // Se despacha el relé
    expect(adv.startCalls).toBeGreaterThan(0);
    expect(service.getStatus().relayedLastMin).toBe(1);
  });

  it('descarta paquetes duplicados y no los retransmite dos veces', async () => {
    await service.start();

    const incomingPacket: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: false,
      medicalAvailable: false,
      hasLocation: false,
      type: 'SOS',
      idEphemeral: 'dupnode12345',
      seq: 1,
      severity: 'ILESO',
      timestamp: Math.floor(clock.now() / 1000),
      ttl: 4,
      authTag: new Uint8Array(4),
    };

    const raw = encodeMeshPacket(incomingPacket);

    // Primera vez
    scan.simulatePacket(raw, -70, 'dev-1');
    jest.advanceTimersByTime(150);
    const firstRelayCount = service.getStatus().relayedLastMin;
    expect(firstRelayCount).toBe(1);

    // Segunda vez con el mismo (idEphemeral, seq)
    scan.simulatePacket(raw, -70, 'dev-1');
    jest.advanceTimersByTime(150);
    // El contador de retransmisión no debe aumentar
    expect(service.getStatus().relayedLastMin).toBe(1);
  });

  it('ignora paquetes con skew de reloj mayor a 24 horas', async () => {
    await service.start();

    const ancientPacket: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: false,
      medicalAvailable: false,
      hasLocation: false,
      type: 'SOS',
      idEphemeral: 'oldnode12345',
      seq: 1,
      severity: 'ILESO',
      timestamp: Math.floor(clock.now() / 1000) - (25 * 3600), // 25 horas antes
      ttl: 4,
      authTag: new Uint8Array(4),
    };

    scan.simulatePacket(encodeMeshPacket(ancientPacket), -70, 'dev-1');
    expect(service.listNearby().length).toBe(0);
  });

  it('limpia nodos y reporta ceros si Bluetooth se apaga', async () => {
    await service.start();
    const packet: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: false,
      medicalAvailable: false,
      hasLocation: false,
      type: 'SOS',
      idEphemeral: 'somenode1234',
      seq: 1,
      severity: 'ILESO',
      timestamp: Math.floor(clock.now() / 1000),
      ttl: 4,
      authTag: new Uint8Array(4),
    };
    scan.simulatePacket(encodeMeshPacket(packet), -60, 'dev');
    expect(service.listNearby().length).toBe(1);

    // Apagar Bluetooth
    bt.toggle(false);

    expect(service.getStatus().bluetoothOn).toBe(false);
    expect(service.getStatus().nodesInRange).toBe(0);
    expect(service.listNearby().length).toBe(0);
  });
});
