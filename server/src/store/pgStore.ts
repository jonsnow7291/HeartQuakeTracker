import pg from 'pg';
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

const iso = (d: Date | string | null | undefined): string => (d ? new Date(d).toISOString() : '');

function poiFromRow(r: Record<string, unknown>): PoiRecord {
  return {
    id: r.id as string,
    type: r.type as PoiRecord['type'],
    name: r.name as string,
    lat: r.lat as number,
    lon: r.lon as number,
    address: (r.address as string | null) ?? undefined,
    phone: (r.phone as string | null) ?? undefined,
    active: r.active as boolean,
    source: (r.source as string | null) ?? undefined,
    verified: r.verified as boolean,
    updatedAt: iso(r.updated_at as Date),
  };
}

export class PgStore implements Store {
  constructor(private pool: pg.Pool) {}

  static connect(connectionString: string): PgStore {
    return new PgStore(new pg.Pool({ connectionString, max: 10 }));
  }

  async upsertDevice(d: DeviceRecord) {
    await this.pool.query(
      `INSERT INTO devices (id, pubkey, platform, app_version, created_at, revoked)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET app_version = EXCLUDED.app_version, platform = EXCLUDED.platform`,
      [d.id, d.pubkey, d.platform, d.appVersion, d.createdAt, d.revoked],
    );
  }
  async getDevice(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM devices WHERE id=$1', [id]);
    const r = rows[0];
    return r
      ? ({ id: r.id, pubkey: r.pubkey, platform: r.platform, appVersion: r.app_version, createdAt: iso(r.created_at), revoked: r.revoked } as DeviceRecord)
      : null;
  }

  async insertEventIfAbsent(e: SyncEvent) {
    const res = await this.pool.query(
      `INSERT INTO events (event_id, device_id, type, ts, payload, lat, lon, acc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (event_id) DO NOTHING`,
      [e.eventId, e.device, e.type, e.ts, JSON.stringify(e.payload), e.geo?.lat ?? null, e.geo?.lon ?? null, e.geo?.acc ?? null],
    );
    return (res.rowCount ?? 0) > 0;
  }
  async eventCount() {
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM events');
    return rows[0].n as number;
  }

  async insertReading(r: ReadingRecord) {
    await this.pool.query(
      `INSERT INTO seismic_readings (event_id, device_id, ts, peak_g, lat, lon, quorum_nodes, classification)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (event_id) DO NOTHING`,
      [r.eventId ?? null, r.deviceId, r.ts, r.peakG, r.lat ?? null, r.lon ?? null, r.quorumNodes, r.classification],
    );
  }
  async readingsSince(isoTs: string, limit: number) {
    const { rows } = await this.pool.query(
      'SELECT * FROM (SELECT * FROM seismic_readings WHERE ts >= $1 ORDER BY ts DESC LIMIT $2) t ORDER BY ts ASC',
      [isoTs, limit],
    );
    return rows.map(
      (r): ReadingRecord => ({
        eventId: r.event_id ?? undefined,
        deviceId: r.device_id,
        ts: iso(r.ts),
        peakG: r.peak_g,
        lat: r.lat ?? undefined,
        lon: r.lon ?? undefined,
        quorumNodes: r.quorum_nodes,
        classification: r.classification,
      }),
    );
  }
  async upsertSeismicEvent(e: SeismicEventRecord) {
    await this.pool.query(
      `INSERT INTO seismic_events (id, started_at, lat, lon, confidence, devices_count, confirmed)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET confidence=EXCLUDED.confidence, devices_count=EXCLUDED.devices_count, confirmed=EXCLUDED.confirmed`,
      [e.id, e.startedAt, e.lat, e.lon, e.confidence, e.devicesCount, e.confirmed],
    );
  }
  async listSeismicEvents(sinceIso?: string) {
    const { rows } = await this.pool.query('SELECT * FROM seismic_events WHERE started_at >= $1 ORDER BY started_at', [sinceIso ?? '1970-01-01T00:00:00Z']);
    return rows.map(
      (r): SeismicEventRecord => ({
        id: r.id,
        startedAt: iso(r.started_at),
        lat: r.lat,
        lon: r.lon,
        confidence: r.confidence,
        devicesCount: r.devices_count,
        confirmed: r.confirmed,
      }),
    );
  }

  async upsertPoi(p: Omit<PoiRecord, 'updatedAt'>) {
    const { rows } = await this.pool.query(
      `INSERT INTO pois (id, type, name, lat, lon, address, phone, active, source, verified, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
       ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type, name=EXCLUDED.name, lat=EXCLUDED.lat, lon=EXCLUDED.lon,
         address=EXCLUDED.address, phone=EXCLUDED.phone, active=EXCLUDED.active, source=EXCLUDED.source,
         verified=EXCLUDED.verified, updated_at=now()
       RETURNING *`,
      [p.id, p.type, p.name, p.lat, p.lon, p.address ?? null, p.phone ?? null, p.active, p.source ?? null, p.verified],
    );
    return poiFromRow(rows[0]);
  }
  async listPois(q: PoiQuery) {
    const where: string[] = [];
    const args: unknown[] = [];
    const add = (sql: string, v: unknown) => {
      args.push(v);
      where.push(sql.replace('?', `$${args.length}`));
    };
    if (!q.includeInactive) where.push('active = true');
    if (q.types?.length) add('type = ANY(?)', q.types);
    if (q.since) add('updated_at > ?', q.since);
    if (q.bbox) {
      const [minLon, minLat, maxLon, maxLat] = q.bbox;
      add('lon >= ?', minLon);
      add('lat >= ?', minLat);
      add('lon <= ?', maxLon);
      add('lat <= ?', maxLat);
    }
    const { rows } = await this.pool.query(`SELECT * FROM pois ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, args);
    return rows.map(poiFromRow);
  }
  async getPoi(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM pois WHERE id=$1', [id]);
    return rows[0] ? poiFromRow(rows[0]) : null;
  }
  async insertPoiReport(r: PoiReportRecord) {
    await this.pool.query('INSERT INTO poi_reports (poi_id, device_id, reason, note) VALUES ($1,$2,$3,$4)', [r.poiId, r.deviceId, r.reason, r.note ?? null]);
  }
  async poiReportCount() {
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM poi_reports');
    return rows[0].n as number;
  }

  async upsertAidEntity(e: AidEntityRecord) {
    await this.pool.query(
      `INSERT INTO aid_entities (id, data, updated_at) VALUES ($1,$2, now())
       ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`,
      [e.id, JSON.stringify(e)],
    );
  }
  async listAidEntities() {
    const { rows } = await this.pool.query('SELECT data FROM aid_entities ORDER BY id');
    return rows.map((r) => r.data as AidEntityRecord);
  }
  async upsertAidNeed(n: AidNeedRecord) {
    await this.pool.query(
      `INSERT INTO aid_needs (id, data, updated_at) VALUES ($1,$2, now())
       ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`,
      [n.id, JSON.stringify(n)],
    );
  }
  async listAidNeeds() {
    const { rows } = await this.pool.query('SELECT data FROM aid_needs ORDER BY id');
    return rows.map((r) => r.data as AidNeedRecord);
  }

  async publishContent(pkg: ContentPackage) {
    await this.pool.query(
      `INSERT INTO content_packages (version, manifest, files, published_at) VALUES ($1,$2,$3,$4)
       ON CONFLICT (version) DO UPDATE SET manifest=EXCLUDED.manifest, files=EXCLUDED.files, published_at=EXCLUDED.published_at`,
      [pkg.manifest.version, JSON.stringify(pkg.manifest), JSON.stringify(pkg.files), pkg.publishedAt],
    );
  }
  private pkgFromRow(r: Record<string, unknown>): ContentPackage {
    return { manifest: r.manifest as ContentPackage['manifest'], files: r.files as ContentPackage['files'], publishedAt: iso(r.published_at as Date) };
  }
  async latestContent() {
    const { rows } = await this.pool.query('SELECT * FROM content_packages ORDER BY published_at DESC LIMIT 1');
    return rows[0] ? this.pkgFromRow(rows[0]) : null;
  }
  async getContent(version: string) {
    const { rows } = await this.pool.query('SELECT * FROM content_packages WHERE version=$1', [version]);
    return rows[0] ? this.pkgFromRow(rows[0]) : null;
  }

  async upsertTileRegion(r: TileRegionRecord) {
    await this.pool.query(
      `INSERT INTO tile_regions (id, name, size_mb, hash, version, url, updated_at) VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, size_mb=EXCLUDED.size_mb, hash=EXCLUDED.hash,
         version=EXCLUDED.version, url=EXCLUDED.url, updated_at=now()`,
      [r.id, r.name, r.sizeMB, r.hash ?? null, r.version, r.url ?? null],
    );
  }
  private tileFromRow(r: Record<string, unknown>): TileRegionRecord {
    return {
      id: r.id as string,
      name: r.name as string,
      sizeMB: r.size_mb as number,
      hash: (r.hash as string | null) ?? undefined,
      version: r.version as string,
      url: (r.url as string | null) ?? undefined,
    };
  }
  async listTileRegions() {
    const { rows } = await this.pool.query('SELECT * FROM tile_regions ORDER BY id');
    return rows.map((r) => this.tileFromRow(r));
  }
  async getTileRegion(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM tile_regions WHERE id=$1', [id]);
    return rows[0] ? this.tileFromRow(rows[0]) : null;
  }

  async upsertRescuerCode(c: RescuerCodeRecord) {
    await this.pool.query(
      `INSERT INTO rescuer_codes (code_hash, organization, expires_at, revoked) VALUES ($1,$2,$3,$4)
       ON CONFLICT (code_hash) DO UPDATE SET organization=EXCLUDED.organization, expires_at=EXCLUDED.expires_at, revoked=EXCLUDED.revoked`,
      [c.codeHash, c.organization, c.expiresAt, c.revoked],
    );
  }
  async findRescuerCode(codeHash: string) {
    const { rows } = await this.pool.query('SELECT * FROM rescuer_codes WHERE code_hash=$1', [codeHash]);
    const r = rows[0];
    return r ? ({ codeHash: r.code_hash, organization: r.organization, expiresAt: iso(r.expires_at), revoked: r.revoked } as RescuerCodeRecord) : null;
  }
  async listActiveRescuerHashes(nowIso: string) {
    const { rows } = await this.pool.query('SELECT code_hash FROM rescuer_codes WHERE NOT revoked AND expires_at > $1 ORDER BY code_hash', [nowIso]);
    return rows.map((r) => r.code_hash as string);
  }

  async audit(actor: string, action: string, entity: string) {
    await this.pool.query('INSERT INTO audit_log (actor, action, entity) VALUES ($1,$2,$3)', [actor, action, entity]);
  }
  async close() {
    await this.pool.end();
  }
}
