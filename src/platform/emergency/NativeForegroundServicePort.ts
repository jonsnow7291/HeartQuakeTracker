import { NativeModules, Platform } from 'react-native';
import { ForegroundServicePort } from '../../core/emergency/ports';

const { SignalingModule } = NativeModules;

/**
 * Adaptador para el servicio en primer plano de Android.
 * Mantiene la ejecución ininterrumpida y WakeLock mientras dura la emergencia.
 */
export class NativeForegroundServicePort implements ForegroundServicePort {
  public async start(title: string, message: string): Promise<void> {
    if (Platform.OS === 'android' && SignalingModule?.startForegroundService) {
      try {
        await SignalingModule.startForegroundService(title, message);
      } catch (err) {
        console.warn('[NativeForegroundServicePort] No se pudo iniciar el servicio en primer plano:', err);
      }
    }
  }

  public async stop(): Promise<void> {
    if (Platform.OS === 'android' && SignalingModule?.stopForegroundService) {
      try {
        await SignalingModule.stopForegroundService();
      } catch (err) {
        console.warn('[NativeForegroundServicePort] No se pudo detener el servicio en primer plano:', err);
      }
    }
  }
}
