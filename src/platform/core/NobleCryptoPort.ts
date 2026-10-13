import { gcm } from '@noble/ciphers/aes.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { argon2id } from '@noble/hashes/argon2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { AppException } from '../../contracts/types';
import type { CryptoPort } from '../../core/platform/ports';

export type CipherAlgorithm = 'aes-256-gcm' | 'xchacha20-poly1305';

export type NativeArgon2 = (pin: string, salt: Uint8Array, cost: { t: number; m: number; p: number }) => Promise<Uint8Array>;

export interface NobleCryptoOptions {
  /** Implementación nativa de Argon2id (más rápida y fuera del hilo de JS). Si falla, se usa la de JavaScript. */
  nativeArgon2?: NativeArgon2;
  /** Algoritmo simétrico por defecto para encrypt/decrypt (por defecto 'aes-256-gcm'). */
  defaultCipher?: CipherAlgorithm;
  /** Parámetros de costo de Argon2id (opcional). */
  argon2Cost?: {
    t?: number;
    m?: number;
    p?: number;
  };
}

/**
 * Adaptador CryptoPort basado en librerías noble auditadas (@noble/hashes y @noble/ciphers).
 * Implementa KDF de PIN mediante Argon2id (ADR 0001, ADR 0005) y cifrado autenticado AES-256-GCM / XChaCha.
 */
export class NobleCryptoPort implements CryptoPort {
  private readonly defaultCipher: CipherAlgorithm;
  private readonly argon2Cost: { t: number; m: number; p: number };
  private readonly nativeArgon2?: NativeArgon2;

  constructor(options: NobleCryptoOptions = {}) {
    this.defaultCipher = options.defaultCipher ?? 'aes-256-gcm';
    this.nativeArgon2 = options.nativeArgon2;
    this.argon2Cost = {
      t: options.argon2Cost?.t ?? 2,
      m: options.argon2Cost?.m ?? 16384, // 16 MiB memoria en dispositivo móvil
      p: options.argon2Cost?.p ?? 1,
    };
  }

  randomBytes(n: number): Uint8Array {
    return randomBytes(n);
  }

  async sha256Hex(data: Uint8Array): Promise<string> {
    const hash = sha256(data);
    let hex = '';
    for (let i = 0; i < hash.length; i++) {
      const b = hash[i]!;
      hex += (b < 16 ? '0' : '') + b.toString(16);
    }
    return hex;
  }

  /**
   * KDF de PIN a clave maestra de datos de 32 bytes usando Argon2id.
   */
  async deriveKey(pin: string, salt: Uint8Array): Promise<Uint8Array> {
    if (this.nativeArgon2) {
      try {
        return await this.nativeArgon2(pin, salt, this.argon2Cost);
      } catch (err) {
        // Mismo resultado, solo más lento: la ruta de JavaScript queda como respaldo.
        console.warn('[Crypto] Argon2 nativo no disponible, se usa la versión en JavaScript:', err);
      }
    }
    try {
      return argon2id(pin, salt, {
        t: this.argon2Cost.t,
        m: this.argon2Cost.m,
        p: this.argon2Cost.p,
        dkLen: 32,
      });
    } catch (err) {
      throw new AppException('AUTH_FAILED', `Fallo al derivar clave con Argon2id: ${String(err)}`);
    }
  }

  /**
   * Cifra un payload con AES-256-GCM (o XChaCha según configuración).
   * Formato sellado: [12 B nonce] + [ciphertext] + [16 B tag]
   */
  async encrypt(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    if (this.defaultCipher === 'xchacha20-poly1305') {
      return this.encryptXChaCha(plaintext, key);
    }
    return this.encryptAesGcm(plaintext, key);
  }

  /**
   * Descifra un payload sellado con AES-256-GCM (o XChaCha según configuración).
   */
  async decrypt(sealed: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    if (this.defaultCipher === 'xchacha20-poly1305') {
      return this.decryptXChaCha(sealed, key);
    }
    return this.decryptAesGcm(sealed, key);
  }

  /** Cifrado AES-256-GCM con nonce aleatorio de 12 bytes. */
  async encryptAesGcm(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    const nonce = this.randomBytes(12);
    const cipher = gcm(key, nonce);
    const sealed = cipher.encrypt(plaintext);
    const out = new Uint8Array(nonce.length + sealed.length);
    out.set(nonce, 0);
    out.set(sealed, nonce.length);
    return out;
  }

  /** Descifrado AES-256-GCM. */
  async decryptAesGcm(sealed: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    if (sealed.length < 12 + 16) {
      throw new AppException('AUTH_FAILED', 'Carga cifrada demasiado corta');
    }
    const nonce = sealed.subarray(0, 12);
    const ciphertextWithTag = sealed.subarray(12);
    const cipher = gcm(key, nonce);
    try {
      return cipher.decrypt(ciphertextWithTag);
    } catch {
      throw new AppException('AUTH_FAILED', 'Autenticación AES-GCM fallida: clave errónea o datos alterados');
    }
  }

  /** Cifrado XChaCha20-Poly1305 con nonce aleatorio de 24 bytes (D-17, ADR 0005). */
  async encryptXChaCha(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    const nonce = this.randomBytes(24);
    const cipher = xchacha20poly1305(key, nonce);
    const sealed = cipher.encrypt(plaintext);
    const out = new Uint8Array(nonce.length + sealed.length);
    out.set(nonce, 0);
    out.set(sealed, nonce.length);
    return out;
  }

  /** Descifrado XChaCha20-Poly1305. */
  async decryptXChaCha(sealed: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
    if (sealed.length < 24 + 16) {
      throw new AppException('AUTH_FAILED', 'Carga cifrada XChaCha demasiado corta');
    }
    const nonce = sealed.subarray(0, 24);
    const ciphertextWithTag = sealed.subarray(24);
    const cipher = xchacha20poly1305(key, nonce);
    try {
      return cipher.decrypt(ciphertextWithTag);
    } catch {
      throw new AppException('AUTH_FAILED', 'Autenticación XChaCha fallida: clave errónea o datos alterados');
    }
  }
}
