import { MedicalProfileService, MedicalProfile } from '../../contracts/medical';
import { MockSessionService } from './mockSession';

export class MockMedicalProfileService implements MedicalProfileService {
  private sessionService: MockSessionService;
  private profile: MedicalProfile | null = {
    bloodType: 'O+',
    allergies: ['Penicilina'],
    conditions: ['Hipertensión leve'],
    medications: ['Losartán 50mg'],
    contacts: [
      { name: 'Maria Gonzalez', phone: '+57 310 1234567', relation: 'Hermana' },
      { name: 'Carlos Gonzalez', phone: '+57 320 7654321', relation: 'Padre' },
    ],
    notes: 'Usa lentes de contacto.',
    updatedAt: new Date().toISOString(),
  };

  constructor(sessionService: MockSessionService) {
    this.sessionService = sessionService;
  }

  public async exists(): Promise<boolean> {
    return this.profile !== null;
  }

  public async get(): Promise<MedicalProfile | null> {
    if (!this.sessionService.isUnlocked()) {
      const err = new Error('Desbloqueo requerido para acceder a la ficha médica');
      (err as any).code = 'AUTH_REQUIRED';
      throw err;
    }
    return this.profile ? { ...this.profile } : null;
  }

  public async save(p: Omit<MedicalProfile, 'updatedAt'>): Promise<void> {
    if (!this.sessionService.isUnlocked()) {
      const err = new Error('Desbloqueo requerido');
      (err as any).code = 'AUTH_REQUIRED';
      throw err;
    }
    if (!p.bloodType || !p.contacts || p.contacts.length === 0) {
      const err = new Error('Faltan campos obligatorios');
      (err as any).code = 'VALIDATION';
      throw err;
    }

    this.profile = {
      ...p,
      updatedAt: new Date().toISOString(),
    };
  }

  public async remove(): Promise<void> {
    this.profile = null;
  }

  public requiredFields(): (keyof MedicalProfile)[] {
    return ['bloodType', 'allergies', 'conditions', 'contacts'];
  }
}
