import Fastify, { type FastifyInstance } from 'fastify';
import { loadConfig, type Config } from './config.js';
import { NonceCache, requireDevice } from './security/deviceAuth.js';
import { rateLimiter } from './security/rateLimit.js';
import { adminRoutes } from './routes/admin.js';
import { catalogRoutes } from './routes/catalogs.js';
import { devicesRoutes } from './routes/devices.js';
import { syncRoutes } from './routes/sync.js';
import { createSigner, type ServerSigner } from './services/rescuer.js';
import { MemoryStore } from './store/memoryStore.js';
import type { Store } from './store/types.js';

export interface AppDeps {
  store?: Store;
  config?: Partial<Config>;
  signer?: ServerSigner;
  /** Tolerancia de ts de eventos respecto al servidor (ms). */
  maxFutureSkewMs?: number;
}

export function buildApp(deps: AppDeps = {}): FastifyInstance {
  const config: Config = { ...loadConfig({}), ...deps.config };
  const store = deps.store ?? new MemoryStore();
  const signer = deps.signer ?? createSigner(config.serverSigningKey);
  const app = Fastify({ logger: false, bodyLimit: 25 * 1024 * 1024 });

  // Conserva el cuerpo crudo para verificar la firma de las peticiones.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    (req as { rawBody?: Buffer }).rawBody = body as Buffer;
    if (!(body as Buffer).length) return done(null, {});
    try {
      done(null, JSON.parse((body as Buffer).toString('utf8')));
    } catch {
      const err = new Error('JSON inválido') as Error & { statusCode: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  app.addHook('onRequest', rateLimiter(config.rateLimitPerMin));

  const auth = requireDevice({ store, skewMs: config.signatureSkewMs, nonces: new NonceCache(config.signatureSkewMs * 2) });

  catalogRoutes(app, store, auth as never, signer, config.rescuerPepper);
  devicesRoutes(app, store, config.signatureSkewMs);
  syncRoutes(app, store, auth as never, deps.maxFutureSkewMs ?? 5 * 60 * 1000);
  adminRoutes(app, store, config.adminToken, config.rescuerPepper);

  app.addHook('onClose', async () => store.close());
  return app;
}
