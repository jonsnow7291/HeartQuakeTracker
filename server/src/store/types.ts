import type { SyncEvent } from '../domain/events.js';

export type PoiType = 'ALBERGUE' | 'ACOPIO' | 'BOMBEROS' | 'SALUD' | 'ZONA_SEGURA';

export interface DeviceRecord {
  id: string;
  pubkey: string; // base64 de los 32 bytes Ed25519
  platform: 'android' | 'ios';
  appVersion: string;
  createdAt: string;
  revoked: boolean;
}

export interface PoiRecord {
  id: string;
  type: PoiType;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  active: boolean;
  source?: string;
  verified: boolean;
  updatedAt: string;
}

export interface PoiQuery {
  /** [minLon, minLat, maxLon, maxLat] */
  bbox?: [number, number, number, number];
  types?: PoiType[];
  /** Solo los cambiados desde esta fecha ISO (delta). */
  since?: string;
  includeInactive?: boolean;
}

export interface PoiReportRecord {
  poiId: string;
  deviceId: string;
  reason: string;
  note?: string;
}

export interface ReadingRecord {
  eventId?: string;
  deviceId: string;
  ts: string;
  peakG: number;
  lat?: number;
  lon?: number;
  quorumNodes: number;
  classification: 'POSSIBLE' | 'CONFIRMED' | 'DISCARDED';
}

export interface SeismicEventRecord {
  id: string;
  startedAt: string;
  lat: number;
  lon: number;
  confidence: number;
  devicesCount: number;
  confirmed: boolean;
}

export interface AidEntityRecord {
  id: string;
  name: string;
  kind: 'GOBIERNO' | 'ONG' | 'SOCORRO';
  description?: string;
  active: boolean;
  verifiedAt: string;
  channels: { type: 'WEB' | 'TEL' | 'CUENTA' | 'EMAIL'; value: string; requirements?: string; active: boolean }[];
  verified?: boolean;
}

export interface AidNeedRecord {
  id: string;
  category: string;
  label: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface ContentFile {
  path: string;
  sha256: string;
  bytes: number;
  contentBase64: string;
}

export interface ContentManifest {
  version: string;
  generatedAt: string;
  files: { path: string; sha256: string; bytes: number }[];
}

export interface ContentPackage {
  manifest: ContentManifest;
  files: ContentFile[];
  publishedAt: string;
}

export interface TileRegionRecord {
  id: string;
  name: string;
  sizeMB: number;
  hash?: string;
  version: string;
  url?: string;
}

export interface RescuerCodeRecord {
  codeHash: string;
  organization: string;
  expiresAt: string;
  revoked: boolean;
}

/** Puerto de persistencia. Implementaciones: MemoryStore (tests/dev) y PgStore (PostgreSQL). */
export interface Store {
  upsertDevice(d: DeviceRecord): Promise<void>;
  getDevice(id: string): Promise<DeviceRecord | null>;

  /** true si es nuevo, false si ya existía (idempotencia). */
  insertEventIfAbsent(e: SyncEvent): Promise<boolean>;
  eventCount(): Promise<number>;

  insertReading(r: ReadingRecord): Promise<void>;
  readingsSince(isoTs: string, limit: number): Promise<ReadingRecord[]>;
  upsertSeismicEvent(e: SeismicEventRecord): Promise<void>;
  listSeismicEvents(sinceIso?: string): Promise<SeismicEventRecord[]>;

  upsertPoi(p: Omit<PoiRecord, 'updatedAt'>): Promise<PoiRecord>;
  listPois(q: PoiQuery): Promise<PoiRecord[]>;
  getPoi(id: string): Promise<PoiRecord | null>;
  insertPoiReport(r: PoiReportRecord): Promise<void>;
  poiReportCount(): Promise<number>;

  upsertAidEntity(e: AidEntityRecord): Promise<void>;
  listAidEntities(): Promise<AidEntityRecord[]>;
  upsertAidNeed(n: AidNeedRecord): Promise<void>;
  listAidNeeds(): Promise<AidNeedRecord[]>;

  publishContent(pkg: ContentPackage): Promise<void>;
  latestContent(): Promise<ContentPackage | null>;
  getContent(version: string): Promise<ContentPackage | null>;

  upsertTileRegion(r: TileRegionRecord): Promise<void>;
  listTileRegions(): Promise<TileRegionRecord[]>;
  getTileRegion(id: string): Promise<TileRegionRecord | null>;

  upsertRescuerCode(c: RescuerCodeRecord): Promise<void>;
  findRescuerCode(codeHash: string): Promise<RescuerCodeRecord | null>;
  listActiveRescuerHashes(nowIso: string): Promise<string[]>;

  audit(actor: string, action: string, entity: string): Promise<void>;
  close(): Promise<void>;
}
