import type { FastifyReply, FastifyRequest } from 'fastify';

/** Límite de tasa de ventana fija en memoria, por dispositivo (si está autenticado) o IP. */
export function rateLimiter(maxPerWindow: number, windowMs = 60_000) {
  const hits = new Map<string, { count: number; reset: number }>();
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (maxPerWindow <= 0) return;
    const key = (req.headers['x-device-id'] as string | undefined) ?? req.ip;
    const now = Date.now();
    let h = hits.get(key);
    if (!h || h.reset <= now) {
      h = { count: 0, reset: now + windowMs };
      hits.set(key, h);
    }
    h.count++;
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    if (h.count > maxPerWindow) {
      reply.header('Retry-After', Math.ceil((h.reset - now) / 1000));
      return reply.code(429).send({ error: 'RATE_LIMITED' });
    }
  };
}
