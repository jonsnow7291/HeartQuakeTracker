import { Unsubscribe, ISODate, Severity, GeoPoint } from './types';

export interface NearbyNode {
  idEphemeral: string;
  severity?: Severity;
  distanceHint: 'near' | 'mid' | 'far';
  rssi: number;
  lastSeen: ISODate;
  position?: GeoPoint;
  verified: boolean;
}

export interface MeshStatus {
  scanning: boolean;
  advertising: boolean;
  bluetoothOn: boolean;
  nodesInRange: number;
  relayedLastMin: number;
  bridgeNearby: boolean;
}

export interface MeshService {
  getStatus(): MeshStatus;
  subscribeStatus(cb: (s: MeshStatus) => void): Unsubscribe;
  listNearby(): NearbyNode[];
  subscribeNearby(cb: (nodes: NearbyNode[]) => void): Unsubscribe;
}
