import { AppException } from '../../contracts/types';
import type { SessionService, SessionUser } from '../../contracts/session';
import type { BiometricPort, Clock, CryptoPort, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';
import { concat, fromBase64, toBase64, utf8 } from '../util/bytes';
import { Emitter } from '../util/emitter';

const ACCOUNT_KEY = 'session.account';
const ATTEMPTS_KEY = 'session.attempts';
const BIO_KEY = 'session.bioKey';
const VERIFIER_TAG = utf8('eqt-verifier-v1');

/** Intentos fallidos permitidos antes del primer bloqueo; luego 30 s × 2^n, máximo 1 h. */
export const FREE_ATTEMPTS = 5;
const BASE_LOCK_MS = 30_000;
const MAX_LOCK_MS = 3_600_000;

interface AccountRecord {
  id: string;
  displayName: string;
  email?: string;
  salt: string; // base64
  verifier: string; // sha256Hex(dataKey || tag): no permite recuperar la clave
  createdAt: string;
}

interface AttemptsRecord {
  count: number;
  lockedUntil: number;
}

export interface SessionDeps {
  /** Almacén seguro (Keychain/Keystore). Guarda cuenta, intentos y la clave protegida por biometría. */
  secureStore: KeyValueStore;
  crypto: CryptoPort;
  biometric?: BiometricPort;
  clock?: Clock;
  /** Bloqueo automático tras inactividad (ms). 0/undefined = desactivado. */
  autoLockMs?: number;
}

/**
 * SessionService real (ADR 0001).
 * - Cuenta local: nombre + PIN de 6 dígitos (+ biometría opcional).
 * - dataKey = KDF(PIN, salt). **Nunca se guarda** salvo bajo protección biométrica del SO.
 * - El pánico NO depende de esta sesión; solo la ficha médica y el progreso usan `getDataKey()`.
 */
export class SessionServiceImpl implements SessionService {
  private readonly clock: Clock;
  private readonly emitter = new Emitter<boolean>();
  private dataKey: Uint8Array | null = null;
  private lockTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly deps: SessionDeps) {
    this.clock = deps.clock ?? systemClock;
  }

  isUnlocked(): boolean {
    return this.dataKey !== null;
  }

  async hasAccount(): Promise<boolean> {
    return (await this.deps.secureStore.get(ACCOUNT_KEY)) !== null;
  }

  async createLocalAccount(input: { displayName: string; email?: string; pin: string; acceptTerms: true }): Promise<void> {
    if (input.acceptTerms !== true) throw new AppException('VALIDATION', 'Debes aceptar los términos y el tratamiento de datos');
    if (!/^\d{6}$/.test(input.pin)) throw new AppException('VALIDATION', 'El PIN debe tener exactamente 6 dígitos');
    if (!input.displayName.trim()) throw new AppException('VALIDATION', 'El nombre es obligatorio');
    if (input.email && !/^\S+@\S+\.\S+$/.test(input.email)) throw new AppException('VALIDATION', 'Correo no válido');
    if (await this.hasAccount()) throw new AppException('VALIDATION', 'Ya existe una cuenta en este dispositivo', false);

    const salt = this.deps.crypto.randomBytes(16);
    const key = await this.deps.crypto.deriveKey(input.pin, salt);
    const record: AccountRecord = {
      id: 'usr_' + toBase64(this.deps.crypto.randomBytes(9)).replace(/[^A-Za-z0-9]/g, 'x'),
      displayName: input.displayName.trim(),
      email: input.email?.trim() || undefined,
      salt: toBase64(salt),
      verifier: await this.verifierOf(key),
      createdAt: new Date(this.clock.now()).toISOString(),
    };
    await this.write(ACCOUNT_KEY, JSON.stringify(record));
    await this.deps.secureStore.delete(ATTEMPTS_KEY);
    this.setKey(key);
  }

  async unlock(method: { pin: string } | { biometric: true }): Promise<void> {
    const account = await this.readAccount();
    if (!account) throw new AppException('AUTH_REQUIRED', 'No hay cuenta en este dispositivo');
    if ('biometric' in method) return this.unlockWithBiometric();

    await this.assertNotLocked();
    const key = await this.deps.crypto.deriveKey(method.pin, fromBase64(account.salt));
    if ((await this.verifierOf(key)) !== account.verifier) {
      await this.registerFailure();
      throw new AppException('AUTH_FAILED', 'PIN incorrecto');
    }
    await this.deps.secureStore.delete(ATTEMPTS_KEY);
    this.setKey(key);
  }

  lock(): void {
    this.clearTimer();
    if (this.dataKey) {
      this.dataKey.fill(0); // borra la clave de memoria
      this.dataKey = null;
    }
    this.emitter.emit(false);
  }

  subscribe(cb: (unlocked: boolean) => void) {
    return this.emitter.subscribe(cb);
  }

  async getUser(): Promise<SessionUser> {
    const a = await this.readAccount();
    if (!a) throw new AppException('AUTH_REQUIRED', 'No hay cuenta en este dispositivo');
    return { id: a.id, displayName: a.displayName, email: a.email };
  }

  // ---- API interna (no forma parte del contrato; la usan MedicalProfileService y similares) ----

  /** Clave de datos para SQLCipher/cifrado de campos. AUTH_REQUIRED si la sesión está bloqueada. */
  getDataKey(): Uint8Array {
    if (!this.dataKey) throw new AppException('AUTH_REQUIRED', 'Sesión bloqueada');
    this.touch();
    return this.dataKey;
  }

  /** Reinicia el temporizador de bloqueo automático (llamar en actividad del usuario). */
  touch(): void {
    if (!this.deps.autoLockMs || !this.dataKey) return;
    this.clearTimer();
    this.lockTimer = setTimeout(() => this.lock(), this.deps.autoLockMs);
  }

  /** Activa el desbloqueo biométrico: guarda la clave en el almacén seguro protegido por el SO. */
  async enableBiometric(): Promise<void> {
    if (!this.dataKey) throw new AppException('AUTH_REQUIRED', 'Desbloquea primero con tu PIN');
    const bio = this.deps.biometric;
    if (!bio || !(await bio.isAvailable())) throw new AppException('VALIDATION', 'Biometría no disponible en este dispositivo', false);
    if (!(await bio.authenticate('Activar desbloqueo biométrico'))) throw new AppException('AUTH_FAILED', 'Autenticación biométrica cancelada');
    await this.write(BIO_KEY, toBase64(this.dataKey));
  }

  async disableBiometric(): Promise<void> {
    await this.deps.secureStore.delete(BIO_KEY);
  }

  async isBiometricEnabled(): Promise<boolean> {
    return (await this.deps.secureStore.get(BIO_KEY)) !== null;
  }

  /** Borra la cuenta y todo rastro de claves (derecho de supresión, Ley 1581). */
  async deleteAccount(): Promise<void> {
    this.lock();
    for (const k of [ACCOUNT_KEY, ATTEMPTS_KEY, BIO_KEY]) await this.deps.secureStore.delete(k);
  }

  // ---- internos ----

  private async unlockWithBiometric(): Promise<void> {
    const bio = this.deps.biometric;
    const stored = await this.deps.secureStore.get(BIO_KEY);
    if (!bio || !stored || !(await bio.isAvailable())) throw new AppException('AUTH_FAILED', 'Biometría no activada; usa tu PIN');
    if (!(await bio.authenticate('Desbloquear EarthQuakeTracker'))) throw new AppException('AUTH_FAILED', 'Biometría no reconocida');
    this.setKey(fromBase64(stored));
  }

  private setKey(key: Uint8Array): void {
    this.dataKey = key;
    this.touch();
    this.emitter.emit(true);
  }

  private clearTimer(): void {
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = undefined;
  }

  private async verifierOf(key: Uint8Array): Promise<string> {
    return this.deps.crypto.sha256Hex(concat(key, VERIFIER_TAG));
  }

  private async readAccount(): Promise<AccountRecord | null> {
    const raw = await this.deps.secureStore.get(ACCOUNT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AccountRecord;
    } catch {
      throw new AppException('STORAGE_FAILED', 'Registro de cuenta dañado', false);
    }
  }

  private async write(key: string, value: string): Promise<void> {
    try {
      await this.deps.secureStore.set(key, value);
    } catch {
      throw new AppException('STORAGE_FAILED', 'No se pudo guardar en el almacén seguro');
    }
  }

  private async attempts(): Promise<AttemptsRecord> {
    const raw = await this.deps.secureStore.get(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptsRecord) : { count: 0, lockedUntil: 0 };
  }

  private async assertNotLocked(): Promise<void> {
    const a = await this.attempts();
    const wait = a.lockedUntil - this.clock.now();
    if (wait > 0) {
      throw new AppException('AUTH_FAILED', `Demasiados intentos. Espera ${Math.ceil(wait / 1000)} s`, true);
    }
  }

  private async registerFailure(): Promise<void> {
    const a = await this.attempts();
    const count = a.count + 1;
    const over = count - FREE_ATTEMPTS;
    const lockedUntil = over >= 0 ? this.clock.now() + Math.min(BASE_LOCK_MS * 2 ** over, MAX_LOCK_MS) : 0;
    await this.write(ATTEMPTS_KEY, JSON.stringify({ count, lockedUntil } satisfies AttemptsRecord));
  }
}
