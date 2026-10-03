import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { seedStore } from './seed.js';
import { MemoryStore } from './store/memoryStore.js';
import { migrate } from './store/migrate.js';
import { PgStore } from './store/pgStore.js';
import type { Store } from './store/types.js';

async function main() {
  const config = loadConfig();
  let store: Store;
  if (config.databaseUrl) {
    const applied = await migrate(config.databaseUrl);
    if (applied.length) console.log('Migraciones aplicadas:', applied.join(', '));
    store = PgStore.connect(config.databaseUrl);
  } else {
    console.warn('DATABASE_URL no definido: usando almacenamiento EN MEMORIA (se pierde al reiniciar)');
    store = new MemoryStore();
  }
  if (process.env.SEED_ON_START === 'true') console.log('Semilla cargada:', await seedStore(store));
  if (!config.adminToken) console.warn('ADMIN_TOKEN no definido: las rutas /admin responden 503');
  const app = buildApp({ store, config });
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`EarthQuakeTracker API escuchando en :${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
