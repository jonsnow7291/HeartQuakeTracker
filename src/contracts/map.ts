import { GeoPoint } from './types';

export type PoiType = 'ALBERGUE' | 'ACOPIO' | 'BOMBEROS' | 'SALUD' | 'ZONA_SEGURA';

export interface Poi {
  id: string;
  type: PoiType;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  active: boolean;
}

export interface NearestPoi extends Poi {
  distanceM: number;
}

export interface PoiBounds {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface PoiService {
  listInBounds(b: PoiBounds, types?: PoiType[]): Promise<Poi[]>;
  nearest(p: GeoPoint, types?: PoiType[], limit?: number): Promise<NearestPoi[]>;
  reportProblem(
    poiId: string,
    reason: 'NO_DISPONIBLE' | 'DIRECCION_ERRONEA' | 'OTRO',
    note?: string
  ): Promise<void>;
}

export interface TileRegion {
  id: string;
  name: string;
  sizeMB: number;
  downloaded: boolean;
  version: string;
}

export interface TileService {
  listRegions(): Promise<TileRegion[]>;
  download(regionId: string, onProgress: (pct: number) => void): Promise<void>; // NETWORK_UNAVAILABLE
  getLocalTilesPath(regionId: string): Promise<string | null>; // ruta al .mbtiles
  remove(regionId: string): Promise<void>;
}
