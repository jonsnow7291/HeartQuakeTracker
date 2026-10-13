import { randomBytes } from '@noble/hashes/utils.js';
import { KeychainSecureStore } from './KeychainSecureStore';

const KEY_NAME = 'db.master.key';
let cached: Promise<string> | null = null;

/**
 * Clave maestra de SQLCipher (RNF-04, ADR 0002): 256 bits aleatorios generados en el primer arranque y
 * guardados en Keystore (Android) / Keychain (iOS). Nunca sale del dispositivo ni se deriva del PIN, así
 * las bases abren sin sesión (el pánico no exige desbloqueo) y la ficha médica va además cifrada por campo.
 */
export function getDatabaseKey(store: KeychainSecureStore = new KeychainSecureStore()): Promise<string> {
  if (!cached) {
    cached = (async () => {
      const existing = await store.get(KEY_NAME);
      if (existing) return existing;
      const bytes = randomBytes(32);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) hex += (bytes[i]! < 16 ? '0' : '') + bytes[i]!.toString(16);
      await store.set(KEY_NAME, hex);
      return hex;
    })().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
