import type { SyncEvent } from '../domain/events.js';
import type {
  AidEntityRecord,
  AidNeedRecord,
  ContentPackage,
  DeviceRecord,
  PoiQuery,
  PoiRecord,
  PoiReportRecord,
  ReadingRecord,
  RescuerCodeRecord,
  SeismicEventRecord,
  Store,
  TileRegionRecord,
} from './types.js';

export class MemoryStore implements Store {
  private devices = new Map<string, DeviceRecord>();
  private events = new Map<string, SyncEvent>();
  private readings: ReadingRecord[] = [];
  private seismic = new Map<string, SeismicEventRecord>();
  private pois = new Map<string, PoiRecord>();
  private poiReports: PoiReportRecord[] = [];
  private aidEntities = new Map<string, AidEntityRecord>();
  private aidNeeds = new Map<string, AidNeedRecord>();
  private content = new Map<string, ContentPackage>();
  private tiles = new Map<string, TileRegionRecord>();
  private rescuer = new Map<string, RescuerCodeRecord>();
  public auditLog: { actor: string; action: string; entity: string; ts: string }[] = [];

  async upsertDevice(d: DeviceRecord) {
    this.devices.set(d.id, d);
  }
  async getDevice(id: string) {
    return this.devices.get(id) ?? null;
  }

  async insertEventIfAbsent(e: SyncEvent) {
    if (this.events.has(e.eventId)) return false;
    this.events.set(e.eventId, e);
    return true;
  }
  async eventCount() {
    return this.events.size;
  }

  async insertReading(r: ReadingRecord) {
    if (r.eventId && this.readings.some((x) => x.eventId === r.eventId)) return;
    this.readings.push(r);
  }
  async readingsSince(isoTs: string, limit: number) {
    const t = Date.parse(isoTs);
    return this.readings.filter((r) => Date.parse(r.ts) >= t).slice(-limit);
  }
  async upsertSeismicEvent(e: SeismicEventRecord) {
    this.seismic.set(e.id, e);
  }
  async listSeismicEvents(sinceIso?: string) {
    const t = sinceIso ? Date.parse(sinceIso) : 0;
    return [...this.seismic.values()].filter((e) => Date.parse(e.startedAt) >= t);
  }

  async upsertPoi(p: Omit<PoiRecord, 'updatedAt'>) {
    const rec: PoiRecord = { ...p, updatedAt: new Date().toISOString() };
    this.pois.set(p.id, rec);
    return rec;
  }
  async listPois(q: PoiQuery) {
    return [...this.pois.values()].filter((p) => {
      if (!q.includeInactive && !p.active) return false;
      if (q.types && !q.types.includes(p.type)) return false;
      if (q.since && Date.parse(p.updatedAt) <= Date.parse(q.since)) return false;
      if (q.bbox) {
        const [minLon, minLat, maxLon, maxLat] = q.bbox;
        if (p.lon < minLon || p.lon > maxLon || p.lat < minLat || p.lat > maxLat) return false;
      }
      return true;
    });
  }
  async getPoi(id: string) {
    return this.pois.get(id) ?? null;
  }
  async insertPoiReport(r: PoiReportRecord) {
    this.poiReports.push(r);
  }
  async poiReportCount() {
    return this.poiReports.length;
  }

  async upsertAidEntity(e: AidEntityRecord) {
    this.aidEntities.set(e.id, e);
  }
  async listAidEntities() {
    return [...this.aidEntities.values()];
  }
  async upsertAidNeed(n: AidNeedRecord) {
    this.aidNeeds.set(n.id, n);
  }
  async listAidNeeds() {
    return [...this.aidNeeds.values()];
  }

  async publishContent(pkg: ContentPackage) {
    this.content.set(pkg.manifest.version, pkg);
  }
  async latestContent() {
    const all = [...this.content.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    return all[0] ?? null;
  }
  async getContent(version: string) {
    return this.content.get(version) ?? null;
  }

  async upsertTileRegion(r: TileRegionRecord) {
    this.tiles.set(r.id, r);
  }
  async listTileRegions() {
    return [...this.tiles.values()];
  }
  async getTileRegion(id: string) {
    return this.tiles.get(id) ?? null;
  }

  async upsertRescuerCode(c: RescuerCodeRecord) {
    this.rescuer.set(c.codeHash, c);
  }
  async findRescuerCode(codeHash: string) {
    return this.rescuer.get(codeHash) ?? null;
  }
  async listActiveRescuerHashes(nowIso: string) {
    const now = Date.parse(nowIso);
    return [...this.rescuer.values()].filter((c) => !c.revoked && Date.parse(c.expiresAt) > now).map((c) => c.codeHash);
  }

  async audit(actor: string, action: string, entity: string) {
    this.auditLog.push({ actor, action, entity, ts: new Date().toISOString() });
  }
  async close() {
    /* nada */
  }
}
