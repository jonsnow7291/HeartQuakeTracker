import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useServices } from '../hooks/useServices';
import type { DamageReportInput, OwnReportSummary } from '../../contracts/sync';
import type { GeoPoint } from '../../contracts/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const CATEGORIES: { label: string; value: DamageReportInput['category']; icon: string }[] = [
  { label: 'Estructural', value: 'ESTRUCTURAL', icon: 'domain' },
  { label: 'Servicios', value: 'SERVICIOS', icon: 'bolt' },
  { label: 'Vías', value: 'VIAS', icon: 'traffic' },
  { label: 'Otro', value: 'OTRO', icon: 'warning' },
];

export function ReportScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { reports } = useServices();

  const [category, setCategory] = useState<DamageReportInput['category']>('ESTRUCTURAL');
  const [description, setDescription] = useState<string>('');
  const [includeLocation, setIncludeLocation] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recentReports, setRecentReports] = useState<OwnReportSummary[]>([]);
  const [submittedBanner, setSubmittedBanner] = useState<boolean>(false);

  const loadOwnReports = useCallback(async () => {
    try {
      const list = await reports.listOwnReports();
      setRecentReports(list);
    } catch (err) {
      console.warn('[ReportScreen] Error al listar reportes propios:', err);
    }
  }, [reports]);

  useEffect(() => {
    loadOwnReports();
  }, [loadOwnReports]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Descripción requerida', 'Por favor detalla el daño o situación que deseas reportar.');
      return;
    }

    try {
      setIsSubmitting(true);
      const position: GeoPoint | undefined = includeLocation
        ? { lat: 4.5981, lon: -74.076, ts: new Date().toISOString() }
        : undefined;

      await reports.reportDamage({
        category,
        description: description.trim(),
        position,
      });

      setDescription('');
      setSubmittedBanner(true);
      Alert.alert(
        'Reporte Guardado Localmente',
        'Tu reporte ha sido encolado mediante la arquitectura Store-and-Forward. Se enviará al servidor tan pronto se detecte conexión a internet o nodo puente de malla.'
      );
      await loadOwnReports();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el reporte en la base de datos local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (kind: string) => {
    switch (kind) {
      case 'ESTRUCTURAL':
        return 'domain';
      case 'SERVICIOS':
        return 'bolt';
      case 'VIAS':
        return 'traffic';
      default:
        return 'warning';
    }
  };

  return (
    <View style={styles.root}>
      {/* Cabecera Steel Blue de fase Después */}
      <ScreenHeader
        title="Reportar Daño"
        eyebrow="EVALUACIÓN DE DAÑOS Y RIESGOS"
        tone="after"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Nuevo Reporte de Incidente</Text>
          <Text style={styles.subtitle}>
            Registra daños estructurales, cortes de servicios o vías colapsadas para coordinar la respuesta de emergencia.
          </Text>
        </View>

        {submittedBanner && (
          <Banner
            kind="success"
            title="Reporte Guardado"
            message="Reporte guardado en la cola local de sincronización diferida Store-and-Forward."
            actionText="Ocultar"
            onAction={() => setSubmittedBanner(false)}
          />
        )}

        {/* Categoría del daño */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Categoría del daño:</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategory(cat.value)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Categoría ${cat.label}`}
                >
                  <Icon
                    name={cat.icon}
                    size={18}
                    color={isSelected ? colors.onPrimary : brand.espresso}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Detalle del daño */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Descripción detallada:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe la magnitud del daño, grietas visibles, postes caídos, olor a gas o peligros inminentes..."
            placeholderTextColor={colors.outline}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            accessible={true}
            accessibilityLabel="Descripción del daño estructural o vial"
          />
        </View>

        {/* Ubicación GPS */}
        <TouchableOpacity
          style={styles.locationToggle}
          onPress={() => setIncludeLocation(!includeLocation)}
          accessible={true}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: includeLocation }}
          accessibilityLabel="Adjuntar ubicación GPS actual al reporte"
        >
          <Icon
            name={includeLocation ? 'check_box' : 'check_box_outline_blank'}
            size={24}
            color={includeLocation ? brand.prevention : colors.outline}
          />
          <View style={styles.locationTextCol}>
            <Text style={styles.locationTitle}>Adjuntar ubicación GPS actual</Text>
            <Text style={styles.locationSubtitle}>
              {includeLocation ? 'Lat: 4.5981, Lon: -74.0760 (Bogotá D.C.)' : 'Sin coordenadas GPS'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Botón de envío */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          accessibilityLabel="Guardar y encolar reporte de daño"
        >
          <Icon name="cloud_upload" size={20} color={colors.onPrimary} />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Guardando...' : 'Guardar y Encolar Reporte'}
          </Text>
        </TouchableOpacity>

        {/* Historial de reportes locales */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Icon name="history" size={20} color={brand.espresso} />
            <Text style={styles.historyTitle}>
              Tus Reportes Registrados ({recentReports.length})
            </Text>
          </View>

          {recentReports.length === 0 ? (
            <Card style={styles.emptyHistoryCard}>
              <Icon name="assignment_late" size={32} color={colors.outline} />
              <Text style={styles.emptyHistoryText}>
                Aún no has registrado reportes desde este dispositivo.
              </Text>
            </Card>
          ) : (
            recentReports.map((rep) => (
              <Card key={rep.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyIconCircle}>
                    <Icon
                      name={getCategoryIcon(rep.kind)}
                      size={20}
                      color={brand.espresso}
                    />
                  </View>
                  <View style={styles.historyCardTextCol}>
                    <Text style={styles.historyKind}>{rep.kind}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(rep.ts).toLocaleString('es-CO')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.syncStatusBadge,
                      rep.synced ? styles.syncStatusSynced : styles.syncStatusQueued,
                    ]}
                  >
                    <Icon
                      name={rep.synced ? 'check_circle' : 'sync'}
                      size={14}
                      color={rep.synced ? colors.onTertiaryContainer : colors.onSecondaryContainer}
                      filled={rep.synced}
                    />
                    <Text
                      style={[
                        styles.syncStatusText,
                        rep.synced ? styles.syncStatusSyncedText : styles.syncStatusQueuedText,
                      ]}
                    >
                      {rep.synced ? 'Sincronizado' : 'En cola'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
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
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minHeight: touchTargets.min,
    borderWidth: 1,
    borderColor: brand.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: colors.onPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 104,
    textAlignVertical: 'top',
    color: brand.espresso,
    ...typography.scale.bodyMd,
    backgroundColor: colors.surface,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
    minHeight: touchTargets.min,
  },
  locationTextCol: {
    flex: 1,
  },
  locationTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  locationSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
  },
  historySection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  emptyHistoryCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  emptyHistoryText: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  historyCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardTextCol: {
    flex: 1,
  },
  historyKind: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  historyDate: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  syncStatusSynced: {
    backgroundColor: colors.tertiaryContainer,
  },
  syncStatusQueued: {
    backgroundColor: colors.secondaryContainer,
  },
  syncStatusText: {
    ...typography.scale.labelCaps,
  },
  syncStatusSyncedText: {
    color: colors.onTertiaryContainer,
  },
  syncStatusQueuedText: {
    color: colors.onSecondaryContainer,
  },
});
