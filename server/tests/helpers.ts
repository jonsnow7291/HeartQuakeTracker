import { createHash, generateKeyPairSync, randomUUID, sign, type KeyObject } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

export interface TestDevice {
  priv: KeyObject;
  pubB64: string;
  id?: string;
}

export function newDevice(): TestDevice {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return { priv: privateKey, pubB64: publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64') };
}

export async function registerDevice(app: FastifyInstance, d: TestDevice, platform: 'android' | 'ios' = 'android'): Promise<string> {
  const ts = Date.now();
  const proof = sign(null, Buffer.from(`register|${d.pubB64}|${ts}`), d.priv).toString('base64');
  const res = await app.inject({ method: 'POST', url: '/v1/devices/register', payload: { publicKey: d.pubB64, platform, appVersion: '0.1.0', ts, proof } });
  if (res.statusCode >= 300) throw new Error(`registro falló: ${res.statusCode} ${res.body}`);
  d.id = res.json().deviceId;
  return d.id!;
}

export function signedHeaders(d: TestDevice, method: string, url: string, body: string, over: { ts?: number; nonce?: string } = {}) {
  const ts = String(over.ts ?? Date.now());
  const nonce = over.nonce ?? randomUUID();
  const bodyHash = createHash('sha256').update(body).digest('hex');
  const msg = [method.toUpperCase(), url, ts, nonce, bodyHash].join('\n');
  return {
    'content-type': 'application/json',
    'x-device-id': d.id!,
    'x-timestamp': ts,
    'x-nonce': nonce,
    'x-signature': sign(null, Buffer.from(msg), d.priv).toString('base64'),
  };
}

export async function signedPost(app: FastifyInstance, d: TestDevice, url: string, payload: unknown, over: { ts?: number; nonce?: string } = {}) {
  const body = JSON.stringify(payload);
  return app.inject({ method: 'POST', url, payload: body, headers: signedHeaders(d, 'POST', url, body, over) });
}

export const ev = (id: string, device: string, extra: Record<string, unknown> = {}) => ({
  eventId: id,
  type: 'MARK_SAFE',
  ts: new Date().toISOString(),
  device,
  payload: {},
  ...extra,
});

export const ADMIN = { authorization: 'Bearer test-admin-token' };
