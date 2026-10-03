import { Unsubscribe, ISODate, Page } from './types';

export interface SeismicAlert {
  id: string;
  ts: ISODate;
  level: 'POSSIBLE' | 'CONFIRMED' | 'DISCARDED';
  peakG: number;
  quorumNodes: number;
  note?: string;
}

export interface SensorService {
  isAvailable(): boolean;
  start(): Promise<void>;
  stop(): void;
  subscribe(cb: (a: SeismicAlert) => void): Unsubscribe;
}

export interface AlertItem {
  id: string;
  kind: 'SEISMIC' | 'DRILL' | 'INFO';
  title: string;
  body?: string;
  ts: ISODate;
  seismic?: SeismicAlert;
}

export interface AlertsService {
  list(page?: string): Promise<Page<AlertItem>>;
  subscribeNew(cb: (a: AlertItem) => void): Unsubscribe;
  scheduleDrill(at: ISODate, title: string): Promise<void>;
}
