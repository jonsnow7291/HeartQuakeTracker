import { NativeModules } from 'react-native';
import { SignalingPort } from '../../core/emergency/ports';

const { SignalingModule } = NativeModules;

/**
 * Adaptador que enlaza el puerto de señalización con el módulo nativo propio
 * SignalingModule (Kotlin en Android, Swift en iOS).
 *
 * Garantiza encendido de flash estroboscópico a 4 Hz y tono de 3 kHz en < 300 ms tras confirmar (RNF-05).
 */
export class NativeSignalingPort implements SignalingPort {
  public async start(lowPower: boolean): Promise<void> {
    if (SignalingModule?.startSignaling) {
      await SignalingModule.startSignaling(lowPower);
    } else {
      console.warn('[NativeSignalingPort] SignalingModule no disponible en este entorno.');
    }
  }

  public async stop(): Promise<void> {
    if (SignalingModule?.stopSignaling) {
      await SignalingModule.stopSignaling();
    }
  }

  public async updateLowPower(lowPower: boolean): Promise<void> {
    if (SignalingModule?.updateLowPower) {
      await SignalingModule.updateLowPower(lowPower);
    }
  }

  public async isMuted(): Promise<boolean> {
    if (SignalingModule?.isMuted) {
      return await SignalingModule.isMuted();
    }
    return false;
  }
}
