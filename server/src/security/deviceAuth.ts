import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Store } from '../store/types.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
    deviceId?: string;
  }
}

// Prefijo DER SubjectPublicKeyInfo de una clave pública Ed25519 de 32 bytes.
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export const sha256Hex = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');

export function deviceIdFromPubkey(pubkeyB64: string): string {
  return 'dev_' + sha256Hex(Buffer.from(pubkeyB64, 'base64')).slice(0, 16);
}

export function isValidPubkey(pubkeyB64: string): boolean {
  try {
    return Buffer.from(pubkeyB64, 'base64').length === 32;
  } catch {
    return false;
  }
}

export function verifyEd25519(pubkeyB64: string, message: Buffer | string, sigB64: string): boolean {
  try {
    const raw = Buffer.from(pubkeyB64, 'base64');
    if (raw.length !== 32) return false;
    const key = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, raw]), format: 'der', type: 'spki' });
    return cryptoVerify(null, Buffer.isBuffer(message) ? message : Buffer.from(message), key, Buffer.from(sigB64, 'base64'));
  } catch {
    return false;
  }
}

/** Cadena canónica firmada por el dispositivo: método, ruta+query, timestamp(ms), nonce y hash del cuerpo. */
export function canonicalRequest(method: string, url: string, ts: string, nonce: string, body: Buffer | undefined): string {
  return [method.toUpperCase(), url, ts, nonce, sha256Hex(body ?? Buffer.alloc(0))].join('\n');
}

/** Caché de nonces para impedir replay dentro de la ventana de tolerancia. */
export class NonceCache {
  private seen = new Map<string, number>();
  constructor(private ttlMs: number) {}
  /** true si el nonce es nuevo; false si ya se vio (replay). */
  check(key: string, now = Date.now()): boolean {
    for (const [k, exp] of this.seen) if (exp <= now) this.seen.delete(k);
    if (this.seen.has(key)) return false;
    this.seen.set(key, now + this.ttlMs);
    return true;
  }
}

export interface AuthOptions {
  store: Store;
  skewMs: number;
  nonces: NonceCache;
}

const unauthorized = (reply: FastifyReply, reason: string) => reply.code(401).send({ error: 'UNAUTHORIZED', reason });

/** preHandler Fastify: exige X-Device-Id, X-Timestamp, X-Nonce y X-Signature válidos. */
export function requireDevice(opts: AuthOptions) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const id = req.headers['x-device-id'];
    const ts = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];
    const sig = req.headers['x-signature'];
    if (typeof id !== 'string' || typeof ts !== 'string' || typeof nonce !== 'string' || typeof sig !== 'string') {
      return unauthorized(reply, 'faltan cabeceras de firma');
    }
    const t = Number(ts);
    if (!Number.isFinite(t) || Math.abs(Date.now() - t) > opts.skewMs) return unauthorized(reply, 'timestamp fuera de ventana');
    const device = await opts.store.getDevice(id);
    if (!device || device.revoked) return unauthorized(reply, 'dispositivo desconocido o revocado');
    const msg = canonicalRequest(req.method, req.url, ts, nonce, req.rawBody);
    if (!verifyEd25519(device.pubkey, msg, sig)) return unauthorized(reply, 'firma inválida');
    if (!opts.nonces.check(`${id}:${nonce}`)) return unauthorized(reply, 'nonce repetido');
    req.deviceId = id;
  };
}
