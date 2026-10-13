import { GeoPoint, ISODate, Severity, Unsubscribe } from '../../contracts/types';
import { MeshService, MeshStatus, NearbyNode } from '../../contracts/mesh';
import {
  DEFAULT_MESH_CONFIG,
  MeshConfig,
  MeshPacket,
} from './types';
import {
  BleAdvertiserPort,
  BleScannerPort,
  BluetoothStatePort,
  MeshClock,
  defaultMeshClock,
} from './ports';
import { decodeMeshPacket, encodeMeshPacket } from './codec';
import {
  generateEphemeralId,
  generateIdentityKeyPair,
  signBytes,
} from './crypto';
import { MeshDeduplicator } from './dedupe';
import { MeshPriorityQueue } from './priorityQueue';

export interface RealMeshServiceOptions {
  advertiser: BleAdvertiserPort;
  scanner: BleScannerPort;
  bluetoothState: BluetoothStatePort;
  localSecret?: Uint8Array;
  identityPrivateKey?: Uint8Array;
  config?: Partial<MeshConfig>;
  clock?: MeshClock;
}

export class RealMeshService implements MeshService {
  private readonly advertiser: BleAdvertiserPort;
  private readonly scanner: BleScannerPort;
  private readonly bluetoothState: BluetoothStatePort;
  private readonly clock: MeshClock;
  private readonly config: MeshConfig;

  private readonly deduplicator: MeshDeduplicator;
  private readonly queue: MeshPriorityQueue;

  private readonly localSecret: Uint8Array;
  private readonly privateKey: Uint8Array;

  // Estado interno
  private isScanning = false;
  private isAdvertising = false;
  private bluetoothOn = true;

  // Mapa de nodos cercanos conocidos por idEphemeral
  private readonly nearbyNodes = new Map<string, NearbyNode>();

  // Ventana deslizante de timestamps de retransmisión para 'relayedLastMin'
  private readonly relayTimestamps: number[] = [];

  // Conteo de repeticiones de mensajes para trickle suppression: key -> count
  private readonly trickleCounters = new Map<string, number>();

  // Suscriptores
  private statusListeners: ((s: MeshStatus) => void)[] = [];
  private nearbyListeners: ((nodes: NearbyNode[]) => void)[] = [];

  // Parámetros de la baliza propia
  private beaconActive = false;
  private beaconSeverity: Severity = 'ILESO';
  private beaconLocation?: GeoPoint;
  private beaconLowPower = false;
  private beaconMedicalAvailable = false;
  private ownSeq = 1;

  private beaconTimer?: ReturnType<typeof setTimeout>;
  private btSub?: Unsubscribe;

  constructor(options: RealMeshServiceOptions) {
    this.advertiser = options.advertiser;
    this.scanner = options.scanner;
    this.bluetoothState = options.bluetoothState;
    this.clock = options.clock ?? defaultMeshClock;
    this.config = { ...DEFAULT_MESH_CONFIG, ...options.config };

    this.deduplicator = new MeshDeduplicator(this.config.dedupeTtlMs, 2000, this.clock);
    this.queue = new MeshPriorityQueue(this.config.maxQueueSize);

    // Identidad criptográfica
    if (options.localSecret && options.localSecret.length >= 16) {
      this.localSecret = options.localSecret;
    } else {
      this.localSecret = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        this.localSecret[i] = Math.floor(Math.random() * 256);
      }
    }

    if (options.identityPrivateKey && options.identityPrivateKey.length >= 32) {
      this.privateKey = options.identityPrivateKey;
    } else {
      const pair = generateIdentityKeyPair();
      this.privateKey = pair.privateKey;
    }

    // Monitoreo del estado de Bluetooth
    this.btSub = this.bluetoothState.subscribeBluetoothState((on) => {
      this.bluetoothOn = on;
      if (!on) {
        this.nearbyNodes.clear();
      }
      this.notifyStatus();
      this.notifyNearby();
    });

    this.bluetoothState.isBluetoothEnabled().then((on) => {
      this.bluetoothOn = on;
      this.notifyStatus();
    }).catch(() => {});
  }

  /**
   * Inicia el escaneo y la operación de la malla.
   */
  public async start(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      await this.scanner.startScan((bytes, rssi, _deviceId) => {
        this.handleIncomingRawPacket(bytes, rssi);
      });
    } catch {
      this.isScanning = false;
    }

    this.notifyStatus();
  }

  /**
   * Detiene el escaneo y la emisión.
   */
  public async stop(): Promise<void> {
    this.isScanning = false;
    if (this.beaconTimer) {
      clearTimeout(this.beaconTimer);
      this.beaconTimer = undefined;
    }

    try {
      await this.scanner.stopScan();
    } catch {}

    try {
      await this.advertiser.stopAdvertising();
    } catch {}

    this.isAdvertising = false;
    this.notifyStatus();
  }

  public getStatus(): MeshStatus {
    const now = this.clock.now();
    // Limpiar timestamps de retransmisión anteriores a 60 segundos
    const cutoff = now - 60 * 1000;
    while (this.relayTimestamps.length > 0 && (this.relayTimestamps[0] ?? 0) < cutoff) {
      this.relayTimestamps.shift();
    }

    // Contar nodos vistos en los últimos 2 minutos
    const recentCutoff = now - 2 * 60 * 1000;
    let nodesInRange = 0;
    let bridgeNearby = false;

    for (const node of this.nearbyNodes.values()) {
      const seenTime = new Date(node.lastSeen).getTime();
      if (seenTime >= recentCutoff) {
        nodesInRange++;
      }
    }

    return {
      scanning: this.isScanning && this.bluetoothOn,
      advertising: this.isAdvertising && this.bluetoothOn,
      bluetoothOn: this.bluetoothOn,
      nodesInRange: this.bluetoothOn ? nodesInRange : 0,
      relayedLastMin: this.bluetoothOn ? this.relayTimestamps.length : 0,
      bridgeNearby,
    };
  }

  public subscribeStatus(cb: (s: MeshStatus) => void): Unsubscribe {
    this.statusListeners.push(cb);
    cb(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== cb);
    };
  }

  public listNearby(): NearbyNode[] {
    if (!this.bluetoothOn) return [];
    return Array.from(this.nearbyNodes.values());
  }

  public subscribeNearby(cb: (nodes: NearbyNode[]) => void): Unsubscribe {
    this.nearbyListeners.push(cb);
    cb(this.listNearby());
    return () => {
      this.nearbyListeners = this.nearbyListeners.filter((l) => l !== cb);
    };
  }

  /**
   * Configura y emite la baliza BLE propia (RF-07).
   */
  public async setBeaconState(params: {
    active: boolean;
    severity?: Severity;
    location?: GeoPoint;
    lowPower?: boolean;
    medicalAvailable?: boolean;
  }): Promise<void> {
    this.beaconActive = params.active;
    if (params.severity) this.beaconSeverity = params.severity;
    if (params.location !== undefined) this.beaconLocation = params.location;
    if (params.lowPower !== undefined) this.beaconLowPower = params.lowPower;
    if (params.medicalAvailable !== undefined) this.beaconMedicalAvailable = params.medicalAvailable;

    if (!this.beaconActive) {
      if (this.beaconTimer) {
        clearTimeout(this.beaconTimer);
        this.beaconTimer = undefined;
      }
      await this.advertiser.stopAdvertising();
      this.isAdvertising = false;
      this.notifyStatus();
      return;
    }

    await this.emitOwnBeacon();
  }

  /**
   * Obtiene el ID efímero actual del nodo.
   */
  public getCurrentEphemeralId(): string {
    const epochSeconds = Math.floor(this.clock.now() / 1000);
    return generateEphemeralId(this.localSecret, epochSeconds);
  }

  /**
   * Procesa un paquete BLE crudo recibido por el escáner.
   */
  public handleIncomingRawPacket(bytes: Uint8Array, rssi: number): void {
    const packet = decodeMeshPacket(bytes);
    if (!packet) {
      return;
    }

    const nowSeconds = Math.floor(this.clock.now() / 1000);

    // Regla 5: Descartar mensajes con timestamp fuera de ±24 h (skew de reloj)
    if (Math.abs(nowSeconds - packet.timestamp) > this.config.maxClockSkewSeconds) {
      return;
    }

    // Calcular indicador de proximidad según RSSI
    let distanceHint: 'near' | 'mid' | 'far' = 'far';
    if (rssi >= -65) {
      distanceHint = 'near';
    } else if (rssi >= -80) {
      distanceHint = 'mid';
    }

    // Registrar o actualizar nodo cercano
    const existingNode = this.nearbyNodes.get(packet.idEphemeral);
    const updatedNode: NearbyNode = {
      idEphemeral: packet.idEphemeral,
      severity: packet.severity ?? existingNode?.severity ?? 'ILESO',
      distanceHint,
      rssi,
      lastSeen: new Date(this.clock.now()).toISOString(),
      position: packet.location ?? existingNode?.position,
      verified: packet.authTag.length > 4, // En legacy es false hasta verificación GATT (ADR 0003)
    };
    this.nearbyNodes.set(packet.idEphemeral, updatedNode);
    this.notifyNearby();
    this.notifyStatus();

    // Deduplicación (D-24): clave (idEphemeral, seq) con TTL 10 min
    const msgKey = `${packet.idEphemeral}:${packet.seq}`;
    if (this.deduplicator.has(packet.idEphemeral, packet.seq, this.clock.now())) {
      // Registrar repetición escuchada para trickle suppression
      const currentCount = this.trickleCounters.get(msgKey) ?? 0;
      this.trickleCounters.set(msgKey, currentCount + 1);
      return;
    }

    // Registrar como nuevo
    this.deduplicator.add(packet.idEphemeral, packet.seq, this.clock.now());
    this.trickleCounters.set(msgKey, 0);

    // Malla: retransmitir si TTL > 1 (decrementa en 1, descarta en <= 1)
    if (packet.ttl > 1) {
      const relayPacket: MeshPacket = {
        ...packet,
        ttl: packet.ttl - 1,
        relayed: true,
      };

      // Backoff aleatorio (trickle) entre 50 y 300 ms antes de encolar y emitir
      const backoffRange = this.config.maxBackoffMs - this.config.minBackoffMs;
      const backoffDelay = this.config.minBackoffMs + Math.floor(Math.random() * (backoffRange + 1));

      setTimeout(() => {
        // Regla Trickle: si se escucharon >= k retransmisiones por otros nodos, se cancela
        const heardCount = this.trickleCounters.get(msgKey) ?? 0;
        if (heardCount >= this.config.trickleSuppressionThreshold) {
          return;
        }

        this.queue.push(relayPacket);
        this.processRelayQueue();
      }, backoffDelay);
    }
  }

  private async processRelayQueue(): Promise<void> {
    const packetToRelay = this.queue.pop();
    if (!packetToRelay) return;

    try {
      const raw = encodeMeshPacket(packetToRelay);
      this.relayTimestamps.push(this.clock.now());
      await this.advertiser.startAdvertising(raw);
      this.isAdvertising = true;
      this.notifyStatus();

      // Emitir ráfaga y restaurar la baliza propia tras un instante
      setTimeout(() => {
        if (this.beaconActive) {
          this.emitOwnBeacon();
        }
      }, 300);
    } catch {}
  }

  private async emitOwnBeacon(): Promise<void> {
    const nowSeconds = Math.floor(this.clock.now() / 1000);
    const idEphemeral = generateEphemeralId(this.localSecret, nowSeconds);

    const ownPacket: MeshPacket = {
      version: 1,
      relayed: false,
      lowPower: this.beaconLowPower,
      medicalAvailable: this.beaconMedicalAvailable,
      hasLocation: Boolean(this.beaconLocation),
      type: 'SOS',
      idEphemeral,
      seq: this.ownSeq++,
      severity: this.beaconSeverity,
      location: this.beaconLocation,
      timestamp: nowSeconds,
      ttl: this.config.initialTtl,
      authTag: new Uint8Array(4),
    };

    // Calcular los primeros bytes del paquete y firmar
    const partialRaw = encodeMeshPacket(ownPacket);
    const signature = signBytes(this.privateKey, partialRaw.subarray(0, 22));
    ownPacket.authTag = signature.subarray(0, 4);

    const fullRaw = encodeMeshPacket(ownPacket);
    try {
      await this.advertiser.startAdvertising(fullRaw);
      this.isAdvertising = true;
      this.notifyStatus();
    } catch {
      this.isAdvertising = false;
    }

    // Programar siguiente emisión según perfil de batería (RNF-02, D-26)
    const interval = this.beaconLowPower
      ? this.config.dutyCycleLowPowerMs // 30 s si <20%
      : this.config.dutyCycleNormalMs;  // 1 s continuo

    if (this.beaconTimer) {
      clearTimeout(this.beaconTimer);
    }

    this.beaconTimer = setTimeout(() => {
      if (this.beaconActive) {
        this.emitOwnBeacon();
      }
    }, interval);
  }

  private notifyStatus(): void {
    const st = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(st);
    }
  }

  private notifyNearby(): void {
    const list = this.listNearby();
    for (const listener of this.nearbyListeners) {
      listener(list);
    }
  }

  public destroy(): void {
    this.stop();
    if (this.btSub) {
      this.btSub();
      this.btSub = undefined;
    }
    this.statusListeners = [];
    this.nearbyListeners = [];
  }
}
