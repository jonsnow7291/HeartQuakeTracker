import { Platform } from 'react-native';
import {
  check,
  request,
  checkNotifications,
  requestNotifications,
  openSettings as rnpOpenSettings,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import {
  PermissionKind,
  PermissionStatus,
  PermissionsService,
} from '../../contracts/permissions';

/**
 * Adaptador real de PermissionsService sobre react-native-permissions (RF-05, RNF-05).
 * Maneja los permisos en tiempo de ejecución tanto en Android 10-15 como en iOS 15+.
 */
export class PermissionsServiceImpl implements PermissionsService {
  public async status(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind === 'notifications') {
      try {
        const { status } = await checkNotifications();
        return this.mapStatus(status);
      } catch {
        return 'undetermined';
      }
    }

    if (kind === 'bluetooth' && Platform.OS === 'android') {
      return this.checkAndroidBluetooth();
    }

    const permission = this.resolvePermission(kind);
    if (!permission) {
      return 'granted'; // Permiso no aplicable a esta plataforma
    }

    try {
      const res = await check(permission);
      return this.mapStatus(res);
    } catch {
      return 'undetermined';
    }
  }

  public async request(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind === 'notifications') {
      try {
        const { status } = await requestNotifications(['alert', 'sound', 'badge']);
        return this.mapStatus(status);
      } catch {
        return 'denied';
      }
    }

    if (kind === 'bluetooth' && Platform.OS === 'android') {
      return this.requestAndroidBluetooth();
    }

    const permission = this.resolvePermission(kind);
    if (!permission) {
      return 'granted';
    }

    try {
      const res = await request(permission);
      return this.mapStatus(res);
    } catch {
      return 'denied';
    }
  }

  /**
   * Identifica los permisos críticos faltantes para activar la baliza de socorro y ubicación (RF-05 A2).
   * Requiere bluetooth y ubicación para la red mallada y baliza BLE.
   */
  public async missingForEmergency(): Promise<PermissionKind[]> {
    const missing: PermissionKind[] = [];

    const bStatus = await this.status('bluetooth');
    if (bStatus !== 'granted') {
      missing.push('bluetooth');
    }

    const lStatus = await this.status('location');
    if (lStatus !== 'granted') {
      missing.push('location');
    }

    return missing;
  }

  public async openSettings(): Promise<void> {
    try {
      await rnpOpenSettings();
    } catch (err) {
      console.warn('[PermissionsService] Error al abrir configuración del sistema:', err);
    }
  }

  private resolvePermission(kind: PermissionKind): Permission | null {
    if (Platform.OS === 'android') {
      switch (kind) {
        case 'location':
          return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        case 'camera_flash':
          return PERMISSIONS.ANDROID.CAMERA;
        case 'motion':
          return PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION;
        case 'background_location':
          return PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
        default:
          return null;
      }
    } else if (Platform.OS === 'ios') {
      switch (kind) {
        case 'location':
          return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        case 'bluetooth':
          return PERMISSIONS.IOS.BLUETOOTH;
        case 'camera_flash':
          return PERMISSIONS.IOS.CAMERA;
        case 'motion':
          return PERMISSIONS.IOS.MOTION;
        case 'background_location':
          return PERMISSIONS.IOS.LOCATION_ALWAYS;
        default:
          return null;
      }
    }
    return null;
  }

  private async checkAndroidBluetooth(): Promise<PermissionStatus> {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(`${Platform.Version}`, 10);
    // En Android 12+ (API 31+), se requieren permisos específicos de BLE
    if (apiLevel >= 31) {
      try {
        const scan = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const adv = await check(PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE);
        const conn = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);

        if (scan === RESULTS.GRANTED && adv === RESULTS.GRANTED && conn === RESULTS.GRANTED) {
          return 'granted';
        }
        if (scan === RESULTS.BLOCKED || adv === RESULTS.BLOCKED || conn === RESULTS.BLOCKED) {
          return 'blocked';
        }
        return 'denied';
      } catch {
        return 'undetermined';
      }
    }

    // Android <= 11: Bluetooth depende del permiso de ubicación
    try {
      const loc = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      return this.mapStatus(loc);
    } catch {
      return 'undetermined';
    }
  }

  private async requestAndroidBluetooth(): Promise<PermissionStatus> {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(`${Platform.Version}`, 10);
    if (apiLevel >= 31) {
      try {
        const scan = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const adv = await request(PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE);
        const conn = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);

        if (scan === RESULTS.GRANTED && adv === RESULTS.GRANTED && conn === RESULTS.GRANTED) {
          return 'granted';
        }
        if (scan === RESULTS.BLOCKED || adv === RESULTS.BLOCKED || conn === RESULTS.BLOCKED) {
          return 'blocked';
        }
        return 'denied';
      } catch {
        return 'denied';
      }
    }

    try {
      const loc = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      return this.mapStatus(loc);
    } catch {
      return 'denied';
    }
  }

  private mapStatus(status: string): PermissionStatus {
    switch (status) {
      case RESULTS.GRANTED:
      case RESULTS.LIMITED:
        return 'granted';
      case RESULTS.BLOCKED:
      case RESULTS.UNAVAILABLE:
        return 'blocked';
      case RESULTS.DENIED:
        return 'denied';
      default:
        return 'undetermined';
    }
  }
}
