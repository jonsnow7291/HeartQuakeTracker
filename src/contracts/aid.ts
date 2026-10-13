import { ISODate } from './types';

export interface AidChannel {
  type: 'WEB' | 'TEL' | 'CUENTA' | 'EMAIL';
  value: string;
  requirements?: string;
  active: boolean;
}

export interface AidEntity {
  id: string;
  name: string;
  kind: 'GOBIERNO' | 'ONG' | 'SOCORRO';
  description?: string;
  active: boolean;
  /** Fecha de la última revisión del registro (no implica que esté verificado). */
  verifiedAt: ISODate;
  /** true solo si un organismo oficial confirmó el registro. Si es false, la interfaz lo presenta como dato de referencia. */
  verified: boolean;
  channels: AidChannel[];
}

export interface AidNeed {
  id: string;
  category: string;
  label: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface AidDirectoryService {
  listEntities(): Promise<AidEntity[]>;
  listNeeds(): Promise<AidNeed[]>;
}
