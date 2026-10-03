import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { aidEntityInput, aidNeedInput, poiInput } from './routes/schemas.js';
import { MemoryStore } from './store/memoryStore.js';
import { PgStore } from './store/pgStore.js';
import type { Store } from './store/types.js';

export const SEED_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'seed');

const read = (dir: string, f: string): unknown => JSON.parse(readFileSync(join(dir, f), 'utf8'));

/** Carga server/seed/*.json (POIs, entidades de ayuda, necesidades). Datos NO verificados: ver seed/README.md. */
export async function seedStore(store: Store, dir = SEED_DIR): Promise<{ pois: number; entities: number; needs: number; tiles: number }> {
  const pois = z.array(poiInput).parse(read(dir, 'pois.json'));
  const entities = z.array(aidEntityInput).parse(read(dir, 'entidades_ayuda.json'));
  const needs = z.array(aidNeedInput).parse(read(dir, 'necesidades.json'));
  for (const p of pois) await store.upsertPoi(p);
  for (const e of entities) await store.upsertAidEntity(e);
  for (const n of needs) await store.upsertAidNeed(n);
  // Región de mapa inicial (sin URL hasta publicar el MBTiles real: JD-060/061).
  await store.upsertTileRegion({ id: 'bogota', name: 'Bogotá', sizeMB: 180, version: '1' });
  return { pois: pois.length, entities: entities.length, needs: needs.length, tiles: 1 };
}

if (process.argv[1]?.endsWith('seed.ts')) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Falta DATABASE_URL (el seed de memoria se hace al arrancar con SEED_ON_START=true)');
    process.exit(1);
  }
  const store = PgStore.connect(url);
  seedStore(store)
    .then((r) => console.log('Semilla cargada:', r))
    .finally(() => store.close());
}
export { MemoryStore };
