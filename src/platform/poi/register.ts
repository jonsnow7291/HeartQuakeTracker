import type { Services } from '../../contracts/container';
import type { Poi } from '../../contracts/map';
import { PoiServiceImpl } from '../../core/poi/PoiServiceImpl';
import { TileServiceImpl } from '../../core/poi/TileServiceImpl';
import { AidDirectoryServiceImpl } from '../../core/aid/AidDirectoryServiceImpl';

/**
 * Registra las implementaciones reales de PoiService y TileService para mapas offline
 * y directorio cartográfico de socorro (RF-10).
 */
export async function registerPoi(current: Services): Promise<Partial<Services>> {
  // Catálogo real de datos abiertos (OpenStreetMap y Datos Abiertos Bogotá), generado por scripts/build-pois.js.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const catalog = require('../../../assets/bundle/poi/pois.json') as { pois: Poi[] };
  const poi = new PoiServiceImpl(catalog.pois);
  const tiles = new TileServiceImpl(current.dev);

  // Catálogo de ayudas: una sola fuente, los datos de referencia del servidor (server/seed).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const aid = new AidDirectoryServiceImpl(require('../../../server/seed/entidades_ayuda.json'), require('../../../server/seed/necesidades.json'));

  return {
    poi,
    tiles,
    aid,
  };
}
