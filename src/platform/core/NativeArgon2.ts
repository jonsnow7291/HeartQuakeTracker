import { NativeModules } from 'react-native';

export interface Argon2Cost {
  t: number;
  m: number;
  p: number;
}

const toBytes = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/**
 * Argon2id nativo (argon2kt en Android). Mismo algoritmo (RFC 9106, v1.3) y mismos
 * parámetros que la versión en JavaScript, por lo que da exactamente la misma clave y las cuentas ya creadas
 * siguen abriendo. Corre en un hilo nativo: no congela la interfaz mientras se verifica el PIN.
 */
export async function argon2idNative(pin: string, salt: Uint8Array, cost: Argon2Cost): Promise<Uint8Array> {
  const mod = NativeModules.RNArgon2 || NativeModules.Argon2Module;
  if (!mod || typeof mod.argon2 !== 'function') {
    throw new Error('Módulo nativo Argon2 no disponible');
  }
  const result = await mod.argon2(pin, toHex(salt), {
    iterations: cost.t,
    memory: cost.m,
    parallelism: cost.p,
    hashLength: 32,
    mode: 'argon2id',
    saltEncoding: 'hex',
  });
  const rawHash = result?.rawHash;
  if (!rawHash || typeof rawHash !== 'string') {
    throw new Error('Argon2 nativo no retornó rawHash válido');
  }
  const out = toBytes(rawHash);
  if (out.length !== 32) throw new Error('Argon2 nativo devolvió una longitud inesperada');
  return out;
}
