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
      id: 'poi-salud-001',
      type: 'SALUD',
      name: 'Hospital Universitario San Ignacio',
      lat: 4.6295,
      lon: -74.0655,
      address: 'Carrera 7 # 40-62, Bogotá',
      phone: '+57 1 5946161',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-salud-002',
      type: 'SALUD',
      name: 'Hospital Universitario Fundación Santa Fe de Bogotá',
      lat: 4.6934,
      lon: -74.0326,
      address: 'Calle 119 # 7-75, Bogotá',
      phone: '+57 1 6030303',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-salud-003',
      type: 'SALUD',
      name: 'Hospital de San José (Centro)',
      lat: 4.6045,
      lon: -74.0845,
      address: 'Calle 10 # 18-75, Bogotá',
      phone: '+57 1 3538000',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-salud-004',
      type: 'SALUD',
      name: 'Hospital Simón Bolívar (Subred Norte)',
      lat: 4.7439,
      lon: -74.0328,
      address: 'Calle 165 # 7-06, Bogotá',
      phone: '+57 1 6743322',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-salud-005',
      type: 'SALUD',
      name: 'Hospital El Tunal (Subred Sur)',
      lat: 4.5772,
      lon: -74.1378,
      address: 'Carrera 20 # 47B-35 Sur, Bogotá',
      phone: '+57 1 7428570',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-salud-006',
      type: 'SALUD',
      name: 'Hospital Occidente de Kennedy (Subred Sur Occidente)',
      lat: 4.6278,
      lon: -74.1528,
      address: 'Transversal 74F # 40B-54 Sur, Bogotá',
      phone: '+57 1 4480030',
      active: true,
      source: 'Secretaría Distrital de Salud de Bogotá',
      verified: false,
    },
    {
      id: 'poi-bomberos-001',
      type: 'BOMBEROS',
      name: 'Estación de Bomberos B-1 Chapinero',
      lat: 4.6483,
      lon: -74.0622,
      address: 'Calle 60 # 9-43, Bogotá',
      phone: '119',
      active: true,
      source: 'Cuerpo Oficial de Bomberos de Bogotá',
      verified: false,
    },
    {
      id: 'poi-bomberos-002',
      type: 'BOMBEROS',
      name: 'Estación de Bomberos B-2 Central (Puente Aranda)',
      lat: 4.6212,
      lon: -74.0955,
      address: 'Calle 22 # 5-68, Bogotá',
      phone: '119',
      active: true,
      source: 'Cuerpo Oficial de Bomberos de Bogotá',
      verified: false,
    },
    {
      id: 'poi-bomberos-003',
      type: 'BOMBEROS',
      name: 'Estación de Bomberos B-5 Kennedy',
      lat: 4.6225,
      lon: -74.1512,
      address: 'Avenida Primero de Mayo # 41-15 Sur, Bogotá',
      phone: '119',
      active: true,
      source: 'Cuerpo Oficial de Bomberos de Bogotá',
      verified: false,
    },
    {
      id: 'poi-bomberos-004',
      type: 'BOMBEROS',
      name: 'Estación de Bomberos B-9 Bellavista (Usaquén)',
      lat: 4.7456,
      lon: -74.0298,
      address: 'Carrera 7 # 166-01, Bogotá',
      phone: '119',
      active: true,
      source: 'Cuerpo Oficial de Bomberos de Bogotá',
      verified: false,
    },
    {
      id: 'poi-bomberos-005',
      type: 'BOMBEROS',
      name: 'Estación de Bomberos B-11 Restrepo (Antonio Nariño)',
      lat: 4.5826,
      lon: -74.1035,
      address: 'Calle 18 Sur # 18-40, Bogotá',
      phone: '119',
      active: true,
      source: 'Cuerpo Oficial de Bomberos de Bogotá',
      verified: false,
    },
    {
      id: 'poi-albergue-001',
      type: 'ALBERGUE',
      name: 'Coliseo El Salitre (Unidad Deportiva El Salitre)',
      lat: 4.6611,
      lon: -74.0898,
      address: 'Calle 63 # 68-45, Bogotá',
      phone: '+57 1 6605000',
      active: true,
      source: 'Instituto Distrital de Recreación y Deporte (IDRD)',
      verified: false,
    },
    {
      id: 'poi-albergue-002',
      type: 'ALBERGUE',
      name: 'Movistar Arena Bogotá (Complejo El Campín)',
      lat: 4.6489,
      lon: -74.0778,
      address: 'Diagonal 61C # 26-36, Bogotá',
      active: true,
      source: 'Alcaldía Mayor de Bogotá',
      verified: false,
    },
    {
      id: 'poi-albergue-003',
      type: 'ALBERGUE',
      name: 'Coliseo Cayetano Cañizares (Kennedy)',
      lat: 4.6186,
      lon: -74.1611,
      address: 'Carrera 80 # 40-55 Sur, Bogotá',
      active: true,
      source: 'Instituto Distrital de Recreación y Deporte (IDRD)',
      verified: false,
    },
    {
      id: 'poi-albergue-004',
      type: 'ALBERGUE',
      name: 'Palacio de los Deportes de Bogotá',
      lat: 4.6565,
      lon: -74.0855,
      address: 'Avenida Calle 63 # 59A-06, Bogotá',
      active: true,
      source: 'Instituto Distrital de Recreación y Deporte (IDRD)',
      verified: false,
    },
    {
      id: 'poi-zona-segura-001',
      type: 'ZONA_SEGURA',
      name: 'Parque Metropolitano Simón Bolívar',
      lat: 4.6582,
      lon: -74.0935,
      address: 'Calle 63 y 53 entre carreras 48 y 68, Bogotá',
      active: true,
      source: 'IDIGER',
      verified: false,
    },
    {
      id: 'poi-zona-segura-002',
      type: 'ZONA_SEGURA',
      name: 'Parque Metropolitano El Tunal',
      lat: 4.5735,
      lon: -74.1345,
      address: 'Calle 48B Sur y Avenida Boyacá, Bogotá',
      active: true,
      source: 'IDIGER',
      verified: false,
    },
    {
      id: 'poi-zona-segura-003',
      type: 'ZONA_SEGURA',
      name: 'Parque de la 93',
      lat: 4.6766,
      lon: -74.0535,
      address: 'Carrera 11A # 93A-46, Bogotá',
      active: true,
      source: 'IDIGER',
      verified: false,
    },
    {
      id: 'poi-zona-segura-004',
      type: 'ZONA_SEGURA',
      name: 'Plaza de Bolívar (Centro Histórico)',
      lat: 4.5981,
      lon: -74.076,
      address: 'Carrera 7 # 11-10, Bogotá',
      active: true,
      source: 'Alcaldía Mayor de Bogotá',
      verified: false,
    },
    {
      id: 'poi-acopio-001',
      type: 'ACOPIO',
      name: 'Plaza de los Artesanos (Centro de Acopio y Gestión)',
      lat: 4.6628,
      lon: -74.0825,
      address: 'Carrera 60 # 63A-52, Bogotá',
      phone: '+57 1 3693777',
      active: true,
      source: 'Secretaría Distrital de Desarrollo Económico',
      verified: false,
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
