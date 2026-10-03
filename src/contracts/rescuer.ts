import { Unsubscribe, ISODate, Severity, GeoPoint } from './types';
import { MedicalProfile } from './medical';

export interface ReceivedMedicalCard {
  fromIdEphemeral: string;
  severity: Severity;
  receivedAt: ISODate;
  position?: GeoPoint;
  profile: Partial<MedicalProfile>;
  incomplete: boolean;
  signatureValid: boolean;
}

export interface RescuerService {
  isRescuerModeAvailable(): boolean;
  enable(credential: { code: string }): Promise<void>; // RECEIVER_NOT_AUTHORIZED
  disable(): void;
  subscribeReceived(cb: (c: ReceivedMedicalCard) => void): Unsubscribe;
  listReceived(): Promise<ReceivedMedicalCard[]>;
}
