/**
 * Puertos de plataforma. La lógica de `src/core` solo habla con estas interfaces;
 * en el celular se enlazan a Keychain/Keystore, SQLCipher, sistema de archivos, libsodium y HTTP.
 * En tests se usan implementaciones en memoria / Node (ver __tests__/core/support).
 */

/** Almacén clave-valor. El adaptador seguro (Keychain/Keystore) y el cifrado (SQLCipher) implementan esto. */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Claves que empiezan por `prefix`. */
  keys(prefix: string): Promise<string[]>;
}

/** Sistema de archivos privado de la app. */
export interface FileStore {
  read(path: string): Promise<Uint8Array | null>;
  write(path: string, data: Uint8Array): Promise<void>;
  /** Borra el archivo o, si es carpeta, todo lo que cuelgue de `path`. */
  remove(path: string): Promise<void>;
  /** Rutas de archivos que empiezan por `prefix`. */
  list(prefix: string): Promise<string[]>;
}

export interface CryptoPort {
  randomBytes(n: number): Uint8Array;
  sha256Hex(data: Uint8Array): Promise<string>;
  /** KDF del PIN → clave de datos de 32 bytes (Argon2id en dispositivo, ADR 0001/0005). */
  deriveKey(pin: string, salt: Uint8Array): Promise<Uint8Array>;
}

export interface BiometricPort {
  isAvailable(): Promise<boolean>;
  /** true si el usuario se autenticó. */
  authenticate(reason: string): Promise<boolean>;
}

export interface Clock {
  now(): number;
}
export const systemClock: Clock = { now: () => Date.now() };

// ---- Contenido (RF-01) ----
export interface ContentManifest {
  version: string;
  generatedAt: string;
  files: { path: string; sha256: string; bytes: number }[];
}

export interface PackageData {
  manifest: ContentManifest;
  files: { path: string; data: Uint8Array }[];
}

/** Acceso al servidor (GET /v1/content/manifest y /v1/content/package/:version). Lanza si no hay red. */
export interface ContentRemote {
  fetchManifest(): Promise<ContentManifest | null>;
  fetchPackage(version: string): Promise<PackageData>;
}

/** Contenido empaquetado dentro de la app (primer arranque sin red). */
export interface BundledContent {
  load(): Promise<PackageData | null>;
}
