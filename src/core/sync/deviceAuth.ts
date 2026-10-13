import { generateIdentityKeyPair, signBytes, verifySignature } from '../mesh/crypto';
import { sha256 } from '../mesh/sha256';
import type { KeyValueStore } from '../platform/ports';
import { fromBase64, toBase64, utf8 } from '../util/bytes';

const DEVICE_IDENTITY_KEY = 'sync.device_identity';

export interface DeviceIdentity {
  deviceId: string;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += b.toString(16).padStart(2, '0');
  }
  return out;
}

export function sha256Hex(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? utf8(data) : data;
  return toHex(sha256(bytes));
}

/**
 * Deriva el deviceId unívoco a partir de la clave pública Ed25519 en base64:
 * deviceId = 'dev_' + sha256Hex(publicKeyBytes).slice(0, 16)
 */
export function deviceIdFromPubkey(pubkeyBase64: string): string {
  const raw = fromBase64(pubkeyBase64);
  return 'dev_' + sha256Hex(raw).slice(0, 16);
}

/**
 * Carga o genera la identidad criptográfica Ed25519 del dispositivo móvil (RF-12, D-29).
 */
export async function getOrCreateDeviceIdentity(store: KeyValueStore): Promise<DeviceIdentity> {
  const stored = await store.get(DEVICE_IDENTITY_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DeviceIdentity;
      if (parsed.deviceId && parsed.publicKeyBase64 && parsed.privateKeyBase64) {
        return parsed;
      }
    } catch {
      // Ignorar y regenerar si está corrupto
    }
  }

  const { privateKey, publicKey } = generateIdentityKeyPair();
  const publicKeyBase64 = toBase64(publicKey);
  const privateKeyBase64 = toBase64(privateKey);
  const deviceId = deviceIdFromPubkey(publicKeyBase64);

  const identity: DeviceIdentity = {
    deviceId,
    publicKeyBase64,
    privateKeyBase64,
  };

  await store.set(DEVICE_IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export interface DeviceRegistrationBody {
  publicKey: string;
  platform: 'android' | 'ios';
  appVersion: string;
  ts: number;
  proof: string;
}

/**
 * Genera el cuerpo de petición para POST /v1/devices/register con prueba de posesión.
 */
export function createRegistrationPayload(
  identity: DeviceIdentity,
  ts: number,
  platform: 'android' | 'ios' = 'android',
  appVersion = '0.1.0',
): DeviceRegistrationBody {
  const message = `register|${identity.publicKeyBase64}|${ts}`;
  const privateKey = fromBase64(identity.privateKeyBase64);
  const proofBytes = signBytes(privateKey, utf8(message));
  const proof = toBase64(proofBytes);

  return {
    publicKey: identity.publicKeyBase64,
    platform,
    appVersion,
    ts,
    proof,
  };
}

/**
 * Genera la cadena canónica y cabeceras HTTP firmadas con Ed25519 (requireDevice, docs/jd/api.md):
 * CanonicalRequest = METODO + "\n" + RUTA+QUERY + "\n" + TS + "\n" + NONCE + "\n" + SHA256HEX(cuerpo)
 */
export function signCanonicalRequest(
  identity: DeviceIdentity,
  method: string,
  url: string,
  ts: number,
  nonce: string,
  bodyJson?: string,
): Record<string, string> {
  const tsStr = String(ts);
  const bodyHash = bodyJson ? sha256Hex(utf8(bodyJson)) : sha256Hex(new Uint8Array(0));
  const canonical = [method.toUpperCase(), url, tsStr, nonce, bodyHash].join('\n');

  const privateKey = fromBase64(identity.privateKeyBase64);
  const signatureBytes = signBytes(privateKey, utf8(canonical));
  const signature = toBase64(signatureBytes);

  return {
    'Content-Type': 'application/json',
    'X-Device-Id': identity.deviceId,
    'X-Timestamp': tsStr,
    'X-Nonce': nonce,
    'X-Signature': signature,
  };
}

/**
 * Verifica una firma digital Ed25519 (utilidad equivalente a la verificación del servidor).
 */
export function verifyEd25519Signature(
  publicKeyBase64: string,
  message: string | Uint8Array,
  signatureBase64: string,
): boolean {
  try {
    const pubKey = fromBase64(publicKeyBase64);
    const msg = typeof message === 'string' ? utf8(message) : message;
    const sig = fromBase64(signatureBase64);
    return verifySignature(pubKey, msg, sig);
  } catch {
    return false;
  }
}
