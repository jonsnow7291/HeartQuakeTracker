import Geolocation from 'react-native-geolocation-service';
import { GeoPoint } from '../../contracts/types';
import { LocationPort } from '../../core/emergency/ports';

/**
 * Adaptador de geolocalización que consulta coordenadas de alta precisión (GPS)
 * mediante react-native-geolocation-service para asociar al evento de auxilio.
 */
export class GeolocationPort implements LocationPort {
  public async getCurrentPosition(): Promise<GeoPoint | undefined> {
    return new Promise((resolve) => {
      try {
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracyM: position.coords.accuracy,
              ts: new Date(position.timestamp).toISOString(),
            });
          },
          (error) => {
            console.warn('[GeolocationPort] Error obteniendo posición GPS:', error);
            resolve(undefined);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            // En una emergencia no se puede esperar un fix nuevo: se acepta la última posición de hasta 2 min.
            maximumAge: 120000,
            forceRequestLocation: false,
            showLocationDialog: false,
          }
        );
      } catch (err) {
        console.warn('[GeolocationPort] Excepción al invocar Geolocation:', err);
        resolve(undefined);
      }
    });
  }
}
