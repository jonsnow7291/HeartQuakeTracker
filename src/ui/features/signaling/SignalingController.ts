import { EmergencyService, EmergencyState } from '../../../contracts/emergency';
import { Unsubscribe } from '../../../contracts/types';

export interface SignalingHardwareDriver {
  setTorch(on: boolean): Promise<void>;
  playTone(frequencyHz: number, volume: number): Promise<void>;
  stopTone(): Promise<void>;
  isMuted(): Promise<boolean>;
}

export interface SignalingStatus {
  active: boolean;
  flashActive: boolean;
  toneActive: boolean;
  lowPower: boolean;
  mutedWarning: boolean;
}

/**
 * SignalingController (RF-06).
 * Subscribes to EmergencyService and manages visual strobe flash (4 Hz)
 * and high-frequency audio tone (3 kHz).
 * When lowPower (<20%), pulses are spaced out to conserve battery.
 */
export class SignalingController {
  private emergencyService: EmergencyService;
  private driver: SignalingHardwareDriver;
  private unsubscribe?: Unsubscribe;

  private isRunning: boolean = false;
  private strobeIntervalId?: any;
  private statusListeners: ((status: SignalingStatus) => void)[] = [];
  private currentStatus: SignalingStatus = {
    active: false,
    flashActive: false,
    toneActive: false,
    lowPower: false,
    mutedWarning: false,
  };

  constructor(emergencyService: EmergencyService, driver: SignalingHardwareDriver) {
    this.emergencyService = emergencyService;
    this.driver = driver;
  }

  public start(): void {
    if (this.unsubscribe) return;

    this.unsubscribe = this.emergencyService.subscribe((state: EmergencyState) => {
      this.handleStateChange(state);
    });

    // Check initial state
    try {
      this.handleStateChange(this.emergencyService.getState());
    } catch {
      // Emergency service might still be initializing
    }
  }

  public stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.shutdownSignaling();
  }

  public subscribeStatus(listener: (status: SignalingStatus) => void): Unsubscribe {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private handleStateChange(state: EmergencyState): void {
    if (state.phase === 'ACTIVE') {
      if (!this.isRunning) {
        this.activateSignaling(state.lowPower);
      } else if (this.currentStatus.lowPower !== state.lowPower) {
        // Adjust cycle if power mode changed during active emergency
        this.shutdownSignaling();
        this.activateSignaling(state.lowPower);
      }
    } else {
      if (this.isRunning) {
        this.shutdownSignaling();
      }
    }
  }

  private async activateSignaling(lowPower: boolean): Promise<void> {
    this.isRunning = true;

    // Check if device is muted (A2 exception)
    let isMuted = false;
    try {
      isMuted = await this.driver.isMuted();
    } catch {
      isMuted = false;
    }

    this.updateStatus({
      active: true,
      flashActive: true,
      toneActive: !isMuted,
      lowPower,
      mutedWarning: isMuted,
    });

    // Start tone (3 kHz high-pitch rescue frequency)
    if (!isMuted) {
      try {
        await this.driver.playTone(3000, 1.0);
      } catch (err) {
        console.warn('Could not activate audio tone:', err);
      }
    }

    // Start strobe flash: 4 Hz normally (~125ms on, 125ms off),
    // or low power pulse: 1 burst every 2 seconds to save battery
    let flashState = false;
    const intervalMs = lowPower ? 2000 : 125;

    this.strobeIntervalId = setInterval(async () => {
      flashState = !flashState;
      try {
        await this.driver.setTorch(flashState);
      } catch {
        // Device might not have flash or permission denied (A1 fallback: keep tone running)
        this.updateStatus({ ...this.currentStatus, flashActive: false });
      }
    }, intervalMs);
  }

  private async shutdownSignaling(): Promise<void> {
    this.isRunning = false;

    if (this.strobeIntervalId) {
      clearInterval(this.strobeIntervalId);
      this.strobeIntervalId = undefined;
    }

    try {
      await this.driver.setTorch(false);
    } catch {}

    try {
      await this.driver.stopTone();
    } catch {}

    this.updateStatus({
      active: false,
      flashActive: false,
      toneActive: false,
      lowPower: false,
      mutedWarning: false,
    });
  }

  private updateStatus(newStatus: SignalingStatus): void {
    this.currentStatus = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }
}
