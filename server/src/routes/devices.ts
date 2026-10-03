import type { FastifyInstance } from 'fastify';
import { deviceIdFromPubkey, isValidPubkey, verifyEd25519 } from '../security/deviceAuth.js';
import type { Store } from '../store/types.js';
import { registerInput } from './schemas.js';

export function devicesRoutes(app: FastifyInstance, store: Store, skewMs: number) {
  // Alta de dispositivo: prueba de posesión de la clave (firma de "register|publicKey|ts").
  app.post('/v1/devices/register', async (req, reply) => {
    const p = registerInput.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: 'VALIDATION', issues: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    const { publicKey, platform, appVersion, ts, proof } = p.data;
    if (!isValidPubkey(publicKey)) return reply.code(400).send({ error: 'VALIDATION', issues: ['publicKey debe ser Ed25519 de 32 bytes en base64'] });
    if (Math.abs(Date.now() - ts) > skewMs) return reply.code(401).send({ error: 'UNAUTHORIZED', reason: 'timestamp fuera de ventana' });
    if (!verifyEd25519(publicKey, `register|${publicKey}|${ts}`, proof)) return reply.code(401).send({ error: 'UNAUTHORIZED', reason: 'prueba de posesión inválida' });
    const id = deviceIdFromPubkey(publicKey);
    const existing = await store.getDevice(id);
    if (existing?.revoked) return reply.code(403).send({ error: 'REVOKED' });
    await store.upsertDevice({ id, pubkey: publicKey, platform, appVersion, createdAt: existing?.createdAt ?? new Date().toISOString(), revoked: false });
    return reply.code(existing ? 200 : 201).send({ deviceId: id });
  });
}
