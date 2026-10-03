import { SessionService, SessionUser } from '../../contracts/session';
import { Unsubscribe } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockSessionService implements SessionService {
  private unlocked: boolean = true;
  private hasAcc: boolean = true;
  private user: SessionUser = {
    id: 'usr_local_001',
    displayName: 'Santiago Gonzalez',
    email: 'santiagosgg23@gmail.com',
  };
  private pin: string = '123456';
  private listeners: ((unlocked: boolean) => void)[] = [];
  private devController?: MockDevScenarioController;

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public async hasAccount(): Promise<boolean> {
    return this.hasAcc;
  }

  public async createLocalAccount(input: {
    displayName: string;
    email?: string;
    pin: string;
    acceptTerms: true;
  }): Promise<void> {
    this.user = {
      id: `usr_${Date.now()}`,
      displayName: input.displayName,
      email: input.email,
    };
    this.pin = input.pin;
    this.hasAcc = true;
    this.unlocked = true;
    this.notify();
  }

  public async unlock(method: { pin: string } | { biometric: true }): Promise<void> {
    if ('pin' in method) {
      if (method.pin !== this.pin) {
        const error = new Error('PIN incorrecto');
        (error as any).code = 'AUTH_FAILED';
        throw error;
      }
    }
    this.unlocked = true;
    this.notify();
  }

  public lock(): void {
    this.unlocked = false;
    this.notify();
  }

  public subscribe(cb: (unlocked: boolean) => void): Unsubscribe {
    this.listeners.push(cb);
    cb(this.unlocked);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async getUser(): Promise<SessionUser> {
    return { ...this.user };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.unlocked));
  }
}
