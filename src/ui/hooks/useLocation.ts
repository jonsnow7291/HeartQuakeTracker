import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { GeoPoint } from '../../contracts/types';
import { watchLocation, type LocationStatus } from '../../platform/location/LocationWatcher';
import { useServices } from './useServices';

export interface UseLocation {
  position?: GeoPoint;
  status: LocationStatus;
  /** Vuelve a pedir permiso y a buscar la posición. */
  retry: () => void;
  /** Abre los ajustes del sistema donde se activa la ubicación o el permiso. */
  openSettings: () => void;
}

/** Posición real del GPS con su estado (permiso, ubicación apagada, sin señal). Nunca inventa una posición. */
export function useLocation(): UseLocation {
  const { permissions } = useServices();
  const [state, setState] = useState<{ status: LocationStatus; position?: GeoPoint }>({ status: 'BUSCANDO' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let active = true;
    (async () => {
      try {
        let st = await permissions.status('location');
        if (st !== 'granted') st = await permissions.request('location');
        if (!active) return;
        if (st !== 'granted') {
          setState({ status: 'PERMISO_DENEGADO' });
          return;
        }
        stop = watchLocation((u) => active && setState((prev) => ({ status: u.status, position: u.position ?? prev.position })));
      } catch {
        if (active) setState({ status: 'SIN_SENAL' });
      }
    })();
    return () => {
      active = false;
      stop?.();
    };
  }, [permissions, attempt]);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings());
    } else {
      Linking.openSettings();
    }
  }, []);

  return { ...state, retry: () => setAttempt((a) => a + 1), openSettings };
}
