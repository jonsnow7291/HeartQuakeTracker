import { NativeEventEmitter, NativeModules } from 'react-native';
import { PowerService } from '../../contracts/power';
import { Unsubscribe } from '../../contracts/types';

const { PowerModule } = NativeModules;

/**
 * Adaptador real de PowerService conectado a los módulos nativos PowerModule (Android / iOS).
 * Monitorea el porcentaje real de la batería y el estado de carga para activar
 * el modo SOS Prolongado (<20 % batería) según D-26 y RF-06.
 */
export class PowerServiceImpl implements PowerService {
  private level: number = 100;
  private charging: boolean = false;
  private listeners: ((level: number, charging: boolean) => void)[] = [];
  private eventEmitter?: NativeEventEmitter;

  constructor() {
    if (PowerModule) {
      try {
        this.eventEmitter = new NativeEventEmitter(PowerModule);
        this.eventEmitter.addListener('onBatteryChanged', (event: unknown) => {
          const ev = event as { level?: number; charging?: boolean } | null | undefined;
          if (typeof ev?.level === 'number') {
            this.level = ev.level;
            this.charging = Boolean(ev.charging);
            this.notify();
          }
        });

        // Carga inicial del estado
        PowerModule.getBatteryStatus()
          .then((status: { level: number; charging: boolean }) => {
            if (status) {
              this.level = status.level;
              this.charging = status.charging;
              this.notify();
            }
          })
          .catch((err: unknown) => {
            console.warn('[PowerService] No se pudo obtener el estado inicial de batería:', err);
          });
      } catch (err) {
        console.warn('[PowerService] Error inicializando listener nativo de batería:', err);
      }
    }
  }

  public getLevel(): number {
    return this.level;
  }

  public isCharging(): boolean {
    return this.charging;
  }

  public subscribe(cb: (level: number, charging: boolean) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.level, this.charging);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.level, this.charging));
  }
}
