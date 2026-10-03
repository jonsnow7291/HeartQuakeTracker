import { MeshService, MeshStatus, NearbyNode } from '../../contracts/mesh';
import { Unsubscribe } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockMeshService implements MeshService {
  private devController?: MockDevScenarioController;
  private listeners: ((s: MeshStatus) => void)[] = [];
  private nearbyListeners: ((nodes: NearbyNode[]) => void)[] = [];

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;

    if (this.devController) {
      this.devController.subscribe(() => {
        this.notifyStatus();
        this.notifyNearby();
      });
    }
  }

  public getStatus(): MeshStatus {
    const isBtOff = this.devController?.isScenarioActive('bluetooth_apagado') ?? false;
    const isOffline = this.devController?.isScenarioActive('offline_total') ?? false;
    const has5Nodes = this.devController?.isScenarioActive('mesh_5_nodos') ?? false;

    return {
      scanning: !isBtOff,
      advertising: !isBtOff,
      bluetoothOn: !isBtOff,
      nodesInRange: isBtOff ? 0 : has5Nodes ? 5 : 2,
      relayedLastMin: isBtOff ? 0 : 7,
      bridgeNearby: !isOffline,
    };
  }

  public subscribeStatus(cb: (s: MeshStatus) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public listNearby(): NearbyNode[] {
    const isBtOff = this.devController?.isScenarioActive('bluetooth_apagado') ?? false;
    if (isBtOff) return [];

    const has5Nodes = this.devController?.isScenarioActive('mesh_5_nodos') ?? false;
    if (has5Nodes) {
      return [
        { idEphemeral: 'eph_node_a1', severity: 'ATRAPADO', distanceHint: 'near', rssi: -58, lastSeen: new Date().toISOString(), verified: true },
        { idEphemeral: 'eph_node_b2', severity: 'CON_LESIONES', distanceHint: 'mid', rssi: -72, lastSeen: new Date().toISOString(), verified: true },
        { idEphemeral: 'eph_node_c3', severity: 'ILESO', distanceHint: 'near', rssi: -61, lastSeen: new Date().toISOString(), verified: true },
        { idEphemeral: 'eph_node_d4', severity: 'ILESO', distanceHint: 'far', rssi: -85, lastSeen: new Date().toISOString(), verified: false },
        { idEphemeral: 'eph_node_e5', severity: 'CON_LESIONES', distanceHint: 'mid', rssi: -78, lastSeen: new Date().toISOString(), verified: true },
      ];
    }

    return [
      { idEphemeral: 'eph_node_x1', severity: 'ILESO', distanceHint: 'near', rssi: -62, lastSeen: new Date().toISOString(), verified: true },
      { idEphemeral: 'eph_node_y2', severity: 'CON_LESIONES', distanceHint: 'mid', rssi: -76, lastSeen: new Date().toISOString(), verified: true },
    ];
  }

  public subscribeNearby(cb: (nodes: NearbyNode[]) => void): Unsubscribe {
    this.nearbyListeners.push(cb);
    cb(this.listNearby());
    return () => {
      this.nearbyListeners = this.nearbyListeners.filter((l) => l !== cb);
    };
  }

  private notifyStatus(): void {
    const st = this.getStatus();
    this.listeners.forEach((l) => l(st));
  }

  private notifyNearby(): void {
    const nodes = this.listNearby();
    this.nearbyListeners.forEach((l) => l(nodes));
  }
}
