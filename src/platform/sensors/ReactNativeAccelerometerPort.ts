import { NativeEventEmitter, NativeModules } from 'react-native';
import { AppException } from '../../contracts/types';
import type { AccelerometerPort, AccelerometerSample } from '../../core/sensors/ports';

const GRAVITY_MSS = 9.80665;

interface NativeSensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface NativeAccelerometerModule {
  isAvailable(): Promise<boolean>;
  start(rateHz: number): Promise<void>;
  stop(): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

/**
 * Adaptador de acelerómetro sobre el módulo nativo propio AccelerometerModule (RF-09, D-18).
 * Sustituye completamente a la librería deprecada react-native-sensors.
 * Se comunica con Android SensorManager e iOS CMMotionManager a ~50 Hz.
 */
export class ReactNativeAccelerometerPort implements AccelerometerPort {
  private subscription: { remove: () => void } | null = null;
  private emitter: NativeEventEmitter | null = null;

  private getModule(): NativeAccelerometerModule | null {
    const mod = (NativeModules as Record<string, unknown>).AccelerometerModule;
    return (mod as NativeAccelerometerModule) || null;
  }

  async isAvailable(): Promise<boolean> {
    const mod = this.getModule();
    if (!mod || typeof mod.isAvailable !== 'function') return false;
    try {
      return await mod.isAvailable();
    } catch {
      return false;
    }
  }

  async start(sampleRateHz: number, onSample: (sample: AccelerometerSample) => void): Promise<void> {
    const mod = this.getModule();
    if (!mod) {
      throw new AppException('NO_SENSORS', 'Módulo nativo de acelerómetro no disponible');
    }

    this.stop();

    try {
      if (!this.emitter) {
        this.emitter = new NativeEventEmitter(NativeModules.AccelerometerModule);
      }

      this.subscription = this.emitter.addListener('onAccelerometerData', (event: unknown) => {
        const data = event as NativeSensorData;
        onSample({
          x: data.x / GRAVITY_MSS,
          y: data.y / GRAVITY_MSS,
          z: data.z / GRAVITY_MSS,
          timestamp: data.timestamp || Date.now(),
        });
      });

      await mod.start(sampleRateHz);
    } catch (err) {
      this.stop();
      throw new AppException('NO_SENSORS', 'Fallo al iniciar el acelerómetro nativo');
    }
  }

  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    const mod = this.getModule();
    if (mod && typeof mod.stop === 'function') {
      try {
        mod.stop();
      } catch {
        // Ignorar fallo al detener
      }
    }
  }
}
