import type { Services } from '../../contracts/container';
import { EmergencyServiceImpl } from '../../core/emergency/EmergencyServiceImpl';
import { GeolocationPort } from './GeolocationPort';
import { NativeForegroundServicePort } from './NativeForegroundServicePort';
import { NativeSignalingPort } from './NativeSignalingPort';
import { PermissionsServiceImpl } from './PermissionsServiceImpl';
import { PowerServiceImpl } from './PowerServiceImpl';

/**
 * Registra los servicios reales del paquete P2 (Emergencia y Señalización):
 * - PermissionsService (sobre react-native-permissions)
 * - PowerService (batería y estado de carga nativos)
 * - EmergencyService (orquestación completa de pánico, baliza, señalización física y ficha médica)
 */
/**
 * Referencia perezosa a un servicio del container. El registrar de emergencia corre antes que el de malla
 * (la malla se suscribe a la emergencia) y, aun así, debe hablar con los servicios REALES: si capturara
 * `current.mesh` / `current.reports` en este instante recibiría los mocks. `current` se muta en sitio.
 */
function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_t, key) {
      const target = get() as Record<PropertyKey, unknown>;
      const value = target[key];
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  });
}

export async function registerEmergency(current: Services): Promise<Partial<Services>> {
  const permissions = new PermissionsServiceImpl();
  const power = new PowerServiceImpl();
  const signaling = new NativeSignalingPort();
  const foreground = new NativeForegroundServicePort();
  const location = new GeolocationPort();

  const emergency = new EmergencyServiceImpl({
    permissions,
    power,
    signaling,
    foreground,
    location,
    medical: lazy(() => current.medical),
    mesh: lazy(() => current.mesh),
    reports: lazy(() => current.reports),
  });

  return {
    permissions,
    power,
    emergency,
  };
}
