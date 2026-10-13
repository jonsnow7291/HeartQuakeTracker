import { layers, namedFlavor } from '@protomaps/basemaps';
import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import type { MapAssets } from '../../../platform/map/mapAssets';

/**
 * Estilo del mapa base con los colores cálidos del sistema de diseño. Las capas se generan con la
 * librería oficial de Protomaps (etiquetas en español) y se leen del archivo local: no hace falta red.
 * Se omiten las capas que dependen de sprites (íconos), que no se empaquetan.
 * `isDark` ajusta los colores base del terreno para que el mapa no deslumbre en modo oscuro.
 */
export function buildMapStyle(assets: MapAssets, isDark = false): StyleSpecification {
  const base = isDark ? namedFlavor('dark') : namedFlavor('light');
  const flavor = isDark
    ? {
        ...base,
        background: '#1A1815',
        earth: '#1A1815',
        park_a: '#1F2A22',
        park_b: '#1F2A22',
        water: '#12303F',
      }
    : {
        ...base,
        background: '#F4ECE1',
        earth: '#F4ECE1',
        park_a: '#DDECD8',
        park_b: '#DDECD8',
        water: '#BFD8E6',
      };
  const layerList = layers('protomaps', flavor, { lang: 'es' }).filter(
    (l) => !(l.layout && (l.layout as Record<string, unknown>)['icon-image']),
  );
  return {
    version: 8,
    glyphs: assets.glyphsUrl,
    sources: {
      protomaps: {
        type: 'vector',
        url: assets.tilesUrl,
        attribution: '© OpenStreetMap',
      },
    },
    layers: layerList,
  } as unknown as StyleSpecification;
}
