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
  verifiedAt: ISODate;
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
