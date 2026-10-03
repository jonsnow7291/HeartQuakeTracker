export type PermissionKind =
  | 'location'
  | 'bluetooth'
  | 'notifications'
  | 'motion'
  | 'camera_flash'
  | 'background_location';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';

export interface PermissionsService {
  status(kind: PermissionKind): Promise<PermissionStatus>;
  request(kind: PermissionKind): Promise<PermissionStatus>;
  missingForEmergency(): Promise<PermissionKind[]>; // lo que falta para pánico+baliza
  openSettings(): Promise<void>;
}
