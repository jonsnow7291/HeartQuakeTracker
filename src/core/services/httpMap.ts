import {
  PoiService,
  TileService,
  Poi,
  NearestPoi,
  PoiBounds,
  PoiType,
  TileRegion,
} from '../../contracts/map';
import { GeoPoint } from '../../contracts/types';
import { ApiClient } from '../api/client';
import { MockPoiService, MockTileService } from '../mocks/mockMap';
import { MockDevScenarioController } from '../mocks/mockDevScenarios';

export class HttpPoiService implements PoiService {
  private client: ApiClient;
  private fallback: MockPoiService;
  private cache: Poi[] | null = null;
  private lastFetchedAt: number = 0;
  private devController?: MockDevScenarioController;

  constructor(client: ApiClient, fallback?: MockPoiService, devController?: MockDevScenarioController) {
    this.client = client;
    this.fallback = fallback || new MockPoiService();
    this.devController = devController;
  }

  private async fetchPois(): Promise<Poi[]> {
    if (this.devController?.isScenarioActive('offline_total')) {
      return this.fallback.listInBounds({ minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 });
    }

    const now = Date.now();
    // Cache for 60 seconds unless empty
    if (this.cache && now - this.lastFetchedAt < 60000) {
      return this.cache;
    }

    try {
      const res = await this.client.listPois();
      if (res.items && res.items.length > 0) {
        this.cache = res.items;
        this.lastFetchedAt = now;
        return this.cache;
      }
    } catch {
      // Fallback seamlessly to mock seed
    }

    if (this.cache) return this.cache;
    return this.fallback.listInBounds({ minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 });
  }

  public async listInBounds(b: PoiBounds, types?: PoiType[]): Promise<Poi[]> {
    const all = await this.fetchPois();
    return all.filter((p) => {
      if (types && types.length > 0 && !types.includes(p.type)) return false;
      return p.lat >= b.minLat && p.lat <= b.maxLat && p.lon >= b.minLon && p.lon <= b.maxLon;
    });
  }

  public async nearest(p: GeoPoint, types?: PoiType[], limit: number = 5): Promise<NearestPoi[]> {
    const all = await this.fetchPois();
    let filtered = all;
    if (types && types.length > 0) {
      filtered = filtered.filter((x) => types.includes(x.type));
    }

    const calculated = filtered.map((poi) => {
      const dLat = (poi.lat - p.lat) * 111320;
      const dLon = ((poi.lon - p.lon) * 40075000 * Math.cos((p.lat * Math.PI) / 180)) / 360;
      const dist = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
      return {
        ...poi,
        distanceM: dist,
      };
    });

    calculated.sort((a, b) => a.distanceM - b.distanceM);
    return calculated.slice(0, limit);
  }

  public async reportProblem(
    poiId: string,
    reason: 'NO_DISPONIBLE' | 'DIRECCION_ERRONEA' | 'OTRO',
    note?: string
  ): Promise<void> {
    try {
      // Attempt sending directly or queueing via sync
      await this.client.syncBatch([
        {
          eventId: `evt_problem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: 'POI_PROBLEM',
          ts: new Date().toISOString(),
          device: this.client.deviceId || 'dev_anonymous',
          payload: { poiId, reason, note },
        },
      ]);
    } catch {
      // Fallback local logging
      await this.fallback.reportProblem(poiId, reason, note);
    }
  }
}

export class HttpTileService implements TileService {
  private client: ApiClient;
  private fallback: MockTileService;

  constructor(client: ApiClient, fallback?: MockTileService) {
    this.client = client;
    this.fallback = fallback || new MockTileService();
  }

  public async listRegions(): Promise<TileRegion[]> {
    try {
      const res = await this.client.listTileRegions();
      if (res.items && res.items.length > 0) {
        return res.items;
      }
    } catch {
      // fallback
    }
    return this.fallback.listRegions();
  }

  public async download(regionId: string, onProgress: (pct: number) => void): Promise<void> {
    return this.fallback.download(regionId, onProgress);
  }

  public async getLocalTilesPath(regionId: string): Promise<string | null> {
    return this.fallback.getLocalTilesPath(regionId);
  }

  public async remove(regionId: string): Promise<void> {
    return this.fallback.remove(regionId);
  }
}
