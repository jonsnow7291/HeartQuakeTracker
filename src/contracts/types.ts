export type Unsubscribe = () => void;
export type ISODate = string;
export type Severity = 'ILESO' | 'CON_LESIONES' | 'ATRAPADO';

export interface GeoPoint {
  lat: number;
  lon: number;
  ts: ISODate;
  accuracyM?: number;
}

export interface AppError {
  code: import('./errors').ErrorCode;
  message: string;
  recoverable: boolean;
}

export interface Page<T> {
  items: T[];
  next?: string;
}
