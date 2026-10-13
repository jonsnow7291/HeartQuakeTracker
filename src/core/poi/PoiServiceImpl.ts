import type {
  Poi,
  NearestPoi,
  PoiBounds,
  PoiType,
  PoiService,
} from '../../contracts/map';
import type { GeoPoint } from '../../contracts/types';
import type { KeyValueStore } from '../platform/ports';
import { SEED_POIS } from './seedPois';
import { haversineDistanceMeters } from './geoUtils';

export interface PoiProblemReport {
  poiId: string;
  reason: 'NO_DISPONIBLE' | 'DIRECCION_ERRONEA' | 'OTRO';
  note?: string;
  reportedAt: string;
}

export class PoiServiceImpl implements PoiService {
  private pois: Map<string, Poi>;
  private problemReports: PoiProblemReport[] = [];
  private stateStore?: KeyValueStore;

  constructor(initialPois?: Poi[], stateStore?: KeyValueStore) {
    const list = initialPois && initialPois.length > 0 ? initialPois : SEED_POIS;
    this.pois = new Map(list.map((p) => [p.id, { ...p }]));
    this.stateStore = stateStore;
  }

  /**
   * Retorna los puntos de interés comprendidos dentro del cuadro delimitador (bounding box)
   * especificado, opcionalmente filtrados por categoría.
   */
  public async listInBounds(b: PoiBounds, types?: PoiType[]): Promise<Poi[]> {
    const results: Poi[] = [];
    const filterTypes = types && types.length > 0 ? new Set(types) : null;

    for (const poi of Array.from(this.pois.values())) {
      if (filterTypes && !filterTypes.has(poi.type)) {
        continue;
      }
      if (
        poi.lat >= b.minLat &&
        poi.lat <= b.maxLat &&
        poi.lon >= b.minLon &&
        poi.lon <= b.maxLon
      ) {
        results.push({ ...poi });
      }
    }

    return results;
  }

  /**
   * Retorna los puntos de socorro más cercanos a la coordenada indicada,
   * calculando la distancia en metros y ordenados de menor a mayor distancia.
   */
  public async nearest(
    p: GeoPoint,
    types?: PoiType[],
    limit: number = 5
  ): Promise<NearestPoi[]> {
    const filterTypes = types && types.length > 0 ? new Set(types) : null;
    const candidates: NearestPoi[] = [];

    for (const poi of Array.from(this.pois.values())) {
      if (filterTypes && !filterTypes.has(poi.type)) {
        continue;
      }
      const distanceM = haversineDistanceMeters(p.lat, p.lon, poi.lat, poi.lon);
      candidates.push({
        ...poi,
        distanceM,
      });
    }

    candidates.sort((a, b) => a.distanceM - b.distanceM);
    return candidates.slice(0, Math.max(1, limit));
  }

  /**
   * Permite a un ciudadano o voluntario reportar una inconsistencia o punto inhabilitado.
   * Si la razón es 'NO_DISPONIBLE', el punto se marca como inactivo localmente para
   * prevenir que otros usuarios sean dirigidos a una zona inoperativa.
   */
  public async reportProblem(
    poiId: string,
    reason: 'NO_DISPONIBLE' | 'DIRECCION_ERRONEA' | 'OTRO',
    note?: string
  ): Promise<void> {
    const report: PoiProblemReport = {
      poiId,
      reason,
      note,
      reportedAt: new Date().toISOString(),
    };
    this.problemReports.push(report);

    const existing = this.pois.get(poiId);
    if (existing) {
      if (reason === 'NO_DISPONIBLE') {
        this.pois.set(poiId, { ...existing, active: false });
      }
    }

    if (this.stateStore) {
      try {
        await this.stateStore.set(
          `poi_report:${poiId}:${Date.now()}`,
          JSON.stringify(report)
        );
      } catch {
        // En caso de que el almacén falle, la memoria local retiene el reporte
      }
    }
  }

  /**
   * Lista todos los puntos registrados en el catálogo local.
   */
  public async getAllPois(): Promise<Poi[]> {
    return Array.from(this.pois.values()).map((p) => ({ ...p }));
  }

  /**
   * Obtiene un punto de interés por su ID.
   */
  public async getPoiById(id: string): Promise<Poi | undefined> {
    const poi = this.pois.get(id);
    return poi ? { ...poi } : undefined;
  }

  /**
   * Retorna el historial de problemas reportados en esta sesión.
   */
  public getProblemReports(): PoiProblemReport[] {
    return [...this.problemReports];
  }
}
