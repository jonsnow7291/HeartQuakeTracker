import { ISODate } from './types';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface MedicalProfile {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  conditions: string[];
  medications?: string[];
  contacts: EmergencyContact[];
  notes?: string;
  updatedAt: ISODate;
}

export interface MedicalProfileService {
  exists(): Promise<boolean>;
  get(): Promise<MedicalProfile | null>; // requiere sesión desbloqueada
  save(p: Omit<MedicalProfile, 'updatedAt'>): Promise<void>; // VALIDATION si faltan obligatorios
  remove(): Promise<void>;
  requiredFields(): (keyof MedicalProfile)[];
}
