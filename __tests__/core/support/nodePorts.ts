import { createHash, randomBytes, scrypt } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { BiometricPort, Clock, ContentManifest, CryptoPort, FileStore, KeyValueStore, PackageData } from '../../../src/core/platform/ports';

export class MemoryKeyValueStore implements KeyValueStore {
  data = new Map<string, string>();
  /** Si > 0, las próximas N escrituras fallan (para probar reintentos). */
  failNextSets = 0;
  async get(k: string) {
    return this.data.get(k) ?? null;
  }
  async set(k: string, v: string) {
    if (this.failNextSets > 0) {
      this.failNextSets--;
      throw new Error('disco lleno (simulado)');
    }
    this.data.set(k, v);
  }
  async delete(k: string) {
    this.data.delete(k);
  }
  async keys(prefix: string) {
    return [...this.data.keys()].filter((k) => k.startsWith(prefix));
  }
}

export class MemoryFileStore implements FileStore {
  files = new Map<string, Uint8Array>();
  async read(p: string) {
    return this.files.get(p) ?? null;
  }
  async write(p: string, d: Uint8Array) {
    this.files.set(p, d);
  }
  async remove(p: string) {
    for (const k of [...this.files.keys()]) if (k === p || k.startsWith(p + '/')) this.files.delete(k);
  }
  async list(prefix: string) {
    return [...this.files.keys()].filter((k) => k.startsWith(prefix));
  }
}

/** Cripto de Node para tests. En el celular: libsodium (Argon2id). scrypt con coste bajo para velocidad. */
export const nodeCrypto: CryptoPort = {
  randomBytes: (n) => new Uint8Array(randomBytes(n)),
  sha256Hex: async (d) => createHash('sha256').update(d).digest('hex'),
  deriveKey: (pin, salt) =>
    new Promise((res, rej) => scrypt(pin, salt, 32, { N: 1024, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(new Uint8Array(k))))),
};

export class FakeClock implements Clock {
  constructor(public t = 1_700_000_000_000) {}
  now() {
    return this.t;
  }
  advance(ms: number) {
    this.t += ms;
  }
}

export class FakeBiometric implements BiometricPort {
  available = true;
  accept = true;
  async isAvailable() {
    return this.available;
  }
  async authenticate() {
    return this.accept;
  }
}

const sha = (d: Uint8Array) => createHash('sha256').update(d).digest('hex');

/** Construye un paquete (como el que sirve el servidor) a partir de archivos en memoria. */
export function makePackage(version: string, files: Record<string, string>): PackageData {
  const list = Object.entries(files).map(([path, text]) => ({ path, data: new TextEncoder().encode(text) }));
  const manifest: ContentManifest = {
    version,
    generatedAt: new Date().toISOString(),
    files: list.map((f) => ({ path: f.path, sha256: sha(f.data), bytes: f.data.length })),
  };
  return { manifest, files: list };
}

/** Empaqueta el contenido REAL del repo (content/guias y content/quiz) como lo haría el publicador. */
export function packageFromRepoContent(root: string, version = '1.0.0'): PackageData {
  const files: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else files[relative(root, full).split('\\').join('/')] = readFileSync(full, 'utf8');
    }
  };
  for (const sub of ['guias', 'quiz']) walk(join(root, sub));
  return makePackage(version, files);
}
