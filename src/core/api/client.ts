import { AppException } from '../../contracts/types';
import { Poi, PoiBounds, PoiType, TileRegion } from '../../contracts/map';
import { AidEntity, AidNeed } from '../../contracts/aid';

export interface ApiClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  deviceId?: string;
}

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  public deviceId: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs || 5000;
    if (config.deviceId) {
      this.deviceId = config.deviceId;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: any = null;
        try {
          errorData = await res.json();
        } catch {
          // Response was not JSON
        }

        const msg = errorData?.issues?.join(', ') || errorData?.reason || errorData?.error || `HTTP ${res.status} ${res.statusText}`;

        if (res.status === 400) {
          throw new AppException('VALIDATION', msg, true);
        } else if (res.status === 401) {
          throw new AppException('AUTH_REQUIRED', msg, true);
        } else if (res.status === 403) {
          throw new AppException('AUTH_FAILED', msg, true);
        } else if (res.status === 404) {
          throw new AppException('CONTENT_MISSING', msg, true);
        } else {
          throw new AppException('UNKNOWN', msg, true);
        }
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof AppException) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new AppException('NETWORK_UNAVAILABLE', `Tiempo de espera agotado al conectar con ${url}`, true);
      }
      throw new AppException('NETWORK_UNAVAILABLE', `Error de red al conectar con el backend (${url}): ${err.message || err}`, true);
    }
  }

  // --- Health ---
  public async health(): Promise<{ status: string; ts: string }> {
    return this.request<{ status: string; ts: string }>('/v1/health');
  }

  // --- Catalogs: POIs (RF-10) ---
  public async listPois(query?: {
    bbox?: [number, number, number, number];
    types?: PoiType[];
    since?: string;
  }): Promise<{ items: Poi[]; serverTime: string }> {
    const params = new URLSearchParams();
    if (query?.bbox) params.append('bbox', query.bbox.join(','));
    if (query?.types && query.types.length > 0) params.append('types', query.types.join(','));
    if (query?.since) params.append('since', query.since);
    const qs = params.toString();
    return this.request<{ items: Poi[]; serverTime: string }>(`/v1/pois${qs ? `?${qs}` : ''}`);
  }

  // --- Catalogs: Aid (RF-11) ---
  public async listAidEntities(): Promise<{ items: AidEntity[] }> {
    return this.request<{ items: AidEntity[] }>('/v1/aid/entities');
  }

  public async listAidNeeds(): Promise<{ items: AidNeed[] }> {
    return this.request<{ items: AidNeed[] }>('/v1/aid/needs');
  }

  // --- Seismic Events (RF-09) ---
  public async listSeismicEvents(since?: string): Promise<{ items: any[] }> {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request<{ items: any[] }>(`/v1/seismic/events${qs}`);
  }

  // --- Content (RF-01) ---
  public async getContentManifest(): Promise<any> {
    return this.request<any>('/v1/content/manifest');
  }

  public async getContentPackage(version: string): Promise<any> {
    return this.request<any>(`/v1/content/package/${encodeURIComponent(version)}`);
  }

  // --- Tiles (RF-10) ---
  public async listTileRegions(): Promise<{ items: TileRegion[] }> {
    return this.request<{ items: TileRegion[] }>('/v1/tiles/regions');
  }

  // --- Rescuer (RF-13) ---
  public async verifyRescuer(code: string): Promise<{ valid: boolean; organization?: string; expiresAt?: string }> {
    return this.request<{ valid: boolean; organization?: string; expiresAt?: string }>('/v1/rescuer/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  public async listRescuerHashes(): Promise<{ issuedAt: string; hashes: string[]; publicKey: string; signature: string }> {
    return this.request<{ issuedAt: string; hashes: string[]; publicKey: string; signature: string }>('/v1/rescuer/list');
  }

  // --- Sync Batch (RF-12) ---
  public async syncBatch(
    events: any[],
    authHeaders?: {
      deviceId: string;
      timestamp: string;
      nonce: string;
      signature: string;
    }
  ): Promise<{ acks: { eventId: string; status: 'OK' | 'DUP' | 'REJECTED'; reason?: string }[] }> {
    const headers: Record<string, string> = {};
    if (authHeaders) {
      headers['X-Device-Id'] = authHeaders.deviceId;
      headers['X-Timestamp'] = authHeaders.timestamp;
      headers['X-Nonce'] = authHeaders.nonce;
      headers['X-Signature'] = authHeaders.signature;
    }
    return this.request<{ acks: { eventId: string; status: 'OK' | 'DUP' | 'REJECTED'; reason?: string }[] }>('/v1/sync/batch', {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
    });
  }
}
