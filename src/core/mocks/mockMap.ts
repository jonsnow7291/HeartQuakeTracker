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
import { MockDevScenarioController } from './mockDevScenarios';

export class MockPoiService implements PoiService {
  private pois: Poi[] = [
    {
      id: 'poi_001',
      type: 'ALBERGUE',
      name: 'Albergue Temporal Coliseo El Salitre',
      lat: 4.6583,
      lon: -74.0939,
      address: 'Calle 63 # 68-45, Bogotá',
      phone: '+57 1 6605000',
      active: true,
    },
    {
      id: 'poi_002',
      type: 'SALUD',
      name: 'Hospital Universitario San Ignacio',
      lat: 4.6277,
      lon: -74.0658,
      address: 'Carrera 7 # 40-62, Bogotá',
      phone: '+57 1 5946161',
      active: true,
    },
    {
      id: 'poi_003',
      type: 'BOMBEROS',
      name: 'Estación Central de Bomberos Bogotá B-1',
      lat: 4.6151,
      lon: -74.0722,
      address: 'Calle 22 # 5-68, Bogotá',
      phone: '119',
      active: true,
    },
    {
      id: 'poi_004',
      type: 'ZONA_SEGURA',
      name: 'Plaza de Bolívar (Zona Segura y Evacuación)',
      lat: 4.5981,
      lon: -74.0758,
      address: 'Carrera 7 # 11-10, Bogotá',
      active: true,
    },
    {
      id: 'poi_005',
      type: 'ACOPIO',
      name: 'Centro de Acopio Cruz Roja Colombiana Seccional Cundinamarca',
      lat: 4.6486,
      lon: -74.0911,
      address: 'Carrera 60 # 63-81, Bogotá',
      phone: '+57 1 7460909',
      active: true,
    },
  ];

  public async listInBounds(b: PoiBounds, types?: PoiType[]): Promise<Poi[]> {
    return this.pois.filter((p) => {
      if (types && types.length > 0 && !types.includes(p.type)) return false;
      return p.lat >= b.minLat && p.lat <= b.maxLat && p.lon >= b.minLon && p.lon <= b.maxLon;
    });
  }

  public async nearest(p: GeoPoint, types?: PoiType[], limit: number = 5): Promise<NearestPoi[]> {
    let filtered = this.pois;
    if (types && types.length > 0) {
      filtered = filtered.filter((x) => types.includes(x.type));
    }

    const calculated = filtered.map((poi) => {
      // Rough distance in meters
      const dLat = (poi.lat - p.lat) * 111320;
      const dLon = (poi.lon - p.lon) * 40075000 * Math.cos((p.lat * Math.PI) / 180) / 360;
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
    console.log(`[MockPoiService] Problem reported on ${poiId}: ${reason}, note: ${note}`);
  }
}

export class MockTileService implements TileService {
  private devController?: MockDevScenarioController;

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;
  }

  public async listRegions(): Promise<TileRegion[]> {
    const isMissing = this.devController?.isScenarioActive('sin_mapa_cacheado') ?? false;
    return [
      {
        id: 'region-bogota-dc',
        name: 'Bogotá D.C. (Urbana y Cerros Orientales)',
        sizeMB: 48,
        downloaded: !isMissing,
        version: '2026.10',
      },
    ];
  }

  public async download(regionId: string, onProgress: (pct: number) => void): Promise<void> {
    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 100));
      onProgress(i * 10);
    }
  }

  public async getLocalTilesPath(regionId: string): Promise<string | null> {
    if (this.devController?.isScenarioActive('sin_mapa_cacheado')) {
      return null;
    }
    return `file:///data/user/0/com.earthquaketracker/tiles/${regionId}.mbtiles`;
  }

  public async remove(regionId: string): Promise<void> {
    console.log(`[MockTileService] Removed tiles for ${regionId}`);
  }
}
