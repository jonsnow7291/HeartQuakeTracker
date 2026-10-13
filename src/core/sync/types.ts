import type { ISODate } from '../../contracts/types';

export type SyncEventType =
  | 'REPORT_DAMAGE'
  | 'REQUEST_AID'
  | 'MARK_SAFE'
  | 'POI_PROBLEM'
  | 'SENSOR_READING'
  | 'POSITION'
  | 'EMERGENCY_STARTED'
  | 'EMERGENCY_STOPPED';

export interface GeoCoordinate {
  lat: number;
  lon: number;
  acc?: number;
}

export interface SyncBatchEvent {
  eventId: string;
  type: SyncEventType;
  ts: ISODate;
  device: string;
  payload: Record<string, unknown>;
  geo?: GeoCoordinate;
}

export interface SyncAck {
  eventId: string;
  status: 'OK' | 'DUP' | 'REJECTED';
  reason?: string;
}

export interface SyncBatchResponse {
  acks: SyncAck[];
}

export interface SyncQueueItem {
  id: string;
  type: SyncEventType;
  ts: ISODate;
  payload: Record<string, unknown>;
  geo?: GeoCoordinate;
  attempts: number;
  lastAttemptAt?: number;
  createdAt: number;
}
