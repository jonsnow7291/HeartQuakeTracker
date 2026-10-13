import { open, type DB } from '@op-engineering/op-sqlite';
import { AppException } from '../../contracts/types';
import type { KeyValueStore } from '../../core/platform/ports';
import { getDatabaseKey } from './DatabaseKey';

export interface SqliteStoreOptions {
  /** Nombre del archivo de base de datos SQLite (por defecto 'eqt_storage.db'). */
  name?: string;
  /** Clave de cifrado para SQLCipher. Por defecto, la clave maestra del dispositivo (Keystore/Keychain). */
  encryptionKey?: string;
  /** Ubicación en el sistema de archivos (opcional). */
  location?: string;
}

/**
 * Adaptador KeyValueStore sobre @op-engineering/op-sqlite con soporte SQLCipher (ADR 0002, D-11).
 * Almacena pares clave-valor indexados en una base de datos SQLite/SQLCipher local.
 */
export class SqliteKeyValueStore implements KeyValueStore {
  private dbInstance: DB | null = null;
  private initPromise: Promise<DB> | null = null;
  /** Las escrituras se encadenan: varias a la vez sobre una misma base provocaban «database is locked». */
  private writeChain: Promise<unknown> = Promise.resolve();

  private enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
    const run = this.writeChain.then(op, op);
    this.writeChain = run.catch(() => undefined);
    return run;
  }

  constructor(private readonly options: SqliteStoreOptions = {}) {}

  async get(key: string): Promise<string | null> {
    const db = await this.ensureDb();
    try {
      const result = await db.execute('SELECT value FROM kv WHERE key = ? LIMIT 1', [key]);
      const row = result.rows?.[0];
      if (!row || typeof row.value !== 'string') return null;
      return row.value;
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al consultar clave "${key}" en SQLite: ${String(err)}`);
    }
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.ensureDb();
    await this.enqueueWrite(async () => {
      try {
        await db.execute('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', [key, value]);
      } catch (err) {
        throw new AppException('STORAGE_FAILED', `Error al guardar clave "${key}" en SQLite: ${String(err)}`);
      }
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.ensureDb();
    await this.enqueueWrite(async () => {
      try {
        await db.execute('DELETE FROM kv WHERE key = ?', [key]);
      } catch (err) {
        throw new AppException('STORAGE_FAILED', `Error al eliminar clave "${key}" en SQLite: ${String(err)}`);
      }
    });
  }

  async keys(prefix: string): Promise<string[]> {
    const db = await this.ensureDb();
    try {
      const result = await db.execute('SELECT key FROM kv WHERE key LIKE ? ORDER BY key ASC', [prefix + '%']);
      const rows = result.rows ?? [];
      const keys: string[] = [];
      for (const row of rows) {
        if (typeof row.key === 'string') {
          keys.push(row.key);
        }
      }
      return keys;
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al listar claves con prefijo "${prefix}" en SQLite: ${String(err)}`);
    }
  }

  /** Cierra la conexión a la base de datos si estaba abierta. */
  async close(): Promise<void> {
    if (this.dbInstance) {
      try {
        await this.dbInstance.closeAsync();
      } finally {
        this.dbInstance = null;
        this.initPromise = null;
      }
    }
  }

  private async ensureDb(): Promise<DB> {
    if (this.dbInstance) return this.dbInstance;
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    return this.initPromise;
  }

  private async init(): Promise<DB> {
    const name = this.options.name ?? 'eqt_storage.db';
    // El módulo nativo exige Strings: no se envían campos indefinidos.
    const config: { name: string; encryptionKey: string; location?: string } = {
      name,
      encryptionKey: this.options.encryptionKey ?? (await getDatabaseKey()),
    };
    if (this.options.location) config.location = this.options.location;
    const db = open(config);

    // Espera hasta 5 s si la base está ocupada en lugar de fallar al instante.
    await db.execute('PRAGMA busy_timeout = 5000');
    await db.execute('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    this.dbInstance = db;
    return db;
  }
}
