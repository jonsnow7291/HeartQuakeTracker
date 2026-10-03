import type { FastifyInstance } from 'fastify';
import { batchSchema, type Ack } from '../domain/events.js';
import { ingestReading } from '../services/seismic.js';
import type { Store } from '../store/types.js';

type Pre = (req: never, reply: never) => Promise<unknown>;

export function syncRoutes(app: FastifyInstance, store: Store, auth: Pre, maxFutureSkewMs: number) {
  // RF-12: ingesta idempotente con ACK por ítem.
  app.post('/v1/sync/batch', { preHandler: auth as never }, async (req, reply) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
    }
    const acks: Ack[] = [];
    const now = Date.now();
    for (const e of parsed.data.events) {
      if (e.device !== req.deviceId) {
        acks.push({ eventId: e.eventId, status: 'REJECTED', reason: 'device no coincide con la firma' });
        continue;
      }
      if (Date.parse(e.ts) > now + maxFutureSkewMs) {
        acks.push({ eventId: e.eventId, status: 'REJECTED', reason: 'ts en el futuro' });
        continue;
      }
      const isNew = await store.insertEventIfAbsent(e);
      acks.push({ eventId: e.eventId, status: isNew ? 'OK' : 'DUP' });
      if (!isNew) continue;
      const p = e.payload as Record<string, unknown>;
      if (e.type === 'SENSOR_READING' && typeof p.peakG === 'number') {
        await ingestReading(store, {
          eventId: e.eventId,
          deviceId: e.device,
          ts: e.ts,
          peakG: p.peakG,
          lat: e.geo?.lat,
          lon: e.geo?.lon,
          quorumNodes: typeof p.quorumNodes === 'number' ? p.quorumNodes : 0,
          classification: p.classification === 'CONFIRMED' || p.classification === 'DISCARDED' ? p.classification : 'POSSIBLE',
        });
      } else if (e.type === 'POI_PROBLEM' && typeof p.poiId === 'string') {
        await store.insertPoiReport({
          poiId: p.poiId,
          deviceId: e.device,
          reason: typeof p.reason === 'string' ? p.reason : 'OTRO',
          note: typeof p.note === 'string' ? p.note : undefined,
        });
      }
    }
    return { acks };
  });
}
