import { AppException } from '../../contracts/types';
import type { EmergencyContact, MedicalProfile, MedicalProfileService } from '../../contracts/medical';
import type { Clock, CryptoPort, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';
import type { SessionServiceImpl } from '../session/SessionServiceImpl';
import { fromBase64, fromUtf8, toBase64, utf8 as toUtf8 } from '../util/bytes';

const PROFILE_KEY = 'medical.profile.v1';
const VALID_BLOOD_TYPES = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

export interface MedicalDeps {
  store: KeyValueStore;
  session: Pick<SessionServiceImpl, 'isUnlocked' | 'getDataKey'>;
  crypto: CryptoPort;
  clock?: Clock;
}

/**
 * MedicalProfileService real (RF-04, RNF-04).
 * - Cifrado en reposo con clave derivada de la sesión (AES-256-GCM / XChaCha).
 * - Requiere sesión desbloqueada para lectura y guardado.
 * - Una sola ficha médica por usuario en el dispositivo.
 */
export class MedicalProfileServiceImpl implements MedicalProfileService {
  private readonly clock: Clock;

  constructor(private readonly deps: MedicalDeps) {
    this.clock = deps.clock ?? systemClock;
  }

  async exists(): Promise<boolean> {
    const raw = await this.deps.store.get(PROFILE_KEY);
    return raw !== null;
  }

  async get(): Promise<MedicalProfile | null> {
    this.assertUnlocked('Desbloqueo requerido para acceder a la ficha médica');
    const raw = await this.deps.store.get(PROFILE_KEY);
    if (!raw) return null;

    const dataKey = this.deps.session.getDataKey();
    const sealed = fromBase64(raw);

    if (!this.deps.crypto.decrypt) {
      throw new AppException('STORAGE_FAILED', 'Descifrado no disponible en la plataforma');
    }

    let plaintextBytes: Uint8Array;
    try {
      plaintextBytes = await this.deps.crypto.decrypt(sealed, dataKey);
    } catch {
      throw new AppException('AUTH_FAILED', 'No se pudo descifrar la ficha médica. Clave incorrecta o datos dañados');
    }

    try {
      return JSON.parse(fromUtf8(plaintextBytes)) as MedicalProfile;
    } catch {
      throw new AppException('STORAGE_FAILED', 'Ficha médica corrupta en el almacenamiento', false);
    }
  }

  async save(p: Omit<MedicalProfile, 'updatedAt'>): Promise<void> {
    this.assertUnlocked('Desbloqueo requerido para guardar la ficha médica');
    this.validate(p);

    const dataKey = this.deps.session.getDataKey();
    if (!this.deps.crypto.encrypt) {
      throw new AppException('STORAGE_FAILED', 'Cifrado no disponible en la plataforma');
    }

    const updatedAt = new Date(this.clock.now()).toISOString();
    const fullProfile: MedicalProfile = {
      ...p,
      updatedAt,
    };

    const plaintextBytes = toUtf8(JSON.stringify(fullProfile));
    const sealed = await this.deps.crypto.encrypt(plaintextBytes, dataKey);
    await this.deps.store.set(PROFILE_KEY, toBase64(sealed));
  }

  async remove(): Promise<void> {
    await this.deps.store.delete(PROFILE_KEY);
  }

  requiredFields(): (keyof MedicalProfile)[] {
    return ['bloodType', 'allergies', 'conditions', 'contacts'];
  }

  private assertUnlocked(message: string): void {
    if (!this.deps.session.isUnlocked()) {
      throw new AppException('AUTH_REQUIRED', message);
    }
  }

  private validate(p: Omit<MedicalProfile, 'updatedAt'>): void {
    if (!p.bloodType || !VALID_BLOOD_TYPES.has(p.bloodType)) {
      throw new AppException('VALIDATION', 'Tipo de sangre inválido o no especificado');
    }

    if (!Array.isArray(p.allergies)) {
      throw new AppException('VALIDATION', 'El campo de alergias debe ser una lista');
    }

    if (!Array.isArray(p.conditions)) {
      throw new AppException('VALIDATION', 'El campo de condiciones debe ser una lista');
    }

    if (!Array.isArray(p.contacts) || p.contacts.length === 0) {
      throw new AppException('VALIDATION', 'Se requiere al menos un contacto de emergencia');
    }

    for (const contact of p.contacts) {
      this.validateContact(contact);
    }
  }

  private validateContact(contact: EmergencyContact): void {
    if (!contact || typeof contact !== 'object') {
      throw new AppException('VALIDATION', 'Contacto de emergencia inválido');
    }
    if (!contact.name || !contact.name.trim()) {
      throw new AppException('VALIDATION', 'El nombre del contacto de emergencia es obligatorio');
    }
    if (!contact.phone || !contact.phone.trim()) {
      throw new AppException('VALIDATION', 'El teléfono del contacto de emergencia es obligatorio');
    }
  }
}
