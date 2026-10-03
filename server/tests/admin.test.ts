import { createPublicKey, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { rescuerListMessage } from '../src/services/rescuer.js';
import { ADMIN } from './helpers.js';

const mk = (token: string | null = 'test-admin-token') => buildApp({ config: { rateLimitPerMin: 0, adminToken: token ?? undefined } });
const SPKI = Buffer.from('302a300506032b6570032100', 'hex');

describe('Admin', () => {
  it('503 si no hay ADMIN_TOKEN, 401 sin/ con token malo, 200 con token', async () => {
    expect((await mk(null).inject({ method: 'POST', url: '/admin/pois', payload: {} })).statusCode).toBe(503);
    const app = mk();
    expect((await app.inject({ method: 'POST', url: '/admin/pois', payload: {} })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/admin/pois', headers: { authorization: 'Bearer malo' }, payload: {} })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/admin/pois', headers: ADMIN, payload: { id: 'x1', type: 'SALUD', name: 'H', lat: 4.6, lon: -74.1 } })).statusCode).toBe(200);
  });

  it('valida los cuerpos (400)', async () => {
    const app = mk();
    const r = await app.inject({ method: 'POST', url: '/admin/pois', headers: ADMIN, payload: { id: 'x', type: 'XXX', name: 'n', lat: 999, lon: 0 } });
    expect(r.statusCode).toBe(400);
    expect(r.json().issues.length).toBeGreaterThan(0);
  });

  it('contenido: publica, calcula sha256/bytes, sirve manifest y paquete; 409 si repite versión', async () => {
    const app = mk();
    expect((await app.inject({ method: 'GET', url: '/v1/content/manifest' })).statusCode).toBe(404);
    const md = Buffer.from('# Hola mochila').toString('base64');
    const pub = await app.inject({ method: 'POST', url: '/admin/content/publish', headers: ADMIN, payload: { version: '1.0.0', files: [{ path: 'guias/mochila.md', contentBase64: md }] } });
    expect(pub.statusCode).toBe(201);
    const manifest = (await app.inject({ method: 'GET', url: '/v1/content/manifest' })).json();
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.files[0]).toMatchObject({ path: 'guias/mochila.md', bytes: 14 });
    expect(manifest.files[0].sha256).toHaveLength(64);
    const pkg = (await app.inject({ method: 'GET', url: '/v1/content/package/1.0.0' })).json();
    expect(pkg.files[0].contentBase64).toBe(md);
    expect((await app.inject({ method: 'POST', url: '/admin/content/publish', headers: ADMIN, payload: { version: '1.0.0', files: [{ path: 'a.md', contentBase64: md }] } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/admin/content/publish', headers: ADMIN, payload: { version: 'uno', files: [{ path: 'a.md', contentBase64: md }] } })).statusCode).toBe(400);
  });
});

describe('Socorristas (RF-13)', () => {
  const exp = new Date(Date.now() + 86400_000).toISOString();

  it('verify: válido, inválido, expirado y revocado', async () => {
    const app = mk();
    await app.inject({ method: 'POST', url: '/admin/rescuer/codes', headers: ADMIN, payload: { code: 'bomberos-2026', organization: 'Bomberos Bogotá', expiresAt: exp } });
    await app.inject({ method: 'POST', url: '/admin/rescuer/codes', headers: ADMIN, payload: { code: 'viejo-code-1', organization: 'X', expiresAt: new Date(Date.now() - 1000).toISOString() } });
    const ok = (await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: ' Bomberos-2026 ' } })).json();
    expect(ok).toMatchObject({ valid: true, organization: 'Bomberos Bogotá' });
    expect((await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: 'noexiste1' } })).json()).toEqual({ valid: false });
    expect((await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: 'viejo-code-1' } })).json()).toEqual({ valid: false });
    expect((await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: 'x' } })).statusCode).toBe(400);
  });

  it('verify limita intentos (fuerza bruta)', async () => {
    const app = mk();
    const codes: number[] = [];
    for (let i = 0; i < 12; i++) codes.push((await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: `intento-${i}-x` } })).statusCode);
    expect(codes.slice(0, 10).every((c) => c === 200)).toBe(true);
    expect(codes.slice(10)).toEqual([429, 429]);
  });

  it('lista firmada: la firma verifica con la clave pública del servidor y solo trae vigentes', async () => {
    const app = mk();
    await app.inject({ method: 'POST', url: '/admin/rescuer/codes', headers: ADMIN, payload: { code: 'bomberos-2026', organization: 'B', expiresAt: exp } });
    await app.inject({ method: 'POST', url: '/admin/rescuer/codes', headers: ADMIN, payload: { code: 'viejo-code-1', organization: 'X', expiresAt: new Date(Date.now() - 1000).toISOString() } });
    const l = (await app.inject({ method: 'GET', url: '/v1/rescuer/list' })).json();
    expect(l.hashes).toHaveLength(1);
    const key = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(l.publicKey, 'base64')]), format: 'der', type: 'spki' });
    expect(verify(null, Buffer.from(rescuerListMessage(l.issuedAt, l.hashes)), key, Buffer.from(l.signature, 'base64'))).toBe(true);
    expect(verify(null, Buffer.from(rescuerListMessage(l.issuedAt, [...l.hashes, 'x'])), key, Buffer.from(l.signature, 'base64'))).toBe(false);
  });
});
