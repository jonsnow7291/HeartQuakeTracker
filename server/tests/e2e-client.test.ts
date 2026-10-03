import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomBytes, scrypt } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { ContentServiceImpl } from '../../src/core/content/ContentServiceImpl';
import { HttpContentRemote } from '../../src/core/content/HttpContentRemote';
import { ADMIN } from './helpers.js';

// Integración real cliente ↔ servidor: el ContentService del celular consume la API del backend.
const root = join(__dirname, '..', '..', 'content');
const mem = () => {
  const m = new Map<string, Uint8Array>();
  return {
    files: {
      read: async (p: string) => m.get(p) ?? null,
      write: async (p: string, d: Uint8Array) => void m.set(p, d),
      remove: async (p: string) => void [...m.keys()].filter((k) => k === p || k.startsWith(p + '/')).forEach((k) => m.delete(k)),
      list: async (pre: string) => [...m.keys()].filter((k) => k.startsWith(pre)),
    },
  };
};
const kv = () => {
  const m = new Map<string, string>();
  return {
    get: async (k: string) => m.get(k) ?? null,
    set: async (k: string, v: string) => void m.set(k, v),
    delete: async (k: string) => void m.delete(k),
    keys: async (p: string) => [...m.keys()].filter((k) => k.startsWith(p)),
  };
};
const crypto = {
  randomBytes: (n: number) => new Uint8Array(randomBytes(n)),
  sha256Hex: async (d: Uint8Array) => createHash('sha256').update(d).digest('hex'),
  deriveKey: (pin: string, salt: Uint8Array) => new Promise<Uint8Array>((res, rej) => scrypt(pin, salt, 32, (e, k) => (e ? rej(e) : res(new Uint8Array(k))))),
};
const collect = (dir: string, base = dir): { path: string; contentBase64: string }[] =>
  readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    return statSync(full).isDirectory() ? collect(full, base) : [{ path: full.slice(base.length + 1), contentBase64: readFileSync(full).toString('base64') }];
  });

describe('Cliente ContentService ↔ servidor real (RF-01)', () => {
  it('publica el contenido de Santiago en el servidor y el cliente lo descarga, verifica y lee', async () => {
    const app = buildApp({ config: { rateLimitPerMin: 0, adminToken: 'test-admin-token' } });
    const files = [...collect(join(root, 'guias'), root), ...collect(join(root, 'quiz'), root)];
    expect((await app.inject({ method: 'POST', url: '/admin/content/publish', headers: ADMIN, payload: { version: '2.0.0', files } })).statusCode).toBe(201);

    // fetch → app.inject (sin abrir puertos)
    const fetchFn = async (url: string) => {
      const r = await app.inject({ method: 'GET', url: url.replace('http://api.test', '') });
      return { ok: r.statusCode < 300, status: r.statusCode, json: async () => r.json() };
    };
    const svc = new ContentServiceImpl({ files: mem().files, state: kv(), crypto, remote: new HttpContentRemote('http://api.test', fetchFn) });

    // Sin bundle: primera instalación vía red
    await expect(svc.listGuides()).rejects.toMatchObject({ code: 'CONTENT_MISSING' });
    expect(await svc.checkUpdates()).toEqual({ available: true, applied: true });
    const guides = await svc.listGuides();
    expect(guides.length).toBe(files.filter((f) => f.path.startsWith('guias/')).length);
    expect(await svc.getGuideMarkdown('mochila-emergencia')).toContain('72');
    expect((await svc.getQuizBank()).levels.length).toBeGreaterThan(0);
    expect(await svc.checkUpdates()).toEqual({ available: false, applied: false }); // ya está al día
  });
});
