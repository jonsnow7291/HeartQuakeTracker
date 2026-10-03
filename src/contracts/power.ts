import { Unsubscribe } from './types';

export interface PowerService {
  getLevel(): number;
  subscribe(cb: (level: number, charging: boolean) => void): Unsubscribe;
}
