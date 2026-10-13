import Geolocation, { type GeoError, type GeoPosition } from 'react-native-geolocation-service';
import type { GeoPoint } from '../../contracts/types';

export type LocationStatus =
  | 'BUSCANDO' // esperando la primera posición
  | 'OK' // posición real recibida
  | 'PERMISO_DENEGADO'
  | 'UBICACION_APAGADA' // los servicios de ubicación del teléfono están desactivados
  | 'SIN_SENAL'; // no se obtuvo posición (interior, sin cielo abierto)

export interface LocationUpdate {
  status: LocationStatus;
  position?: GeoPoint;
}

// Códigos de react-native-geolocation-service
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;
const TIMEOUT = 3;
const SETTINGS_NOT_SATISFIED = 5;

const toPoint = (p: GeoPosition): GeoPoint => ({
  lat: p.coords.latitude,
  lon: p.coords.longitude,
  accuracyM: p.coords.accuracy,
  ts: new Date(p.timestamp).toISOString(),
});

/**
 * Sigue la ubicación real del dispositivo. A diferencia de una lectura única con 5 s de plazo, mantiene la
 * búsqueda activa (en interior el primer fix puede tardar), pide encender los servicios de ubicación si están
 * apagados y distingue la causa cuando no hay posición, para que la interfaz pueda explicarla.
 * Devuelve la función que detiene el seguimiento.
 */
export function watchLocation(onUpdate: (u: LocationUpdate) => void): () => void {
  onUpdate({ status: 'BUSCANDO' });
  const id = Geolocation.watchPosition(
    (p) => onUpdate({ status: 'OK', position: toPoint(p) }),
    (e: GeoError) => {
      const status: LocationStatus =
        e.code === PERMISSION_DENIED ? 'PERMISO_DENEGADO' : e.code === SETTINGS_NOT_SATISFIED || e.code === POSITION_UNAVAILABLE ? 'UBICACION_APAGADA' : e.code === TIMEOUT ? 'SIN_SENAL' : 'SIN_SENAL';
      onUpdate({ status });
    },
    {
      enableHighAccuracy: true,
      interval: 5000,
      fastestInterval: 2000,
      distanceFilter: 5,
      showLocationDialog: true, // si la ubicación está apagada, el sistema ofrece activarla
      forceRequestLocation: true,
    },
  );
  return () => Geolocation.clearWatch(id);
}
