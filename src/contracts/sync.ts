import { Unsubscribe, ISODate, GeoPoint, AppError } from './types';

export interface SyncStatus {
  online: boolean;
  pending: number;
  lastSyncAt?: ISODate;
  syncing: boolean;
  lastError?: AppError;
}

export interface SyncService {
  getStatus(): SyncStatus;
  subscribe(cb: (s: SyncStatus) => void): Unsubscribe;
  syncNow(): Promise<void>;
}

export interface DamageReportInput {
  category: 'ESTRUCTURAL' | 'SERVICIOS' | 'VIAS' | 'OTRO';
  description: string;
  position?: GeoPoint;
}

export interface AidRequestInput {
  need: string;
  people: number;
  position?: GeoPoint;
}

export interface OwnReportSummary {
  id: string;
  kind: string;
  ts: ISODate;
  synced: boolean;
}

export interface ReportService {
  reportDamage(input: DamageReportInput): Promise<void>;
  requestAid(input: AidRequestInput): Promise<void>;
  listOwnReports(): Promise<OwnReportSummary[]>;
}
