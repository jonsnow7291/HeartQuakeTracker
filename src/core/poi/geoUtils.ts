import type { PoiBounds } from '../../contracts/map';

/**
 * Radio medio de la Tierra en metros (WGS-84 esferoide aproximado).
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcula la distancia ortodrómica en metros entre dos puntos geográficos (fórmula de Haversine).
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calcula el rumbo inicial (azimut o ángulo de brújula en grados de 0 a 359)
 * desde el punto de origen hacia el punto de destino.
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

/**
 * Convierte un rumbo en grados a dirección cardinal en español (N, NE, E, SE, S, SO, O, NO).
 */
export function bearingToCardinal(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index] ?? 'N';
}

/**
 * Estima el tiempo a pie en minutos para una distancia en metros,
 * asumiendo velocidad promedio de marcha en ciudad/evacuación de 4.5 km/h (75 m/min).
 */
export function estimateWalkingMinutes(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  return Math.max(1, Math.round(distanceMeters / 75));
}

/**
 * Formatea una distancia en metros para presentación en interfaz humana (es-CO).
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Determina si un punto se encuentra dentro de los límites geográficos indicados.
 */
export function isPointInBounds(
  point: { lat: number; lon: number },
  bounds: PoiBounds
): boolean {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lon >= bounds.minLon &&
    point.lon <= bounds.maxLon
  );
}
