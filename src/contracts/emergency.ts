import { Unsubscribe, ISODate, Severity, GeoPoint } from './types';
import { PermissionKind } from './permissions';

export type EmergencyPhase = 'IDLE' | 'CONFIRMING' | 'ACTIVE' | 'STOPPED';

export interface EmergencyState {
  phase: EmergencyPhase;
  severity?: Severity;
  startedAt?: ISODate;
  cancelDeadline?: ISODate; // en CONFIRMING: hasta cuándo se puede cancelar (3 s)
  lowPower: boolean; // SOS prolongado (<20 % batería)
  beaconActive: boolean;
  meshActive: boolean;
  medicalCardArmed: boolean;
  lastPosition?: GeoPoint;
}

export interface EmergencyService {
  getState(): EmergencyState;
  subscribe(cb: (s: EmergencyState) => void): Unsubscribe;
  requestPanic(): Promise<{ missing: PermissionKind[] }>; // IDLE→(permisos); si faltan, no avanza
  selectSeverity(s: Severity): Promise<void>; // →CONFIRMING (3 s) → ACTIVE
  cancel(): Promise<void>; // solo en CONFIRMING
  stop(): Promise<void>; // ACTIVE → STOPPED → IDLE
  markSafe(): Promise<void>; // "Estoy a salvo" (encola reporte)
}
