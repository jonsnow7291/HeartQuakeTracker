import { ed25519 } from '@noble/curves/ed25519.js';
import { hmacSha256 } from './sha256';

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Convierte un Uint8Array a cadena hexadecimal.
 */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += b.toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Convierte una cadena hexadecimal a Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  const len = Math.floor(clean.length / 2);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

/**
 * Genera el ID efímero de 6 bytes (12 chars hex) rotativo cada 15 min (ADR 0005, D-17).
 * idEph = truncate(HMAC-SHA256(secretoLocal, floor(t / 15min)), 6 bytes).
 */
export function generateEphemeralId(localSecret: Uint8Array, epochSeconds: number): string {
  const windowIndex = Math.floor(epochSeconds / (15 * 60));
  // Codificar windowIndex como Big-Endian de 8 bytes
  const windowBytes = new Uint8Array(8);
  const hi = Math.floor(windowIndex / 0x100000000);
  const lo = windowIndex >>> 0;
  windowBytes[0] = (hi >> 24) & 0xff;
  windowBytes[1] = (hi >> 16) & 0xff;
  windowBytes[2] = (hi >> 8) & 0xff;
  windowBytes[3] = hi & 0xff;
  windowBytes[4] = (lo >> 24) & 0xff;
  windowBytes[5] = (lo >> 16) & 0xff;
  windowBytes[6] = (lo >> 8) & 0xff;
  windowBytes[7] = lo & 0xff;

  const mac = hmacSha256(localSecret, windowBytes);
  return toHex(mac.subarray(0, 6));
}

/**
 * Genera un par de claves Ed25519 para identidad de nodo en la malla.
 * Usa @noble/curves en Node y en Hermes por igual, así los tests ejercitan el mismo código que el teléfono.
 * (Antes, fuera de Node se usaba un sucedáneo: clave pública = privada XOR 0xAA y verificación que aceptaba
 * cualquier firma de 64 bytes; esto anulaba el anti-suplantación y la autenticación de dispositivo.)
 */
export function generateIdentityKeyPair(): KeyPair {
  const privateKey = ed25519.utils.randomSecretKey();
  return { publicKey: ed25519.getPublicKey(privateKey), privateKey };
}

/**
 * Firma un buffer con la clave privada Ed25519 (semilla de 32 bytes).
 */
export function signBytes(privateKey: Uint8Array, data: Uint8Array): Uint8Array {
  return ed25519.sign(data, privateKey);
}

/**
 * Verifica una firma Ed25519. Devuelve false ante cualquier entrada inválida.
 */
export function verifySignature(publicKey: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean {
  try {
    return ed25519.verify(signature, data, publicKey);
  } catch {
    return false;
  }
}
