import type { FastifyInstance } from 'fastify';
import { rateLimiter } from '../security/rateLimit.js';
import { hashRescuerCode, rescuerListMessage, type ServerSigner } from '../services/rescuer.js';
import { ingestReading } from '../services/seismic.js';
import type { PoiType, Store } from '../store/types.js';
import { POI_TYPES, readingsInput } from './schemas.js';

type Pre = (req: never, reply: never) => Promise<unknown>;

export function catalogRoutes(app: FastifyInstance, store: Store, auth: Pre, signer: ServerSigner, pepper: string) {
  app.get('/v1/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ---- RF-10: POIs (delta por `since`) ----
  app.get('/v1/pois', async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    let bbox: [number, number, number, number] | undefined;
    if (q.bbox) {
      const n = q.bbox.split(',').map(Number);
      if (n.length !== 4 || n.some((x) => !Number.isFinite(x))) return reply.code(400).send({ error: 'VALIDATION', issues: ['bbox = minLon,minLat,maxLon,maxLat'] });
      bbox = n as [number, number, number, number];
    }
    let types: PoiType[] | undefined;
    if (q.types) {
      types = q.types.split(',') as PoiType[];
      if (types.some((t) => !(POI_TYPES as readonly string[]).includes(t))) return reply.code(400).send({ error: 'VALIDATION', issues: ['types inválido'] });
    }
    if (q.since && Number.isNaN(Date.parse(q.since))) return reply.code(400).send({ error: 'VALIDATION', issues: ['since debe ser fecha ISO'] });
    const items = await store.listPois({ bbox, types, since: q.since });
    return { items, serverTime: new Date().toISOString() };
  });

  // ---- RF-11: ayudas ----
  app.get('/v1/aid/entities', async () => ({ items: (await store.listAidEntities()).filter((e) => e.active) }));
  app.get('/v1/aid/needs', async () => ({ items: await store.listAidNeeds() }));

  // ---- RF-09: lecturas colaborativas y eventos confirmados ----
  app.post('/v1/seismic/readings', { preHandler: auth as never }, async (req, reply) => {
    const p = readingsInput.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: 'VALIDATION', issues: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    let confirmed = 0;
    for (const r of p.data.readings) {
      const res = await ingestReading(store, { ...r, deviceId: req.deviceId! });
      if (res.confirmed) confirmed++;
    }
    return { accepted: p.data.readings.length, confirmedEvents: confirmed };
  });
  app.get('/v1/seismic/events', async (req, reply) => {
    const since = (req.query as { since?: string }).since;
    if (since && Number.isNaN(Date.parse(since))) return reply.code(400).send({ error: 'VALIDATION', issues: ['since debe ser fecha ISO'] });
    return { items: await store.listSeismicEvents(since) };
  });

  // ---- RF-01: contenido ----
  app.get('/v1/content/manifest', async (_req, reply) => {
    const pkg = await store.latestContent();
    return pkg ? pkg.manifest : reply.code(404).send({ error: 'NO_CONTENT' });
  });
  app.get('/v1/content/package/:version', async (req, reply) => {
    const pkg = await store.getContent((req.params as { version: string }).version);
    return pkg ?? reply.code(404).send({ error: 'NOT_FOUND' });
  });

  // ---- RF-10: tiles ----
  app.get('/v1/tiles/regions', async () => ({ items: await store.listTileRegions() }));
  app.get('/v1/tiles/regions/:id/download', async (req, reply) => {
    const r = await store.getTileRegion((req.params as { id: string }).id);
    if (!r) return reply.code(404).send({ error: 'NOT_FOUND' });
    if (!r.url) return reply.code(404).send({ error: 'NOT_PUBLISHED' });
    return reply.redirect(r.url, 302);
  });

  // ---- RF-13: códigos de socorrista ----
  app.post('/v1/rescuer/verify', { preHandler: rateLimiter(10) as never }, async (req, reply) => {
    const code = (req.body as { code?: unknown } | undefined)?.code;
    if (typeof code !== 'string' || code.length < 6 || code.length > 64) return reply.code(400).send({ error: 'VALIDATION', issues: ['code requerido'] });
    const rec = await store.findRescuerCode(hashRescuerCode(code, pepper));
    if (!rec || rec.revoked || Date.parse(rec.expiresAt) <= Date.now()) return { valid: false };
    return { valid: true, organization: rec.organization, expiresAt: rec.expiresAt };
  });
  // Lista firmada de hashes vigentes para validar códigos sin conexión (D-06).
  app.get('/v1/rescuer/list', async () => {
    const issuedAt = new Date().toISOString();
    const hashes = await store.listActiveRescuerHashes(issuedAt);
    return { issuedAt, hashes, publicKey: signer.publicKeyB64, signature: signer.sign(rescuerListMessage(issuedAt, hashes)) };
  });
}
