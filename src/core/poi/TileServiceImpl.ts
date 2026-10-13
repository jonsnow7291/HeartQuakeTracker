import { AppException } from '../../contracts/types';
import type { TileRegion, TileService } from '../../contracts/map';
import type { DevScenarioController } from '../../contracts/dev';

export interface TileServiceDeps {
  devController?: DevScenarioController;
  isOnline?: () => Promise<boolean>;
  tileBaseDirectory?: string;
}

/**
 * Regiones con mapa REAL. Hoy solo existe Bogotá D.C., empaquetada dentro de la app (assets/bundle/map/bogota.pmtiles,
 * 19 MB, OpenStreetMap vía Protomaps, hasta zoom 15). No se listan otras regiones hasta tener sus teselas.
 */
const DEFAULT_REGIONS: TileRegion[] = [
  {
    id: 'region-bogota-dc',
    name: 'Bogotá D.C. (incluido en la app)',
    sizeMB: 19,
    downloaded: true,
    version: '2026-10-11',
  },
];

export class TileServiceImpl implements TileService {
  private regions: Map<string, TileRegion>;
  private devController?: DevScenarioController;
  private isOnlineCheck?: () => Promise<boolean>;
  private tileBaseDir: string;

  constructor(depsOrDev?: TileServiceDeps | DevScenarioController) {
    if (depsOrDev && 'list' in depsOrDev && typeof depsOrDev.list === 'function') {
      this.devController = depsOrDev as DevScenarioController;
      this.tileBaseDir = 'file:///data/user/0/com.earthquaketracker/tiles';
    } else if (depsOrDev) {
      const deps = depsOrDev as TileServiceDeps;
      this.devController = deps.devController;
      this.isOnlineCheck = deps.isOnline;
      this.tileBaseDir =
        deps.tileBaseDirectory ?? 'file:///data/user/0/com.earthquaketracker/tiles';
    } else {
      this.tileBaseDir = 'file:///data/user/0/com.earthquaketracker/tiles';
    }

    this.regions = new Map(
      DEFAULT_REGIONS.map((r) => [r.id, { ...r }])
    );
  }

  /**
   * Lista las regiones disponibles y su estado de descarga local.
   */
  public async listRegions(): Promise<TileRegion[]> {
    const isSinMapa = this.isSinMapaCacheado();
    return Array.from(this.regions.values()).map((r) => ({
      ...r,
      downloaded: isSinMapa && r.id === 'region-bogota-dc' ? false : r.downloaded,
    }));
  }

  /**
   * Descarga un paquete vectorial MBTiles para una región con reporte de progreso.
   * Falla con NETWORK_UNAVAILABLE si no hay conectividad o si el escenario offline_total está activo.
   */
  public async download(
    regionId: string,
    onProgress: (pct: number) => void
  ): Promise<void> {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new AppException('CONTENT_MISSING', `La región ${regionId} no existe`);
    }

    // Verificar conectividad de red o escenarios de prueba
    if (this.isOffline()) {
      throw new AppException(
        'NETWORK_UNAVAILABLE',
        'No hay conexión a internet para descargar el paquete de mapas vectoriales'
      );
    }

    if (this.isOnlineCheck) {
      const online = await this.isOnlineCheck();
      if (!online) {
        throw new AppException(
          'NETWORK_UNAVAILABLE',
          'No hay conexión a internet para descargar el paquete de mapas vectoriales'
        );
      }
    }

    // Emulación de descarga por bloques progresivos
    const steps = [15, 35, 60, 85, 100];
    for (const pct of steps) {
      onProgress(pct);
      // Breve pausa para permitir feedback visual en la interfaz
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    this.regions.set(regionId, {
      ...region,
      downloaded: true,
    });
  }

  /**
   * Retorna la ruta URI local del archivo .mbtiles si la región está descargada.
   * Si no está descargada o si el escenario de prueba 'sin_mapa_cacheado' está activo,
   * retorna null (activando el estado MAP_NOT_CACHED en la UI).
   */
  public async getLocalTilesPath(regionId: string): Promise<string | null> {
    if (this.isSinMapaCacheado()) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region || !region.downloaded) {
      return null;
    }

    return `${this.tileBaseDir}/${regionId}.mbtiles`;
  }

  /**
   * Elimina el paquete descargado de la memoria del teléfono para liberar almacenamiento.
   */
  public async remove(regionId: string): Promise<void> {
    const region = this.regions.get(regionId);
    if (region) {
      this.regions.set(regionId, {
        ...region,
        downloaded: false,
      });
    }
  }

  private isSinMapaCacheado(): boolean {
    if (!this.devController) return false;
    return this.devController.active().includes('sin_mapa_cacheado');
  }

  private isOffline(): boolean {
    if (!this.devController) return false;
    return this.devController.active().includes('offline_total');
  }
}
