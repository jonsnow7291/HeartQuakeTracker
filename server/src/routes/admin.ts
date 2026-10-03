import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sha256Hex } from '../security/deviceAuth.js';
import { hashRescuerCode } from '../services/rescuer.js';
import type { Store } from '../store/types.js';
import { aidEntityInput, aidNeedInput, contentPublishInput, poiInput, rescuerCodeInput, tileRegionInput } from './schemas.js';

const bad = (reply: FastifyReply, issues: { path: (string | number)[]; message: string }[]) =>
  reply.code(400).send({ error: 'VALIDATION', issues: issues.map((i) => `${i.path.join('.')}: ${i.message}`) });

export function adminRoutes(app: FastifyInstance, store: Store, adminToken: string | undefined, pepper: string) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!adminToken) return reply.code(503).send({ error: 'ADMIN_DISABLED' });
    const h = req.headers.authorization ?? '';
    const given = Buffer.from(h.startsWith('Bearer ') ? h.slice(7) : '');
    const want = Buffer.from(adminToken);
    if (given.length !== want.length || !timingSafeEqual(given, want)) return reply.code(401).send({ error: 'UNAUTHORIZED' });
  };
  const opts = { preHandler: guard };

  const upsertPoi = async (req: FastifyRequest, reply: FastifyReply, idFromPath?: string) => {
    const body = { ...(req.body as object), ...(idFromPath ? { id: idFromPath } : {}) };
    const p = poiInput.safeParse(body);
    if (!p.success) return bad(reply, p.error.issues);
    const rec = await store.upsertPoi(p.data);
    await store.audit('admin', 'UPSERT', `poi:${rec.id}`);
    return rec;
  };
  app.post('/admin/pois', opts, (req, reply) => upsertPoi(req, reply));
  app.put('/admin/pois/:id', opts, (req, reply) => upsertPoi(req, reply, (req.params as { id: string }).id));

  app.post('/admin/aid/entities', opts, async (req, reply) => {
    const p = aidEntityInput.safeParse(req.body);
    if (!p.success) return bad(reply, p.error.issues);
    await store.upsertAidEntity(p.data);
    await store.audit('admin', 'UPSERT', `aid_entity:${p.data.id}`);
    return reply.code(201).send(p.data);
  });
  app.post('/admin/aid/needs', opts, async (req, reply) => {
    const p = aidNeedInput.safeParse(req.body);
    if (!p.success) return bad(reply, p.error.issues);
    await store.upsertAidNeed(p.data);
    await store.audit('admin', 'UPSERT', `aid_need:${p.data.id}`);
    return reply.code(201).send(p.data);
  });

  app.post('/admin/content/publish', opts, async (req, reply) => {
    const p = contentPublishInput.safeParse(req.body);
    if (!p.success) return bad(reply, p.error.issues);
    if (await store.getContent(p.data.version)) return reply.code(409).send({ error: 'VERSION_EXISTS' });
    const files = p.data.files.map((f) => {
      const buf = Buffer.from(f.contentBase64, 'base64');
      return { path: f.path, sha256: sha256Hex(buf), bytes: buf.length, contentBase64: f.contentBase64 };
    });
    const generatedAt = new Date().toISOString();
    await store.publishContent({
      manifest: { version: p.data.version, generatedAt, files: files.map(({ path, sha256, bytes }) => ({ path, sha256, bytes })) },
      files,
      publishedAt: generatedAt,
    });
    await store.audit('admin', 'PUBLISH', `content:${p.data.version}`);
    return reply.code(201).send({ version: p.data.version, files: files.length });
  });

  app.post('/admin/tiles/regions', opts, async (req, reply) => {
    const p = tileRegionInput.safeParse(req.body);
    if (!p.success) return bad(reply, p.error.issues);
    await store.upsertTileRegion(p.data);
    await store.audit('admin', 'UPSERT', `tile_region:${p.data.id}`);
    return reply.code(201).send(p.data);
  });

  app.post('/admin/rescuer/codes', opts, async (req, reply) => {
    const p = rescuerCodeInput.safeParse(req.body);
    if (!p.success) return bad(reply, p.error.issues);
    await store.upsertRescuerCode({ codeHash: hashRescuerCode(p.data.code, pepper), organization: p.data.organization, expiresAt: p.data.expiresAt, revoked: false });
    await store.audit('admin', 'CREATE', `rescuer_code:${p.data.organization}`);
    return reply.code(201).send({ organization: p.data.organization, expiresAt: p.data.expiresAt });
  });
}
