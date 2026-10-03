import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { ev, newDevice, registerDevice, signedHeaders, signedPost } from './helpers.js';

const mk = (cfg = {}) => buildApp({ config: { rateLimitPerMin: 0, ...cfg } });

describe('Registro de dispositivos', () => {
  it('registra (201), es idempotente (200) y el id es estable', async () => {
    const app = mk();
    const d = newDevice();
    const id1 = await registerDevice(app, d);
    const id2 = await registerDevice(app, d);
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^dev_[0-9a-f]{16}$/);
  });

  it('rechaza prueba de posesión inválida', async () => {
    const app = mk();
    const d = newDevice();
    const other = newDevice();
    const { sign } = await import('node:crypto');
    const ts = Date.now();
    const proof = sign(null, Buffer.from(`register|${d.pubB64}|${ts}`), other.priv).toString('base64');
    const res = await app.inject({ method: 'POST', url: '/v1/devices/register', payload: { publicKey: d.pubB64, platform: 'ios', appVersion: '1', ts, proof } });
    expect(res.statusCode).toBe(401);
  });

  it('rechaza timestamp viejo y clave mal formada', async () => {
    const app = mk();
    const d = newDevice();
    const { sign } = await import('node:crypto');
    const ts = Date.now() - 3_600_000;
    const proof = sign(null, Buffer.from(`register|${d.pubB64}|${ts}`), d.priv).toString('base64');
    expect((await app.inject({ method: 'POST', url: '/v1/devices/register', payload: { publicKey: d.pubB64, platform: 'ios', appVersion: '1', ts, proof } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/v1/devices/register', payload: { publicKey: 'AAAA'.repeat(11), platform: 'ios', appVersion: '1', ts: Date.now(), proof } })).statusCode).toBe(400);
  });
});

describe('Peticiones firmadas', () => {
  const body = (id: string) => JSON.stringify({ events: [ev('evt-aaaaaaaa', id)] });

  it('401 sin cabeceras, con firma alterada y con dispositivo desconocido', async () => {
    const app = mk();
    const d = newDevice();
    const id = await registerDevice(app, d);
    const b = body(id);
    expect((await app.inject({ method: 'POST', url: '/v1/sync/batch', payload: b, headers: { 'content-type': 'application/json' } })).statusCode).toBe(401);
    const h = signedHeaders(d, 'POST', '/v1/sync/batch', b);
    expect((await app.inject({ method: 'POST', url: '/v1/sync/batch', payload: b + ' ', headers: h })).statusCode).toBe(401); // cuerpo alterado
    const ghost = newDevice();
    ghost.id = 'dev_0000000000000000';
    expect((await app.inject({ method: 'POST', url: '/v1/sync/batch', payload: b, headers: signedHeaders(ghost, 'POST', '/v1/sync/batch', b) })).statusCode).toBe(401);
  });

  it('401 con timestamp fuera de ventana y con nonce repetido (replay)', async () => {
    const app = mk();
    const d = newDevice();
    const id = await registerDevice(app, d);
    expect((await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-bbbbbbbb', id)] }, { ts: Date.now() - 3_600_000 })).statusCode).toBe(401);
    const nonce = randomUUID();
    const first = await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-cccccccc', id)] }, { nonce });
    expect(first.statusCode).toBe(200);
    const replay = await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-cccccccc', id)] }, { nonce });
    expect(replay.statusCode).toBe(401);
    expect(replay.json().reason).toBe('nonce repetido');
  });
});

describe('Límite de tasa', () => {
  it('429 al superar el máximo por minuto', async () => {
    const app = mk({ rateLimitPerMin: 3 });
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await app.inject({ method: 'GET', url: '/v1/health' })).statusCode);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
  });
});
