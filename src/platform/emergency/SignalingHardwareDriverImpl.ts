import { NativeModules } from 'react-native';
import { SignalingHardwareDriver } from '../../ui/features/signaling/SignalingController';

const { SignalingModule } = NativeModules;

/**
 * Conductor de hardware para SignalingController de la UI, delegando
 * el control directo de antorcha y audio al módulo nativo SignalingModule.
 */
export class SignalingHardwareDriverImpl implements SignalingHardwareDriver {
  public async setTorch(on: boolean): Promise<void> {
    if (SignalingModule?.setTorch) {
      await SignalingModule.setTorch(on);
    }
  }

  public async playTone(frequencyHz: number, volume: number): Promise<void> {
    if (SignalingModule?.playTone) {
      await SignalingModule.playTone(frequencyHz, volume);
    }
  }

  public async stopTone(): Promise<void> {
    if (SignalingModule?.stopTone) {
      await SignalingModule.stopTone();
    }
  }

  public async isMuted(): Promise<boolean> {
    if (SignalingModule?.isMuted) {
      return await SignalingModule.isMuted();
    }
    return false;
  }
}
