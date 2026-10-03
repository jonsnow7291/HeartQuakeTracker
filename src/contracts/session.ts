import { Unsubscribe } from './types';

export interface SessionUser {
  id: string;
  displayName: string;
  email?: string;
}

export interface SessionService {
  isUnlocked(): boolean;
  hasAccount(): Promise<boolean>;
  createLocalAccount(input: {
    displayName: string;
    email?: string;
    pin: string;
    acceptTerms: true;
  }): Promise<void>;
  unlock(method: { pin: string } | { biometric: true }): Promise<void>; // AUTH_FAILED
  lock(): void;
  subscribe(cb: (unlocked: boolean) => void): Unsubscribe;
  getUser(): Promise<SessionUser>;
}
