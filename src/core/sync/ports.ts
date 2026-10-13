import type { Unsubscribe } from '../../contracts/types';

export interface NetworkPort {
  /** Indica si el dispositivo cuenta con conectividad a Internet. */
  isOnline(): Promise<boolean>;
  /** Notifica cambios en el estado de conectividad (online/offline). */
  subscribe(cb: (online: boolean) => void): Unsubscribe;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers?: Record<string, string>;
}

export interface HttpClientPort {
  /** Realiza una petición HTTP POST con cabeceras y cuerpo JSON. */
  post<T>(url: string, headers: Record<string, string>, body: unknown): Promise<HttpResponse<T>>;
  /** Realiza una petición HTTP GET opcional. */
  get?<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>>;
}
