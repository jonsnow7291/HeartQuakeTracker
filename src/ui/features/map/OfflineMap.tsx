import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { ensureMapAssets, type MapAssets } from '../../../platform/map/mapAssets';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { buildMapStyle } from './mapStyle';
import type { AppTheme } from '../../theme/theme';

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
}
export interface PinLook {
  bg: string;
  fg: string;
  icon: string;
}

export interface OfflineMapProps {
  user: { lat: number; lon: number };
  /** true si la posición viene del GPS; si no, es la ubicación de referencia y se avisa. */
  userIsReal: boolean;
  points: MapPoint[];
  selectedId?: string;
  onSelect: (id: string) => void;
  pinLook: (type: string) => PinLook;
  /** Se incrementa para volver a centrar en el usuario. */
  recenterKey?: number;
}

/**
 * Mapa vectorial offline de Bogotá (RF-10): MapLibre leyendo el PMTiles empaquetado en la app.
 * Los puntos de socorro se colocan en sus coordenadas reales.
 */
export function OfflineMap({ user, userIsReal, points, selectedId, onSelect, pinLook, recenterKey }: OfflineMapProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [assets, setAssets] = useState<MapAssets | undefined>();
  const [error, setError] = useState<string | undefined>();
  const camera = useRef<CameraRef>(null);

  useEffect(() => {
    let active = true;
    ensureMapAssets()
      .then((a) => active && setAssets(a))
      .catch((e) => {
        console.warn('[OfflineMap] no se pudo preparar el mapa:', e);
        if (active) setError('No se pudo preparar el mapa sin conexión.');
      });
    return () => {
      active = false;
    };
  }, []);

  const style = useMemo(() => (assets ? buildMapStyle(assets, isDark) : undefined), [assets, isDark]);

  useEffect(() => {
    if (recenterKey) camera.current?.easeTo({ center: [user.lon, user.lat], zoom: 15, duration: 500 });
  }, [recenterKey, user.lat, user.lon]);

  if (error) {
    return (
      <View style={styles.fill} accessibilityRole="alert">
        <Icon name="map" size={32} color={colors.outline} />
        <Text style={styles.msg}>{error}</Text>
      </View>
    );
  }
  if (!style) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator />
        <Text style={styles.msg}>Preparando mapa sin conexión…</Text>
      </View>
    );
  }

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={style}
      compass={false}
      logo={false}
      attribution
      attributionPosition={{ bottom: 6, right: 6 }}
    >
      <Camera ref={camera} initialViewState={{ center: [user.lon, user.lat], zoom: 13.2 }} minZoom={8} maxZoom={16} />

      <Marker id="user" lngLat={[user.lon, user.lat]}>
        <View accessibilityLabel={userIsReal ? 'Tu ubicación' : 'Ubicación de referencia'} style={[styles.user, !userIsReal && styles.userApprox]}>
          <View style={styles.userCore} />
        </View>
      </Marker>

      {points.map((p) => {
        const look = pinLook(p.type);
        const selected = p.id === selectedId;
        return (
          <Marker key={p.id} id={p.id} lngLat={[p.lon, p.lat]} onPress={() => onSelect(p.id)}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={p.name}
              style={[styles.pin, { backgroundColor: look.bg }, selected && styles.pinSelected]}
            >
              <Icon name={look.icon} size={selected ? 20 : 17} color={look.fg} />
            </View>
          </Marker>
        );
      })}
    </Map>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
    fill: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: brand.sand, padding: 16 },
    fillMsg: { color: brand.espressoSoft },
    msg: { fontSize: 14, color: brand.espresso, textAlign: 'center' },
    pin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface, elevation: 4 },
    pinSelected: { width: 42, height: 42, borderRadius: 21, borderColor: brand.espresso },
    user: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(37,99,235,0.25)', alignItems: 'center', justifyContent: 'center' },
    userApprox: { backgroundColor: 'rgba(128,117,110,0.30)' },
    userCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.auxiliary, borderWidth: 2, borderColor: colors.surface },
  });
