import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { Badge, LevelStatus } from '../../contracts/progress';

interface BadgeDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'ORO' | 'PLATA' | 'BRONCE';
}

const BADGE_CATALOG: BadgeDefinition[] = [
  {
    code: 'PRIMERA_GUIA',
    title: 'Primera Guía Leída',
    description: 'Completaste la lectura íntegra de tu primera guía oficial de autoprotección.',
    icon: 'auto_stories',
    tier: 'BRONCE',
  },
  {
    code: 'NIVEL_1',
    title: 'Conceptos Básicos',
    description: 'Aprobaste el Nivel 1 del quiz con una puntuación mayor o igual al 70%.',
    icon: 'verified_user',
    tier: 'BRONCE',
  },
  {
    code: 'NIVEL_2',
    title: 'Mitigación y Evacuación',
    description: 'Aprobaste el Nivel 2 del quiz con una puntuación mayor o igual al 70%.',
    icon: 'shield',
    tier: 'PLATA',
  },
  {
    code: 'NIVEL_3',
    title: 'Rescate y Primeros Auxilios',
    description: 'Aprobaste el Nivel 3 avanzado demostrando alta preparación comunitaria.',
    icon: 'military_tech',
    tier: 'ORO',
  },
  {
    code: 'PERFECTO',
    title: 'Puntuación Perfecta',
    description: 'Respondiste el 100% de las preguntas de un nivel de quiz sin cometer ningún error.',
    icon: 'star',
    tier: 'ORO',
  },
  {
    code: 'PLAN_FAMILIAR_LISTO',
    title: 'Plan Familiar Listo',
    description: 'Completaste todos los acuerdos, puntos de encuentro y roles de tu hogar.',
    icon: 'diversity_3',
    tier: 'PLATA',
  },
  {
    code: 'MOCHILA_COMPLETA',
    title: 'Mochila 72h Lista',
    description: 'Reuniste todos los insumos vitales indispensables en tu mochila de 3 días.',
    icon: 'medical_services',
    tier: 'ORO',
  },
];

export function AchievementsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { progress } = useServices();

  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [, setLevelStatuses] = useState<LevelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const loadProgress = async () => {
    setLoading(true);
    try {
      if (progress) {
        const [badges, statuses] = await Promise.all([
          progress.listBadges(),
          progress.getLevelStatus(),
        ]);
        setEarnedBadges(badges);
        setLevelStatuses(statuses);
      }
    } catch (err) {
      console.warn('[AchievementsScreen] Error al cargar logros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [progress]);

  const handleResetProgress = () => {
    Alert.alert(
      'Restablecer todo el progreso',
      '¿Deseas borrar tus puntuaciones, intentos de quiz e insignias obtenidas? Esta acción cumple con la política de Habeas Data y eliminación de información (ISO A.8.10).',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar progreso',
          style: 'destructive',
          onPress: async () => {
            try {
              if (progress) {
                await progress.resetAll();
                await loadProgress();
                setBannerNotice('Todo tu progreso ha sido eliminado correctamente.');
                setTimeout(() => setBannerNotice(null), 5000);
              }
            } catch (err) {
              console.warn('[AchievementsScreen] Error al restablecer progreso:', err);
            }
          },
        },
      ]
    );
  };

  const earnedCodes = new Set(earnedBadges.map((b) => b.code));
  const completionPercentage = Math.round((earnedCodes.size / BADGE_CATALOG.length) * 100);

  const userRank =
    earnedCodes.size >= 6
      ? 'Brigadista Maestro Comunitario'
      : earnedCodes.size >= 4
      ? 'Brigadista Activo de Cuadrante'
      : earnedCodes.size >= 2
      ? 'Ciudadano Preparado'
      : 'Novato en Autoprotección';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScreenHeader
        title="Vitrina de Logros"
        eyebrow="GAMIFICACIÓN · RESILIENCIA"
        tone="plain"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {bannerNotice ? (
          <View style={styles.bannerSpacing}>
            <Banner kind="info" title="Progreso restablecido" message={bannerNotice} />
          </View>
        ) : null}

        {/* Hero Card de Rango & Progreso */}
        <Card style={styles.rankHeroCard}>
          <View style={styles.rankHeaderRow}>
            <View style={styles.rankAvatar}>
              <Icon name="military_tech" size={26} color={brand.espresso} filled />
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankEyebrow}>Rango de Preparación</Text>
              <Text style={styles.rankTitle}>{userRank}</Text>
            </View>
            <View style={styles.rankBadgeCount}>
              <Icon name="workspace_premium" size={16} color={brand.during} filled />
              <Text style={styles.rankBadgeCountText}>{earnedCodes.size} Insignias</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Progreso de Desbloqueo</Text>
              <Text style={styles.progressPercent}>
                {earnedCodes.size} / {BADGE_CATALOG.length} ({completionPercentage}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
            </View>
          </View>
        </Card>

        {/* Encabezado de la Sección de Insignias */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="workspace_premium" size={22} color={brand.espresso} filled />
            <Text style={styles.sectionTitle}>Insignias de Resiliencia (RF-03)</Text>
          </View>
          <Text style={styles.sectionCountText}>
            {earnedCodes.size} / {BADGE_CATALOG.length} Obtenidas
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={brand.espresso} />
            <Text style={styles.loadingText}>Consultando credenciales...</Text>
          </View>
        ) : (
          <View style={styles.badgesGrid}>
            {BADGE_CATALOG.map((item) => {
              const isEarned = earnedCodes.has(item.code);
              const earnedRecord = earnedBadges.find((b) => b.code === item.code);

              let iconBg = colors.surfaceVariant;
              let iconColor = colors.outline;
              let tierColor = colors.outline;

              if (isEarned) {
                if (item.tier === 'ORO') {
                  iconBg = colors.secondaryContainer;
                  iconColor = colors.onSecondaryContainer;
                  tierColor = brand.during;
                } else if (item.tier === 'PLATA') {
                  iconBg = colors.tertiaryContainer;
                  iconColor = colors.onSuccessContainer;
                  tierColor = colors.tertiary;
                } else {
                  iconBg = colors.surfaceVariant;
                  iconColor = brand.espresso;
                  tierColor = brand.espresso;
                }
              }

              return (
                <View
                  key={item.code}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`Insignia ${item.title}: ${isEarned ? `${item.tier}, obtenida` : 'bloqueada'}. ${item.description}`}
                  style={[
                    styles.badgeGridItem,
                    isEarned ? styles.badgeItemUnlocked : styles.badgeItemLocked,
                  ]}
                >
                  {/* Ícono circular grande */}
                  <View style={[styles.badgeCircle, { backgroundColor: iconBg }]}>
                    <Icon
                      name={isEarned ? item.icon : 'lock'}
                      size={28}
                      color={iconColor}
                      filled={isEarned}
                    />
                    {isEarned ? (
                      <View style={styles.badgeCheckPill}>
                        <Icon name="check" size={12} color={colors.onSuccessContainer} />
                      </View>
                    ) : null}
                  </View>

                  {/* Título y descripción */}
                  <Text style={[styles.badgeItemTitle, !isEarned && styles.badgeTextMuted]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.badgeItemDesc, !isEarned && styles.badgeTextMuted]} numberOfLines={3}>
                    {item.description}
                  </Text>

                  {/* Chapa de asignación */}
                  <View style={styles.badgeTierPill}>
                    <Text
                      style={[styles.badgeTierText, { color: tierColor }]}
                      numberOfLines={2}
                    >
                      {isEarned ? `${item.tier} • ASIGNADA` : 'BLOQUEADA'}
                    </Text>
                  </View>

                  {isEarned && earnedRecord?.awardedAt ? (
                    <Text style={styles.awardedDateText}>
                      {new Date(earnedRecord.awardedAt).toLocaleDateString('es-CO')}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Garantía de Almacenamiento Local (Mockup Callout) */}
        <View style={styles.storageCallout}>
          <Icon name="database" size={20} color={colors.outline} />
          <Text style={styles.storageCalloutText}>
            Tus credenciales, insignias y progreso se almacenan en almacenamiento persistente local en tu dispositivo móvil.
          </Text>
        </View>

        {/* Sección Habeas Data / Eliminación de Datos (ISO A.8.10) */}
        <Card style={styles.legalCard}>
          <View style={styles.legalHeaderRow}>
            <Icon name="security" size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.legalTitle}>Eliminación de Datos (ISO A.8.10)</Text>
          </View>
          <Text style={styles.legalDesc}>
            Tienes derecho a borrar tu historial de evaluaciones e insignias almacenadas en este dispositivo. Esta operación no se puede deshacer.
          </Text>
          <Button
            title="Restablecer y borrar progreso"
            variant="danger"
            onPress={handleResetProgress}
            style={styles.resetBtn}
            accessibilityLabel="Restablecer todo el progreso y borrar insignias"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screenEdgePadding,
    paddingBottom: spacing.space3xl,
  },
  bannerSpacing: {
    marginBottom: spacing.sm,
  },
  rankHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  rankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankEyebrow: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  rankTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    marginTop: 2,
  },
  rankBadgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  rankBadgeCountText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...typography.scale.labelMd,
    color: colors.onSurfaceVariant,
  },
  progressPercent: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    padding: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: brand.during,
    borderRadius: borderRadius.full,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 16,
  },
  sectionCountText: {
    ...typography.scale.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.scale.bodyMd,
    color: colors.outline,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  badgeGridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: spacing.xs,
  },
  badgeItemUnlocked: {
    borderColor: brand.border,
  },
  badgeItemLocked: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.7,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
  },
  badgeCheckPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.successContainer,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeItemTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 17,
  },
  badgeItemDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontSize: 11,
  },
  badgeTextMuted: {
    color: colors.outline,
  },
  badgeTierPill: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    maxWidth: '100%',
  },
  badgeTierText: {
    ...typography.scale.labelCaps,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  awardedDateText: {
    ...typography.scale.labelCaps,
    color: colors.outline,
    fontSize: 9,
    marginTop: 2,
  },
  storageCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  storageCalloutText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  legalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    borderWidth: 1,
    borderColor: brand.border,
  },
  legalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xxs,
  },
  legalTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  legalDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  resetBtn: {
    minHeight: touchTargets.min,
    width: '100%',
  },
});
