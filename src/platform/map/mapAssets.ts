import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * Prepara el mapa offline (RF-10, D-09): el archivo PMTiles de Bogotá y las tipografías de las etiquetas
 * viajan dentro de la app (assets/bundle/map) y se copian una vez al almacenamiento privado, porque el motor
 * de mapas necesita rutas de archivo reales. Datos © OpenStreetMap, teselas de Protomaps (ODbL).
 */
const FONTS = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'];
const RANGES = ['0-255', '256-511'];
export const PMTILES_ASSET = 'map/bogota.pmtiles';

export interface MapAssets {
  /** Origen de teselas vectoriales: pmtiles://file:///… */
  tilesUrl: string;
  /** Plantilla de glifos: file:///…/{fontstack}/{range}.pbf */
  glyphsUrl: string;
}

let cached: Promise<MapAssets> | null = null;

async function copyAsset(asset: string, dest: string): Promise<void> {
  const dir = dest.slice(0, dest.lastIndexOf('/'));
  await RNFS.mkdir(dir);
  if (Platform.OS === 'android') {
    await RNFS.copyFileAssets(asset, dest);
  } else {
    await RNFS.copyFile(`${RNFS.MainBundlePath}/bundle/${asset}`, dest);
  }
}

async function prepare(): Promise<MapAssets> {
  const root = `${RNFS.DocumentDirectoryPath}/map`;
  const tiles = `${root}/bogota.pmtiles`;

  // El archivo de teselas es grande: solo se vuelve a copiar si falta.
  if (!(await RNFS.exists(tiles))) await copyAsset(PMTILES_ASSET, tiles);

  for (const font of FONTS) {
    for (const range of RANGES) {
      const dest = `${root}/fonts/${font}/${range}.pbf`;
      if (!(await RNFS.exists(dest))) await copyAsset(`map/fonts/${font}/${range}.pbf`, dest);
    }
  }
  return {
    tilesUrl: `pmtiles://file://${tiles}`,
    glyphsUrl: `file://${root}/fonts/{fontstack}/{range}.pbf`,
  };
}

/** Copia los recursos la primera vez y devuelve las URL locales. Reintenta si falló. */
export function ensureMapAssets(): Promise<MapAssets> {
  if (!cached) {
    cached = prepare().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
