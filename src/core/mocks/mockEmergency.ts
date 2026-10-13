import {
  EmergencyService,
  EmergencyState,
  EmergencyPhase,
} from '../../contracts/emergency';
import { Severity, Unsubscribe } from '../../contracts/types';
import { PermissionKind } from '../../contracts/permissions';
import { MockPermissionsService } from './mockPermissions';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockEmergencyService implements EmergencyService {
  private state: EmergencyState = {
    phase: 'IDLE',
    lowPower: false,
    beaconActive: false,
    meshActive: false,
    medicalCardArmed: false,
    noBridge2Min: false,
  };

  private listeners: ((s: EmergencyState) => void)[] = [];
  private confirmTimer?: any;
  private permissionsService: MockPermissionsService;
  private devController?: MockDevScenarioController;

  constructor(
    permissionsService: MockPermissionsService,
    devController?: MockDevScenarioController
  ) {
    this.permissionsService = permissionsService;
    this.devController = devController;

    if (this.devController) {
      this.devController.subscribe((active) => {
        const isLowPower = active.includes('bateria_15');
        const noBridge2Min = active.includes('sin_puente_2min');
        let changed = false;
        if (this.state.lowPower !== isLowPower) {
          this.state = { ...this.state, lowPower: isLowPower };
          changed = true;
        }
        if (this.state.noBridge2Min !== noBridge2Min) {
          this.state = { ...this.state, noBridge2Min };
          changed = true;
        }
        if (changed) {
          this.notify();
        }
      });
    }
  }

  public getState(): EmergencyState {
    return { ...this.state };
  }

  public subscribe(cb: (s: EmergencyState) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async requestPanic(): Promise<{ missing: PermissionKind[] }> {
    const missing = await this.permissionsService.missingForEmergency();
    return { missing };
  }

  public async selectSeverity(s: Severity): Promise<void> {
    const now = new Date();
    const deadline = new Date(now.getTime() + 3000);

    this.state = {
      ...this.state,
      phase: 'CONFIRMING',
      severity: s,
      cancelDeadline: deadline.toISOString(),
      startedAt: now.toISOString(),
    };
    this.notify();

    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
    }

    this.confirmTimer = setTimeout(() => {
      if (this.state.phase === 'CONFIRMING') {
        const noBridge = this.devController?.isScenarioActive('sin_puente_2min') ?? false;
        this.state = {
          ...this.state,
          phase: 'ACTIVE',
          beaconActive: true,
          meshActive: true,
          medicalCardArmed: true,
          noBridge2Min: noBridge,
          lastPosition: {
            lat: 4.60971,
            lon: -74.08175,
            ts: new Date().toISOString(),
            accuracyM: 5,
          },
        };
        this.notify();
      }
    }, 3000);
  }

  public async cancel(): Promise<void> {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }
    this.state = {
      phase: 'IDLE',
      lowPower: this.devController?.isScenarioActive('bateria_15') ?? false,
      noBridge2Min: this.devController?.isScenarioActive('sin_puente_2min') ?? false,
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
    };
    this.notify();
  }

  public async stop(): Promise<void> {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }
    this.state = {
      ...this.state,
      phase: 'STOPPED',
      beaconActive: false,
      meshActive: false,
      medicalCardArmed: false,
    };
    this.notify();

    setTimeout(() => {
      this.state = {
        phase: 'IDLE',
        lowPower: this.devController?.isScenarioActive('bateria_15') ?? false,
        noBridge2Min: this.devController?.isScenarioActive('sin_puente_2min') ?? false,
        beaconActive: false,
        meshActive: false,
        medicalCardArmed: false,
      };
      this.notify();
    }, 500);
  }

  public async markSafe(): Promise<void> {
    this.state = {
      ...this.state,
      phase: 'IDLE',
      severity: 'ILESO',
      beaconActive: false,
    };
    this.notify();
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }
}
