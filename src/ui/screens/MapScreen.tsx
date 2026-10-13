import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, useWindowDimensions } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import type { NearestPoi, PoiType } from '../../contracts/map';
import type { GeoPoint } from '../../contracts/types';
import {
  calculateBearing,
  bearingToCardinal,
  estimateWalkingMinutes,
  formatDistance,
} from '../../core/poi/geoUtils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Badge } from '../components/Badge';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import { OfflineMap } from '../features/map/OfflineMap';
import { useLocation } from '../hooks/useLocation';

// Ubicación por defecto de referencia: Centro / Plaza de Bolívar Bogotá
const DEFAULT_BOGOTA_POSITION: GeoPoint = {
  lat: 4.5981,
  lon: -74.076,
  ts: new Date().toISOString(),
};

interface CategoryConfig {
  label: string;
  value: PoiType | 'ALL';
  icon: string;
}

const CATEGORIES: CategoryConfig[] = [
  { label: 'Todos', value: 'ALL', icon: 'explore' },
  { label: 'Zonas Seguras', value: 'ZONA_SEGURA', icon: 'verified' },
  { label: 'Albergues', value: 'ALBERGUE', icon: 'night_shelter' },
  { label: 'Centros de Acopio', value: 'ACOPIO', icon: 'location_on' },
  { label: 'Salud', value: 'SALUD', icon: 'local_hospital' },
  { label: 'Bomberos', value: 'BOMBEROS', icon: 'local_fire_department' },
];

const POI_LABEL: Record<string, string> = {
  ZONA_SEGURA: 'Zona segura',
  ALBERGUE: 'Albergue',
  ACOPIO: 'Centro de acopio',
  SALUD: 'Salud',
  BOMBEROS: 'Bomberos',
};

const GPS_LABEL: Record<string, string> = {
  BUSCANDO: 'BUSCANDO TU UBICACIÓN…',
  OK: 'GPS ACTIVO',
  PERMISO_DENEGADO: 'ACTIVA EL PERMISO DE UBICACIÓN',
  UBICACION_APAGADA: 'ENCIENDE LA UBICACIÓN DEL TELÉFONO',
  SIN_SENAL: 'SIN SEÑAL GPS · TOCA PARA REINTENTAR',
};

export function MapScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { poi, tiles } = useServices();

  // Posición real del GPS. Si no hay (permiso denegado, ubicación apagada, sin señal) se usa la ubicación de
  // referencia (Plaza de Bolívar) y la pantalla explica la causa en vez de aparentar que es tu posición.
  const { height: windowHeight } = useWindowDimensions();
  // El mapa ocupa unos dos quintos de la pantalla: grande para usarlo, y deja ver la lista debajo.
  const mapHeight = Math.max(260, Math.min(460, Math.round(windowHeight * 0.4)));
  const loc = useLocation();
  const gpsIsReal = loc.status === 'OK' && !!loc.position;
  const currentPosition: GeoPoint = gpsIsReal && loc.position ? loc.position : DEFAULT_BOGOTA_POSITION;
  const [recenterKey, setRecenterKey] = useState(0);
  // Al llegar la primera posición real, el mapa se centra en ella.
  useEffect(() => {
    if (gpsIsReal) setRecenterKey((k) => k + 1);
  }, [gpsIsReal]);
  const [selectedCategory, setSelectedCategory] = useState<PoiType | 'ALL'>('ALL');
  // Todos los puntos del catálogo ordenados por distancia; los contadores, la lista y el mapa se derivan de aquí.
  const [allNearest, setAllNearest] = useState<NearestPoi[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<NearestPoi | null>(null);
  const [hasCachedTiles, setHasCachedTiles] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Estado del modal de reporte de problema
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<'NO_DISPONIBLE' | 'DIRECCION_ERRONEA' | 'OTRO'>('NO_DISPONIBLE');
  const [reportNote, setReportNote] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Estado del modal de "Cómo llegar" (ruta estimada sin red)
  const [routeModalVisible, setRouteModalVisible] = useState<boolean>(false);

  // Verificar caché de tiles y cargar puntos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const tilesPath = await tiles.getLocalTilesPath('region-bogota-dc');
      setHasCachedTiles(tilesPath !== null);

      setAllNearest(await poi.nearest(currentPosition, undefined, 1000));
    } catch (err) {
      console.warn('[MapScreen] Error cargando datos de mapa:', err);
    } finally {
      setLoading(false);
    }
  }, [tiles, poi, currentPosition]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Radio de consulta: los contadores y el mapa muestran lo que hay a menos de 5 km (o, si no hay nada, no inventan nada).
  const RADIUS_M = 5000;
  const withinRadius = useMemo(() => allNearest.filter((p) => p.distanceM <= RADIUS_M), [allNearest]);

  // Contadores reales por categoría, dentro del radio.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ZONA_SEGURA: 0, ALBERGUE: 0, ACOPIO: 0, SALUD: 0, BOMBEROS: 0 };
    for (const item of withinRadius) {
      const cur = counts[item.type];
      if (cur !== undefined) counts[item.type] = cur + 1;
    }
    return counts;
  }, [withinRadius]);

  // Lista (modo lista): los más cercanos de la categoría elegida.
  const nearestList = useMemo(() => {
    const base = selectedCategory === 'ALL' ? allNearest : allNearest.filter((p) => p.type === selectedCategory);
    return base.slice(0, 40);
  }, [allNearest, selectedCategory]);

  // Marcadores del mapa: los más cercanos de cada tipo (todos los tipos a la vez, sin que uno tape a los demás).
  const mapPoints = useMemo(() => {
    const types = selectedCategory === 'ALL' ? (['ZONA_SEGURA', 'ALBERGUE', 'ACOPIO', 'SALUD', 'BOMBEROS'] as PoiType[]) : [selectedCategory];
    const perType = selectedCategory === 'ALL' ? 8 : 30;
    return types.flatMap((t) => allNearest.filter((p) => p.type === t && p.distanceM <= 8000).slice(0, perType));
  }, [allNearest, selectedCategory]);

  // Manejar envío de reporte de problema
  const handleSubmitReport = async () => {
    if (!selectedPoi) return;
    try {
      setIsSubmittingReport(true);
      await poi.reportProblem(selectedPoi.id, reportReason, reportNote.trim());
      Alert.alert(
        'Reporte Registrado',
        'Gracias por informar la situación. El punto ha sido actualizado en tu base de datos local y se sincronizará con los servicios de emergencia.',
        [{ text: 'Aceptar', onPress: () => setReportModalVisible(false) }]
      );
      setReportNote('');
      await loadData();
    } catch {
      Alert.alert('Error', 'No se pudo registrar el reporte.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Cálculo de rumbo y dirección cardinal hacia el POI seleccionado
  const selectedBearingInfo = useMemo(() => {
    if (!selectedPoi) return null;
    const bearing = calculateBearing(
      currentPosition.lat,
      currentPosition.lon,
      selectedPoi.lat,
      selectedPoi.lon
    );
    const cardinal = bearingToCardinal(bearing);
    const walkingMin = estimateWalkingMinutes(selectedPoi.distanceM);
    return { bearing, cardinal, walkingMin };
  }, [currentPosition, selectedPoi]);

  // Punto más seguro o cercano
  const nearestSafeZone = useMemo(() => {
    // Solo una zona segura real: nunca se hace pasar por zona segura a un hospital u otro punto.
    return allNearest.find((p) => p.type === 'ZONA_SEGURA') ?? null;
  }, [allNearest]);

  // Pin color e icono por tipo de punto
  const getPoiStyle = (type: PoiType) => {
    switch (type) {
      case 'ZONA_SEGURA':
        return { bg: brand.prevention, icon: 'verified', fg: brand.onPhase };
      case 'ALBERGUE':
        return { bg: brand.after, icon: 'night_shelter', fg: brand.onPhase };
      case 'ACOPIO':
        return { bg: colors.secondaryContainer, icon: 'location_on', fg: colors.onSecondaryContainer };
      case 'SALUD':
        return { bg: colors.panic, icon: 'local_hospital', fg: colors.onPanic };
      case 'BOMBEROS':
        return { bg: brand.during, icon: 'local_fire_department', fg: brand.onPhase };
      default:
        return { bg: colors.primary, icon: 'place', fg: colors.onPrimary };
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Cabecera oficial del mockup (Logo + SISMOS TRACKER + Mapa + Controles) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LogoMark size={32} />
          <View style={styles.headerTitles}>
            <Text style={styles.headerEyebrow}>SISMOS TRACKER</Text>
            <Text style={styles.headerTitle}>Mapa</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('MapRegions')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Administrar paquetes de mapas offline"
          >
            <Icon name="layers" size={22} color={brand.espresso} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Centro de alertas"
          >
            <Icon name="notifications" size={22} color={brand.espresso} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Perfil de usuario"
          >
            <Icon name="person" size={18} color={brand.cream} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra superior fija: el mapa NO va dentro del scroll de la página; así arrastrarlo mueve el mapa y no toda la pantalla. */}
      <View style={styles.fixedTop}>
        {/* Aviso si el mapa vectorial no está descargado */}
        {!hasCachedTiles && (
          <View style={styles.bannerContainer}>
            <Banner
              kind="warning"
              title="Mapa no descargado"
              message="Mapa vectorial no descargado. Puedes usar la navegación polar o descargar el paquete de Bogotá."
              actionText="Descargar"
              onAction={() => navigation.navigate('MapRegions')}
            />
          </View>
        )}

        {/* Explorador de Refugios y Tira de Acción */}
        <View style={styles.quickActionStrip}>
          <View style={styles.quickActionLeft}>
            <Icon name="explore" size={20} color={brand.during} filled />
            <Text style={styles.quickActionTitle}>Explorador de Refugios</Text>
          </View>
          <View style={styles.quickActionRight}>
            <TouchableOpacity
              style={[styles.filterPill, showFilters && styles.filterPillActive]}
              onPress={() => setShowFilters((prev) => !prev)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Alternar filtros de marcadores"
            >
              <Icon name="tune" size={18} color={showFilters ? colors.onPrimary : brand.espresso} />
              <Text style={[styles.filterPillText, showFilters && { color: colors.onPrimary }]}>Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTogglePill, viewMode === 'LIST' && styles.modeTogglePillActive]}
              onPress={() => setViewMode(viewMode === 'MAP' ? 'LIST' : 'MAP')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={viewMode === 'MAP' ? 'Ver modo lista con brújula' : 'Ver modo mapa táctil'}
            >
              <Icon
                name={viewMode === 'MAP' ? 'format_list_bulleted' : 'map'}
                size={18}
                color={brand.espresso}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtros expandibles por categoría */}
        {showFilters && (
          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(cat.value)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {viewMode === 'MAP' ? (
          <View style={[styles.mapCard, { height: mapHeight }]}>
            {/* Mapa vectorial offline de Bogotá (PMTiles empaquetado) con los puntos en sus coordenadas reales */}
            <View style={styles.mapSvgContainer}>
              <OfflineMap
                user={currentPosition}
                userIsReal={gpsIsReal}
                points={mapPoints.map((it) => ({ id: it.id, name: it.name, lat: it.lat, lon: it.lon, type: it.type }))}
                selectedId={selectedPoi?.id}
                onSelect={(id) => setSelectedPoi(allNearest.find((x) => x.id === id) ?? null)}
                pinLook={(t) => getPoiStyle(t as PoiType)}
                recenterKey={recenterKey}
              />
            </View>

            {/* Overlay: Estado GPS En Vivo */}
            <TouchableOpacity
              style={styles.gpsOverlay}
              disabled={loc.status === 'OK' || loc.status === 'BUSCANDO'}
              onPress={() => (loc.status === 'PERMISO_DENEGADO' || loc.status === 'UBICACION_APAGADA' ? loc.openSettings() : loc.retry())}
              accessibilityRole="button"
              accessibilityLabel={GPS_LABEL[loc.status]}
            >
              <View style={[styles.gpsPulseDot, loc.status !== 'OK' && { backgroundColor: brand.during }]} />
              <Text style={styles.gpsText}>
                {gpsIsReal && loc.position?.accuracyM ? `GPS ACTIVO · ±${Math.round(loc.position.accuracyM)} m` : GPS_LABEL[loc.status]}
              </Text>
            </TouchableOpacity>

            {/* Overlay: Controles de Ubicación y Zoom */}
            <View style={styles.mapControlsOverlay}>
              <TouchableOpacity
                style={styles.controlCircleBtn}
                onPress={() => setRecenterKey((k) => k + 1)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Centrar en mi ubicación"
              >
                <Icon name="my_location" size={20} color={brand.espresso} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlCircleBtn}
                onPress={() => setRouteModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Calcular ruta de escape"
              >
                <Icon name="near_me" size={20} color={brand.espresso} />
              </TouchableOpacity>
            </View>

            {/* Píldora inferior del mapa: Distancia a la zona segura más cercana */}
            <View style={styles.bottomMapPill}>
              <View style={styles.bottomMapPillLeft}>
                <Icon name="directions_walk" size={18} color={brand.during} />
                <Text style={styles.bottomMapPillLabel}>Zona segura más cercana:</Text>
              </View>
              <Text style={styles.bottomMapPillValue}>
                {nearestSafeZone
                  ? `${formatDistance(nearestSafeZone.distanceM)} (${estimateWalkingMinutes(nearestSafeZone.distanceM)} min)`
                  : 'sin dato'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'LIST' ? (
          <View style={styles.listContainer}>
            {nearestList.length === 0 && !loading ? (
              <EmptyState
                title="Sin puntos en esta categoría"
                description="No se encontraron puntos de socorro cercanos para el filtro seleccionado."
                icon="place"
                actionText="Ver todos los puntos"
                onAction={() => setSelectedCategory('ALL')}
              />
            ) : (
              nearestList.map((item) => {
                const isSelected = selectedPoi?.id === item.id;
                const bearing = calculateBearing(
                  currentPosition.lat,
                  currentPosition.lon,
                  item.lat,
                  item.lon
                );
                const cardinal = bearingToCardinal(bearing);
                const walkingMin = estimateWalkingMinutes(item.distanceM);
                const poiStyle = getPoiStyle(item.type);

                return (
                  <Card
                    key={item.id}
                    onPress={() => setSelectedPoi(item)}
                    style={[styles.poiCard, isSelected && styles.poiCardSelected]}
                    accessibilityLabel={`${item.name}, a ${formatDistance(item.distanceM)}, rumbo ${cardinal}`}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleBox}>
                        <View style={styles.typeBadgeRow}>
                          <Badge title={POI_LABEL[item.type] ?? item.type} />
                          <StatusPill
                            type={item.active ? 'online' : 'offline'}
                            label={item.active ? 'Disponible' : 'No disponible'}
                          />
                        </View>
                        <Text style={styles.poiName} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={[styles.bearingPill, { backgroundColor: poiStyle.bg + '20' }]}>
                        <Icon name="navigation" size={16} color={poiStyle.bg} />
                        <Text style={[styles.bearingText, { color: poiStyle.bg }]}>{cardinal}</Text>
                        <Text style={styles.bearingDegree}>{bearing}°</Text>
                      </View>
                    </View>

                    {item.address ? (
                      <View style={styles.addressRow}>
                        <Icon name="place" size={16} color={colors.outline} />
                        <Text style={styles.poiAddress}>{item.address}</Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <View style={styles.distanceBadge}>
                        <Icon name="directions_walk" size={16} color={brand.during} />
                        <Text style={styles.distanceMetric}>
                          {formatDistance(item.distanceM)} • ~{walkingMin} min a pie
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cardRouteBtn}
                        onPress={() => {
                          setSelectedPoi(item);
                          setRouteModalVisible(true);
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver ruta a ${item.name}`}
                      >
                        <Text style={styles.cardRouteBtnText}>Ruta</Text>
                        <Icon name="chevron_right" size={18} color={brand.espresso} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        ) : null}

        {/* Tarjeta Resumen: Puntos cercanos (del mockup oficial) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Puntos cercanos</Text>
              <Text style={styles.summarySubtitle}>A menos de 5 km · datos locales sin conexión</Text>
            </View>
            <View style={styles.updatedBadge}>
              <Text style={styles.updatedBadgeText}>OFFLINE</Text>
            </View>
          </View>

          {/* Fila 1: Zonas Seguras */}
          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => {
              setSelectedCategory('ZONA_SEGURA');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Zonas seguras, ${categoryCounts.ZONA_SEGURA} disponibles`}
          >
            <View style={styles.categoryRowLeft}>
              <View style={[styles.categoryIconCircle, { backgroundColor: 'rgba(61, 125, 84, 0.15)' }]}>
                <Icon name="check_circle" size={20} color={brand.prevention} filled />
              </View>
              <View style={styles.categoryTextCol}>
                <Text style={styles.categoryTitle}>Zonas seguras</Text>
                <Text style={styles.categoryDesc}>Parques amplios y explanadas</Text>
              </View>
            </View>
            <View style={styles.categoryRowRight}>
              <View style={[styles.countBadge, { backgroundColor: brand.prevention }]}>
                <Text style={styles.countBadgeText}>{categoryCounts.ZONA_SEGURA}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
            </View>
          </TouchableOpacity>

          {/* Fila 2: Albergues */}
          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => {
              setSelectedCategory('ALBERGUE');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Albergues, ${categoryCounts.ALBERGUE} disponibles`}
          >
            <View style={styles.categoryRowLeft}>
              <View style={[styles.categoryIconCircle, { backgroundColor: 'rgba(43, 100, 150, 0.15)' }]}>
                <Icon name="night_shelter" size={20} color={brand.after} filled />
              </View>
              <View style={styles.categoryTextCol}>
                <Text style={styles.categoryTitle}>Albergues</Text>
                <Text style={styles.categoryDesc}>Techo, asistencia médica y agua</Text>
              </View>
            </View>
            <View style={styles.categoryRowRight}>
              <View style={[styles.countBadge, { backgroundColor: brand.after }]}>
                <Text style={styles.countBadgeText}>{categoryCounts.ALBERGUE}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
            </View>
          </TouchableOpacity>

          {/* Fila 3: Centros de Acopio */}
          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => {
              setSelectedCategory('ACOPIO');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Centros de acopio, ${categoryCounts.ACOPIO} disponibles`}
          >
            <View style={styles.categoryRowLeft}>
              <View style={[styles.categoryIconCircle, { backgroundColor: 'rgba(254, 156, 67, 0.25)' }]}>
                <Icon name="location_on" size={20} color={colors.onSecondaryContainer} filled />
              </View>
              <View style={styles.categoryTextCol}>
                <Text style={styles.categoryTitle}>Centros de acopio</Text>
                <Text style={styles.categoryDesc}>Recepción de víveres e insumos</Text>
              </View>
            </View>
            <View style={styles.categoryRowRight}>
              <View style={[styles.countBadge, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[styles.countBadgeText, { color: colors.onSecondaryContainer }]}>
                  {categoryCounts.ACOPIO}
                </Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.outlineVariant} />
            </View>
          </TouchableOpacity>

          {/* Botón Maestro CTA: Cómo llegar al punto más seguro */}
          <TouchableOpacity
            style={styles.masterCtaBtn}
            onPress={() => {
              if (!selectedPoi && nearestSafeZone) {
                setSelectedPoi(nearestSafeZone);
              }
              setRouteModalVisible(true);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cómo llegar al punto más seguro"
          >
            <Icon name="directions" size={20} color={colors.onPrimary} />
            <Text style={styles.masterCtaText}>
              {selectedPoi
                ? `Cómo llegar a ${selectedPoi.name} (${formatDistance(selectedPoi.distanceM)})`
                : nearestSafeZone
                ? `Cómo llegar a ${nearestSafeZone.name} (${formatDistance(nearestSafeZone.distanceM)})`
                : 'Cómo llegar al punto más seguro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ficha Fija / Detalle del Punto Seleccionado */}
        {selectedPoi && (
          <View style={styles.poiDrawer}>
            <View style={styles.drawerTopRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Text style={styles.drawerTitle} numberOfLines={1}>
                  {selectedPoi.name}
                </Text>
                <Text style={styles.drawerCoords}>
                  Lat: {selectedPoi.lat.toFixed(4)}, Lon: {selectedPoi.lon.toFixed(4)}
                </Text>
                <Text style={[styles.drawerCoords, !selectedPoi.verified && { color: brand.during }]} numberOfLines={2}>
                  {selectedPoi.verified ? 'Fuente oficial' : 'Sin verificar'} · {selectedPoi.source ?? 'fuente no indicada'}
                </Text>
                {selectedPoi.note ? <Text style={styles.drawerCoords}>{selectedPoi.note}</Text> : null}
              </View>
              <View style={styles.drawerTopActions}>
                <StatusPill
                  type={selectedPoi.active ? 'online' : 'offline'}
                  label={selectedPoi.active ? 'Operativo' : 'Inhabilitado'}
                />
                <TouchableOpacity
                  onPress={() => setSelectedPoi(null)}
                  style={styles.drawerCloseBtn}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar detalle del punto"
                >
                  <Icon name="close" size={20} color={brand.espresso} />
                </TouchableOpacity>
              </View>
            </View>

            {selectedBearingInfo && (
              <View style={styles.drawerNavInfo}>
                <View style={styles.drawerNavStat}>
                  <Icon name="navigation" size={16} color={brand.espresso} />
                  <Text style={styles.drawerNavText}>
                    Rumbo: <Text style={styles.bold}>{selectedBearingInfo.cardinal} ({selectedBearingInfo.bearing}°)</Text>
                  </Text>
                </View>
                <View style={styles.drawerNavStat}>
                  <Icon name="directions_walk" size={16} color={brand.during} />
                  <Text style={styles.drawerNavText}>
                    <Text style={styles.bold}>{formatDistance(selectedPoi.distanceM)}</Text> (~{selectedBearingInfo.walkingMin} min)
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.drawerActions}>
              <Button
                title="Cómo llegar"
                variant="primary"
                onPress={() => setRouteModalVisible(true)}
                style={styles.drawerActionBtn}
              />
              <Button
                title="Reportar"
                variant="outline"
                onPress={() => setReportModalVisible(true)}
                style={styles.drawerActionBtn}
              />
            </View>
          </View>
        )}

        {/* Banner de Consejo Offline de Seguridad */}
        <View style={styles.offlineTipBanner}>
          <Icon name="offline_bolt" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.offlineTipText}>
            Los mapas de evacuación están guardados localmente para funcionar sin red celular en caso de colapso de torres.
          </Text>
        </View>
      </ScrollView>

      {/* Modal: Cómo llegar (Ruta estimada sin red) */}
      <Modal visible={routeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <Icon name="directions" size={24} color={brand.espresso} />
                <Text style={styles.modalTitle}>Ruta Estimada de Socorro</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRouteModalVisible(false)}
                style={styles.modalCloseBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <Icon name="close" size={22} color={brand.espresso} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Navegación directa sin conexión a internet</Text>

            {selectedPoi && selectedBearingInfo && (
              <View style={styles.routeBox}>
                <Text style={styles.routeDestination}>Destino: {selectedPoi.name}</Text>
                {selectedPoi.address ? (
                  <Text style={styles.routeAddress}>Dirección: {selectedPoi.address}</Text>
                ) : null}

                <View style={styles.routeStatsBox}>
                  <View style={styles.routeStat}>
                    <Text style={styles.routeStatVal}>{selectedBearingInfo.cardinal}</Text>
                    <Text style={styles.routeStatLabel}>Rumbo ({selectedBearingInfo.bearing}°)</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Text style={styles.routeStatVal}>{formatDistance(selectedPoi.distanceM)}</Text>
                    <Text style={styles.routeStatLabel}>Distancia recta</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Text style={styles.routeStatVal}>~{selectedBearingInfo.walkingMin} min</Text>
                    <Text style={styles.routeStatLabel}>Tiempo a pie</Text>
                  </View>
                </View>

                <View style={styles.routeInstruction}>
                  <Text style={styles.instructionTitle}>Indicaciones de evacuación:</Text>
                  <Text style={styles.instructionBody}>
                    1. Camina en dirección {selectedBearingInfo.cardinal} usando la brújula de tu teléfono.
                  </Text>
                  <Text style={styles.instructionBody}>
                    2. Mantente en vías principales amplias y aléjate de postes, muros agrietados y cables caídos.
                  </Text>
                  <Text style={styles.instructionBody}>
                    3. Al llegar al punto de encuentro, repórtate con el personal de Defensa Civil o brigadistas.
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Entendido / Volver al mapa"
              variant="primary"
              onPress={() => setRouteModalVisible(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: Reportar problema con este punto (RF-10 Flujo Alterno A2) */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <Icon name="warning" size={24} color={colors.panic} />
                <Text style={styles.modalTitle}>Reportar Punto de Socorro</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={styles.modalCloseBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
              >
                <Icon name="close" size={22} color={brand.espresso} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Ayuda a la comunidad informando el estado real de este lugar
            </Text>

            {selectedPoi && (
              <Text style={styles.reportPoiTarget}>Punto: {selectedPoi.name}</Text>
            )}

            <Text style={styles.inputLabel}>Motivo del reporte:</Text>
            <View style={styles.reasonRow}>
              <TouchableOpacity
                style={[styles.reasonChip, reportReason === 'NO_DISPONIBLE' && styles.reasonChipSelected]}
                onPress={() => setReportReason('NO_DISPONIBLE')}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: reportReason === 'NO_DISPONIBLE' }}
                accessibilityLabel="Inhabilitado o colapsado"
              >
                <Icon
                  name="block"
                  size={18}
                  color={reportReason === 'NO_DISPONIBLE' ? colors.panic : brand.espresso}
                />
                <Text style={[styles.reasonText, reportReason === 'NO_DISPONIBLE' && styles.reasonTextSelected]}>
                  Inhabilitado / Colapsado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reasonChip, reportReason === 'DIRECCION_ERRONEA' && styles.reasonChipSelected]}
                onPress={() => setReportReason('DIRECCION_ERRONEA')}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: reportReason === 'DIRECCION_ERRONEA' }}
                accessibilityLabel="Dirección errónea"
              >
                <Icon
                  name="wrong_location"
                  size={18}
                  color={reportReason === 'DIRECCION_ERRONEA' ? colors.panic : brand.espresso}
                />
                <Text style={[styles.reasonText, reportReason === 'DIRECCION_ERRONEA' && styles.reasonTextSelected]}>
                  Dirección Errónea
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reasonChip, reportReason === 'OTRO' && styles.reasonChipSelected]}
                onPress={() => setReportReason('OTRO')}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: reportReason === 'OTRO' }}
                accessibilityLabel="Otro problema"
              >
                <Icon
                  name="info"
                  size={18}
                  color={reportReason === 'OTRO' ? colors.panic : brand.espresso}
                />
                <Text style={[styles.reasonText, reportReason === 'OTRO' && styles.reasonTextSelected]}>
                  Otro Problema
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Detalle u observaciones (opcional):</Text>
            <TextInput
              style={styles.textInputArea}
              placeholder="Ej.: Acceso bloqueado por cables de alta tensión caídos en la entrada."
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={3}
              value={reportNote}
              onChangeText={setReportNote}
              accessible={true}
              accessibilityLabel="Observaciones del problema"
            />

            <View style={styles.modalButtonRow}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setReportModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Enviar Reporte"
                variant="danger"
                loading={isSubmittingReport}
                onPress={handleSubmitReport}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenEdgePadding,
    minHeight: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitles: {
    flexDirection: 'column',
  },
  headerEyebrow: {
    ...typography.scale.labelCaps,
    color: brand.during,
    textTransform: 'uppercase',
    letterSpacing: 0.88,
  },
  headerTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    lineHeight: 22,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 16,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedTop: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.sm,
    paddingBottom: 40,
    gap: spacing.md,
  },
  bannerContainer: {
    marginBottom: spacing.xxs,
  },
  quickActionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  quickActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    minHeight: touchTargets.min,
  },
  filterPillActive: {
    backgroundColor: brand.fill,
  },
  filterPillText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  modeTogglePill: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 17,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTogglePillActive: {
    backgroundColor: brand.during,
  },
  filterBar: {
    marginTop: -spacing.xs,
  },
  filterScroll: {
    gap: spacing.xs,
  },
  mapCard: {
    width: '100%',
    height: 370,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    position: 'relative',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  mapSvgContainer: {
    ...StyleSheet.absoluteFill,
  },
  gpsOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(253, 249, 242, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gpsPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.online,
  },
  gpsText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
  },
  mapControlsOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    gap: 6,
  },
  controlCircleBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 249, 242, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userLocationMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -32,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  userLocationWave: {
    ...StyleSheet.absoluteFill,
    borderRadius: 32,
    backgroundColor: 'rgba(32, 112, 232, 0.18)',
  },
  userLocationHalo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(32, 112, 232, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.auxiliary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pinAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinCircleSelected: {
    borderWidth: 2.5,
    borderColor: colors.surface,
    transform: [{ scale: 1.15 }],
  },
  pinTooltip: {
    position: 'absolute',
    bottom: 38,
    backgroundColor: brand.fill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pinTooltipText: {
    ...typography.scale.labelCaps,
    color: colors.onPrimary,
    fontSize: 10,
    maxWidth: 130,
  },
  bottomMapPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(253, 249, 242, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bottomMapPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bottomMapPillLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  bottomMapPillValue: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  summaryTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  summarySubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  updatedBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  updatedBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onTertiaryContainer,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: touchTargets.min,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  categoryDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  categoryRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    ...typography.scale.labelMd,
    color: brand.onPhase,
    fontWeight: '700',
  },
  masterCtaBtn: {
    width: '100%',
    minHeight: 52,
    backgroundColor: brand.fill,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.md,
  },
  masterCtaText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
  },
  offlineTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  offlineTipText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  listContainer: {
    gap: spacing.xs,
  },
  poiCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  poiCardSelected: {
    borderColor: brand.during,
    borderWidth: 2,
    backgroundColor: colors.secondaryContainer,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: spacing.sm,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  poiName: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  bearingPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: 2,
  },
  bearingText: {
    ...typography.scale.labelMd,
    fontWeight: '700',
  },
  bearingDegree: {
    ...typography.scale.bodySm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  poiAddress: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceMetric: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    fontWeight: '600',
  },
  cardRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  cardRouteBtnText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  poiDrawer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    gap: spacing.xs,
  },
  drawerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  drawerCoords: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  drawerNavInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xxs,
  },
  drawerNavStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drawerNavText: {
    ...typography.scale.bodySm,
    color: brand.espresso,
  },
  bold: {
    fontWeight: '700',
    color: brand.espresso,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  drawerActionBtn: {
    flex: 1,
    minHeight: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 29, 19, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: brand.cream,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  routeBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
  },
  routeDestination: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  routeAddress: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  routeStatsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatVal: {
    ...typography.scale.headlineSm,
    color: brand.during,
    fontWeight: '800',
  },
  routeStatLabel: {
    ...typography.scale.bodySm,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  routeInstruction: {
    marginTop: spacing.xs,
  },
  instructionTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    marginBottom: spacing.xxs,
  },
  instructionBody: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xxs,
    lineHeight: 18,
  },
  reportPoiTarget: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
  },
  reasonRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: colors.surface,
    minHeight: touchTargets.min,
  },
  reasonChipSelected: {
    borderColor: colors.panic,
    backgroundColor: colors.panicContainer,
  },
  reasonText: {
    ...typography.scale.bodyMd,
    color: brand.espresso,
  },
  reasonTextSelected: {
    color: colors.panic,
    fontWeight: '700',
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    color: brand.espresso,
    ...typography.scale.bodyMd,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
  },
});
