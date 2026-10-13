import { GeoPoint, ISODate, Severity, Unsubscribe } from '../../contracts/types';
import { MeshStatus, NearbyNode } from '../../contracts/mesh';
import { ReceivedMedicalCard, RescuerService } from '../../contracts/rescuer';
import { MedicalProfile } from '../../contracts/medical';

/** Tipos de mensaje del protocolo de malla EarthQuakeTracker. */
export type MeshMessageType = 'SOS' | 'ACK' | 'SEISMIC_READING' | 'RESCUER_HELLO';

export const MESH_MESSAGE_TYPE_CODES: Record<MeshMessageType, number> = {
  SOS: 0x01,
  ACK: 0x02,
  SEISMIC_READING: 0x03,
  RESCUER_HELLO: 0x04,
};

export const MESH_SEVERITY_CODES: Record<Severity, number> = {
  ILESO: 0x00,
  CON_LESIONES: 0x01,
  ATRAPADO: 0x02,
};

export interface MeshPacket {
  version: number;
  relayed: boolean;
  lowPower: boolean;
  medicalAvailable: boolean;
  hasLocation: boolean;
  type: MeshMessageType;
  idEphemeral: string; // 12 caracteres hex (6 bytes)
  seq: number; // 0..65535
  severity?: Severity;
  location?: GeoPoint;
  timestamp: number; // epoch seconds UTC
  ttl: number; // hops restantes (default inicial 4)
  authTag: Uint8Array; // 4 bytes truncados (o extendido)
}

/** Configuración de la malla. */
export interface MeshConfig {
  initialTtl: number; // 4 (ADR 0003)
  dedupeTtlMs: number; // 10 minutos = 600_000 ms
  maxQueueSize: number; // 200 paquetes (D-24)
  minBackoffMs: number; // 50 ms (D-24)
  maxBackoffMs: number; // 300 ms (D-24)
  trickleSuppressionThreshold: number; // k = 3
  maxClockSkewSeconds: number; // 86400 (24h)
  dutyCycleLowPowerMs: number; // 30_000 ms
  dutyCycleNormalMs: number; // 1_000 ms
}

export const DEFAULT_MESH_CONFIG: MeshConfig = {
  initialTtl: 4,
  dedupeTtlMs: 10 * 60 * 1000,
  maxQueueSize: 200,
  minBackoffMs: 50,
  maxBackoffMs: 300,
  trickleSuppressionThreshold: 3,
  maxClockSkewSeconds: 24 * 60 * 60,
  dutyCycleLowPowerMs: 30_000,
  dutyCycleNormalMs: 1_000,
};

/** Payload serializado de ficha médica para intercambio GATT (RF-13). */
export interface MedicalCardWirePayload {
  fromIdEphemeral: string;
  severity: Severity;
  timestamp: number;
  hasLocation: boolean;
  lat?: number;
  lon?: number;
  profile: Partial<MedicalProfile>;
  incomplete: boolean;
  signature: string; // firma hex Ed25519
}
