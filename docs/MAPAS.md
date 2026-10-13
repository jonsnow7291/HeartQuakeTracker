# Mapa offline de Bogotá (RF-10, D-09)

## Qué hay
- `assets/bundle/map/bogota.pmtiles` — mapa vectorial de Bogotá D.C. (bbox `-74.25,4.45,-73.95,4.85`, zoom 0–15), **19 MB**.
- `assets/bundle/map/fonts/Noto Sans {Regular,Medium,Italic}/{0-255,256-511}.pbf` — tipografías de las etiquetas (≈0,6 MB).
- Se empaquetan dentro de la app (Android: `sourceSets.main.assets` en `android/app/build.gradle`) y funcionan **sin conexión**, incluso en modo avión.

## Cómo se dibuja
1. `src/platform/map/mapAssets.ts` copia los archivos una vez al almacenamiento privado (MapLibre necesita rutas reales).
2. `src/ui/features/map/mapStyle.ts` arma el estilo con `@protomaps/basemaps` (etiquetas en español, paleta cálida del diseño; se omiten íconos porque no hay sprites).
3. `src/ui/features/map/OfflineMap.tsx` muestra el mapa con MapLibre y coloca los puntos de socorro en sus coordenadas reales.
4. `MapScreen` usa el GPS real cuando hay permiso; si no, la posición de referencia (Plaza de Bolívar) y lo indica con «UBICACIÓN DE REFERENCIA».

## Fuente y licencia
- Datos: **© OpenStreetMap contributors**, licencia ODbL (obliga a mostrar la atribución; el mapa la muestra en la esquina inferior derecha).
- Teselas: compilaciones diarias de **Protomaps** (`build.protomaps.com`), recortadas con la CLI `pmtiles`.
- Tipografías: Noto Sans (SIL OFL), de `protomaps/basemaps-assets`.
- **No** se descargan teselas de `tile.openstreetmap.org`: su política prohíbe el uso masivo y offline.

## Regenerar o ampliar
`scripts/build-map.sh [AAAAMMDD]` vuelve a extraer Bogotá. Para otra región, cambia `BBOX` (y añade la región en `src/core/poi/TileServiceImpl.ts`).
Ejemplo para Cundinamarca completa: `--bbox=-75.2,3.7,-73.0,5.9` (será mucho más pesada; conviene descargarla bajo demanda y no empaquetarla).

## Puntos de socorro (RF-10): datos abiertos reales
`scripts/build-pois.js` descarga y empaqueta el catálogo en `assets/bundle/poi/pois.json` (≈150 KB, funciona sin conexión) y `server/seed/pois.json`.
Cada punto lleva `source` (fuente), `verified` y, si aplica, `note`; la app los muestra en el detalle del punto.

| Tipo | Puntos | Fuente | Verificado |
|---|---|---|---|
| Salud | 421 (158 hospitales + 263 clínicas y centros) | OpenStreetMap (`amenity=hospital/clinic`, `healthcare=centre`) | No |
| Bomberos | 21 | OpenStreetMap (`amenity=fire_station`) | No |
| Zonas seguras | 251 (11 puntos de encuentro + 240 parques de más de 3 ha) | OpenStreetMap (`emergency=assembly_point`, `leisure=park`) | No |
| Albergues | 2 | OpenStreetMap (`social_facility=shelter`, nombres con «albergue» o «refugio») | No |
| Acopio | 2 | OpenStreetMap (nombre con «acopio») | No |

Límites que hay que tener presentes:
- **Ningún punto está verificado por una entidad oficial.** El script también intenta la «Red adscrita de salud» de la Secretaría Distrital de Salud (portal de Datos Abiertos de Bogotá, `verified: true`), pero el portal respondía de forma intermitente y esa corrida no la incluyó; vuelve a ejecutar el script para sumarla.
- **Los parques son espacios abiertos, no puntos de encuentro oficiales**; así lo dice la nota del punto. Para el plan de emergencia oficial, consultar IDIGER.
- **Casi no hay albergues ni centros de acopio en OpenStreetMap**: en Bogotá se habilitan según la emergencia (colegios, coliseos) y no encontré que estén publicados como datos abiertos. Hay que pedirlos a IDIGER o a la Secretaría de Integración Social.
- OpenStreetMap lo edita la comunidad: puede haber puntos desactualizados. Para eso existe «Reportar» en el detalle del punto.
- Overpass puede devolver resultados parciales cuando está saturado; el script lo detecta y reintenta.

## Datos oficiales complementarios (por evaluar)
IGAC (cartografía oficial), IDECA / Datos Abiertos Bogotá y IDIGER (zonas de riesgo y puntos de encuentro) sirven para validar y sustituir los puntos de socorro de ejemplo de `server/seed/pois.json`.

## Pendiente
- **iOS:** `mapAssets.ts` lee el archivo desde `MainBundlePath/bundle/map`; hay que añadir la carpeta `assets/bundle` como recurso del proyecto de Xcode. Sin compilar ni verificar.
- Los puntos de socorro siguen siendo datos semilla de ejemplo, no un inventario oficial verificado.
