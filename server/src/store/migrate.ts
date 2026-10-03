import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = join(here, '..', '..', 'migrations');

/** Aplica en orden los .sql de /migrations que no se hayan ejecutado (tabla schema_migrations). */
export async function migrate(connectionString: string, dir = MIGRATIONS_DIR): Promise<string[]> {
  const pool = new pg.Pool({ connectionString, max: 1 });
  const applied: string[] = [];
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name as string));
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(readFileSync(join(dir, f), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
        await client.query('COMMIT');
        applied.push(f);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migración ${f} falló: ${(err as Error).message}`);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
  return applied;
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Falta DATABASE_URL');
    process.exit(1);
  }
  migrate(url).then((a) => console.log(a.length ? `Migraciones aplicadas: ${a.join(', ')}` : 'Sin migraciones pendientes'));
}
