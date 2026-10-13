# ADR 0009 – Mapa offline con PMTiles y MapLibre (precisa D-09)

- Estado: Aceptado
- Decide: equipo del proyecto
- Fecha: 2026-10-12

## Contexto
RF-10 exige un mapa vectorial de Bogotá sin conexión. D-09 proponía MBTiles; el visor inicial era un dibujo, no un mapa (fallo F-18).

## Decisión
Se empaqueta en la app un archivo **PMTiles** de Bogotá (OpenStreetMap vía Protomaps, bbox -74.25,4.45,-73.95,4.85, zoom 0 a 15, 19 MB) y las tipografías de las etiquetas. `@maplibre/maplibre-react-native` lo lee directamente; el estilo se genera con `@protomaps/basemaps`. Atribución «© OpenStreetMap» visible. Se regenera con `scripts/build-map.sh`.

## Alternativas consideradas
MBTiles (exigiría convertir; PMTiles se lee directo), teselas de `tile.openstreetmap.org` (su política prohíbe el uso masivo y offline), servicios con plan gratuito (límites y términos incompatibles con empaquetar), descargar el mapa tras instalar (no funcionaría sin red al primer arranque).

## Consecuencias
El APK crece unos 20 MB. Solo hay una región. Cada regeneración añade otra copia de 19 MB al historial de git. En iOS la carpeta `assets/bundle` debe añadirse como recurso de Xcode (pendiente).
