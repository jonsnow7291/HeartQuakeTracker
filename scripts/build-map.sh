#!/usr/bin/env bash
# Regenera el mapa de Bogotá (assets/bundle/map/bogota.pmtiles) y las tipografías de las etiquetas.
# Requiere: curl y la CLI `pmtiles` (https://github.com/protomaps/go-pmtiles/releases) en el PATH.
# Uso: scripts/build-map.sh [AAAAMMDD]   (fecha de la compilación diaria de Protomaps; por defecto, ayer)
set -euo pipefail
cd "$(dirname "$0")/.."
FECHA="${1:-$(date -d yesterday +%Y%m%d)}"
OUT="assets/bundle/map"
# Bogotá D.C. y alrededores (oeste,sur,este,norte), hasta zoom 15.
BBOX="-74.25,4.45,-73.95,4.85"

mkdir -p "$OUT/fonts"
pmtiles extract "https://build.protomaps.com/${FECHA}.pmtiles" "$OUT/bogota.pmtiles" --bbox="$BBOX" --maxzoom=15
for f in "Noto Sans Regular" "Noto Sans Medium" "Noto Sans Italic"; do
  mkdir -p "$OUT/fonts/$f"
  for r in 0-255 256-511; do
    curl -fsSL -o "$OUT/fonts/$f/$r.pbf" "https://protomaps.github.io/basemaps-assets/fonts/${f// /%20}/$r.pbf"
  done
done
ls -la "$OUT/bogota.pmtiles"
