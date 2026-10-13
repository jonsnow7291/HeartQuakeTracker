import type { GeoPoint } from '../../contracts/types';

/**
 * Mensaje para compartir el estado del usuario. Incluye la ubicación como enlace de mapa solo si hay una posición
 * real; nunca se inventa una, y nunca incluye datos médicos (eso solo viaja cifrado por Bluetooth a socorristas).
 */
export function buildStatusMessage(kind: 'SAFE' | 'HELP', position?: GeoPoint, now: Date = new Date()): string {
  const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const head = kind === 'SAFE' ? `Estoy a salvo (${hora}).` : `NECESITO AYUDA (${hora}).`;
  if (!position) return `${head} No pude obtener mi ubicación. — EarthQuakeTracker`;
  const lat = position.lat.toFixed(5);
  const lon = position.lon.toFixed(5);
  const precision = position.accuracyM ? ` (±${Math.round(position.accuracyM)} m)` : '';
  return `${head} Mi ubicación${precision}: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon} — EarthQuakeTracker`;
}
