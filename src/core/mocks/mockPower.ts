import { PowerService } from '../../contracts/power';
import { Unsubscribe } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockPowerService implements PowerService {
  private devController?: MockDevScenarioController;
  private listeners: ((level: number, charging: boolean) => void)[] = [];

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;

    if (this.devController) {
      this.devController.subscribe(() => {
        this.notify();
      });
    }
  }

  public getLevel(): number {
    if (this.devController?.isScenarioActive('bateria_15')) {
      return 15;
    }
    return 85;
  }

  public subscribe(cb: (level: number, charging: boolean) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.getLevel(), false);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    const lvl = this.getLevel();
    this.listeners.forEach((l) => l(lvl, false));
  }
}
