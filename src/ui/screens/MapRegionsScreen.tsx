import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useServices } from '../hooks/useServices';
import type { TileRegion } from '../../contracts/map';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export function MapRegionsScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { tiles } = useServices();

  const [regions, setRegions] = useState<TileRegion[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    try {
      const list = await tiles.listRegions();
      setRegions(list);
    } catch (err) {
      console.warn('[MapRegionsScreen] Error al listar regiones:', err);
    }
  }, [tiles]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const handleDownload = async (region: TileRegion) => {
    try {
      setErrorMessage(null);
      setDownloadingId(region.id);
      setProgressPct(0);

      await tiles.download(region.id, (pct) => {
        setProgressPct(pct);
      });

      Alert.alert(
        'Descarga Completada',
        `El mapa vectorial de "${region.name}" está listo para usar sin internet.`
      );
      await loadRegions();
    } catch (err: any) {
      const msg =
        err?.code === 'NETWORK_UNAVAILABLE'
          ? 'No hay conexión a internet disponible para descargar mapas vectoriales. Intenta nuevamente cuando tengas Wi-Fi o datos.'
          : 'Ocurrió un error al descargar el mapa.';
      setErrorMessage(msg);
      Alert.alert('Descarga Fallida', msg);
    } finally {
      setDownloadingId(null);
      setProgressPct(0);
    }
  };

  const handleRemove = (region: TileRegion) => {
    Alert.alert(
      'Eliminar Mapa Offline',
      `¿Deseas liberar ${region.sizeMB} MB eliminando el mapa de "${region.name}"? Los puntos de socorro seguirán disponibles en modo lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tiles.remove(region.id);
              await loadRegions();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el paquete.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Cabecera dominante en Dark Espresso según DESIGN.md */}
      <ScreenHeader
        title="Mapas Offline"
        eyebrow="MAPA VECTORIAL SIN CONEXIÓN"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Cartografía Vectorial</Text>
          <Text style={styles.subtitle}>
            Descarga los mapas de tu región antes de una emergencia para navegar sin señal celular ni datos móviles.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.bannerContainer}>
            <Banner
              kind="warning"
              title="Aviso de Descarga"
              message={errorMessage}
              actionText="Cerrar"
              onAction={() => setErrorMessage(null)}
            />
          </View>
        )}

        {/* Lista de regiones disponibles */}
        <View style={styles.regionsList}>
          {regions.map((region) => {
            const isDownloading = downloadingId === region.id;

            return (
              <Card key={region.id} style={styles.regionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.regionIconBadge}>
                    <Icon
                      name={region.downloaded ? 'map' : 'download_for_offline'}
                      size={24}
                      color={region.downloaded ? brand.prevention : brand.during}
                      filled={region.downloaded}
                    />
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.regionName}>{region.name}</Text>
                    <Text style={styles.regionMeta}>
                      Tamaño: {region.sizeMB} MB • Versión: {region.version}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPillBadge,
                      region.downloaded ? styles.statusDownloaded : styles.statusPending,
                    ]}
                  >
                    <Icon
                      name={region.downloaded ? 'check_circle' : 'cloud_off'}
                      size={14}
                      color={region.downloaded ? colors.onTertiaryContainer : colors.onSurfaceVariant}
                      filled={region.downloaded}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        region.downloaded ? styles.statusDownloadedText : styles.statusPendingText,
                      ]}
                    >
                      {region.downloaded ? 'Descargado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>

                {isDownloading ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progressPct}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.progressTextRow}>
                      <Icon name="sync" size={14} color={brand.during} />
                      <Text style={styles.progressText}>
                        Descargando mapa vectorial: {progressPct}%
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardActions}>
                    {region.downloaded ? (
                      // El mapa viene dentro de la app: no hay nada que liberar. Se informa en vez de ofrecer un botón que no hace nada.
                      <View style={styles.deleteBtn} accessible accessibilityLabel="Mapa incluido en la aplicación, siempre disponible sin conexión">
                        <Icon name="offline_pin" size={18} color={brand.prevention} />
                        <Text style={[styles.deleteBtnText, { color: brand.prevention }]}>Incluido en la app · siempre disponible</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={() => handleDownload(region)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Descargar mapa de ${region.name}, ${region.sizeMB} megabytes`}
                      >
                        <Icon name="download" size={18} color={colors.onPrimary} />
                        <Text style={styles.downloadBtnText}>
                          Descargar ({region.sizeMB} MB)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* Tarjeta Informativa de Almacenamiento */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconCircle}>
              <Icon name="lightbulb" size={20} color={brand.during} filled />
            </View>
            <Text style={styles.infoTitle}>Información de Almacenamiento</Text>
          </View>
          <Text style={styles.infoBody}>
            El mapa de Bogotá viaja dentro de la aplicación (formato PMTiles, hasta zoom 15) y se dibuja sin conexión. Datos © OpenStreetMap, teselas de Protomaps.
          </Text>
          <Text style={styles.infoBody}>
            Incluso sin mapa descargado, EarthQuakeTracker siempre podrá calcular tu distancia en línea recta y el rumbo de brújula hacia el punto de socorro más cercano.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.cream,
  },
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  titleSection: {
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
  },
  subtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
    lineHeight: 20,
  },
  bannerContainer: {
    marginBottom: spacing.xxs,
  },
  regionsList: {
    gap: spacing.sm,
  },
  regionCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  regionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  regionName: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  regionMeta: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusDownloaded: {
    backgroundColor: colors.tertiaryContainer,
  },
  statusPending: {
    backgroundColor: colors.surfaceVariant,
  },
  statusText: {
    ...typography.scale.labelCaps,
  },
  statusDownloadedText: {
    color: colors.onTertiaryContainer,
  },
  statusPendingText: {
    color: colors.onSurfaceVariant,
  },
  progressContainer: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: brand.during,
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressText: {
    ...typography.scale.bodySm,
    color: brand.during,
    fontWeight: '700',
  },
  cardActions: {
    marginTop: spacing.xs,
  },
  downloadBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  downloadBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
  },
  deleteBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: brand.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  deleteBtnText: {
    ...typography.scale.labelLg,
    color: colors.panic,
  },
  infoCard: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  infoBody: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
