import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorState } from '../components/ErrorState';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { QuizLevel } from '../../contracts/content';
import type { LevelStatus, QuizAttempt } from '../../contracts/progress';

export function QuizLevelsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { content, progress } = useServices();

  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [levelStatuses, setLevelStatuses] = useState<LevelStatus[]>([]);
  const [partials, setPartials] = useState<Record<string, QuizAttempt | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLevels = async () => {
    setLoading(true);
    setError(null);
    try {
      if (content && progress) {
        const [bank, statuses] = await Promise.all([
          content.getQuizBank(),
          progress.getLevelStatus(),
        ]);

        setLevels(bank.levels);
        setLevelStatuses(statuses);

        const partialMap: Record<string, QuizAttempt | null> = {};
        for (const lvl of bank.levels) {
          const part = await progress.getPartial(lvl.id);
          partialMap[lvl.id] = part;
        }
        setPartials(partialMap);
      }
    } catch (err: unknown) {
      console.warn('[QuizLevelsScreen] Error al cargar niveles:', err);
      setError('No se pudo cargar el banco de preguntas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLevels();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, progress]),
  );

  const completedCount = levelStatuses.filter((s) => s.completed).length;
  const totalScore = levelStatuses.reduce((acc, s) => acc + (s.bestScore || 0), 0);
  const userXP = totalScore * 50;
  const maxPossibleXP = levels.reduce((acc, l) => acc + l.questions.length * 50, 0) || 1000;
  const xpPercentage = Math.min(100, Math.round((userXP / maxPossibleXP) * 100));

  const userRankTitle =
    completedCount >= 3
      ? 'Nivel 3: Brigadista Comunitario'
      : completedCount >= 2
      ? 'Nivel 2: Mitigador Activo'
      : completedCount >= 1
      ? 'Nivel 1: Ciudadano Preparado'
      : 'Nivel 0: Novato en Prevención';

  const getModuleIcon = (index: number) => {
    switch (index) {
      case 0:
        return 'backpack';
      case 1:
        return 'domain';
      case 2:
        return 'visibility_off';
      default:
        return 'medical_services';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScreenHeader
        title="Academia Sísmica"
        eyebrow="FASE 1 · PREVENCIÓN"
        tone="plain"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.headerBadgeBtn}
            onPress={() => navigation.navigate('Achievements')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ver insignias y logros obtenidos"
          >
            <Icon name="workspace_premium" size={22} color={brand.espresso} filled />
            <Text style={styles.headerBadgeText}>Insignias</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Chips superiores de estado offline y racha */}
        <View style={styles.topStatusRow}>
          <View style={styles.offlineChip}>
            <Icon name="cloud_off" size={14} color={colors.tertiaryContainer} filled />
            <Text style={styles.offlineChipText}>MODO OFFLINE LOCAL • SQLITE SYNC</Text>
          </View>
          <View style={styles.streakChip}>
            <Icon name="local_fire_department" size={16} color={brand.during} filled />
            <Text style={styles.streakChipText}>5 Días Racha</Text>
          </View>
        </View>

        {/* Título y subtítulo institucional */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Academia Sísmica • Aprende Jugando</Text>
          <Text style={styles.heroSubtitle}>
            Retos y simulaciones interactivas 100% disponibles sin conexión a internet.
          </Text>
        </View>

        {/* Tarjeta de Rango y Experiencia (XP) */}
        <Card style={styles.xpCard}>
          <View style={styles.xpHeaderRow}>
            <View style={styles.xpAvatar}>
              <Icon name="military_tech" size={24} color={brand.espresso} filled />
            </View>
            <View style={styles.xpInfo}>
              <Text style={styles.xpRankLabel}>Rango de Preparación</Text>
              <Text style={styles.xpRankTitle}>{userRankTitle}</Text>
            </View>
            <Text style={styles.xpValue}>{userXP} XP</Text>
          </View>

          <View style={styles.xpProgressBlock}>
            <View style={styles.xpProgressLabelRow}>
              <Text style={styles.xpProgressLabel}>Progreso de Nivel</Text>
              <Text style={styles.xpProgressCount}>
                {userXP} / {maxPossibleXP} XP ({xpPercentage}%)
              </Text>
            </View>
            <View style={styles.xpProgressBarTrack}>
              <View style={[styles.xpProgressBarFill, { width: `${xpPercentage}%` }]} />
            </View>
          </View>
        </Card>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={brand.espresso} />
            <Text style={styles.loadingText}>Cargando niveles formativos...</Text>
          </View>
        ) : error ? (
          <ErrorState code="UNKNOWN" customMessage={error} onRetry={loadLevels} />
        ) : (
          <View style={styles.modulesSection}>
            {/* Cabecera de la sección Módulos Formativos */}
            <View style={styles.modulesSectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="menu_book" size={20} color={brand.espresso} />
                <Text style={styles.sectionTitle}>Módulos Formativos</Text>
              </View>
              <Text style={styles.sectionCounter}>
                {completedCount}/{levels.length} Completados
              </Text>
            </View>

            {/* Lista de niveles / módulos */}
            <View style={styles.levelsList}>
              {levels.map((lvl, index) => {
                const status = levelStatuses.find((s) => s.levelId === lvl.id);
                const isUnlocked = index === 0 || (status ? status.unlocked : false);
                const isCompleted = status?.completed ?? false;
                const bestScore = status?.bestScore ?? 0;
                const totalQ = lvl.questions.length;
                const hasPartial = partials[lvl.id] !== null && partials[lvl.id] !== undefined;
                const scorePercent = totalQ > 0 ? Math.round((bestScore / totalQ) * 100) : 0;
                const moduleIconName = getModuleIcon(index);

                return (
                  <Card
                    key={lvl.id}
                    style={[
                      styles.moduleCard,
                      !isUnlocked && styles.moduleCardLocked,
                    ]}
                  >
                    <View style={styles.moduleRow}>
                      {/* Ícono de módulo */}
                      <View
                        style={[
                          styles.moduleIconBox,
                          !isUnlocked
                            ? styles.moduleIconBoxLocked
                            : isCompleted
                            ? styles.moduleIconBoxCompleted
                            : hasPartial
                            ? styles.moduleIconBoxPartial
                            : styles.moduleIconBoxActive,
                        ]}
                      >
                        <Icon
                          name={!isUnlocked ? 'lock' : moduleIconName}
                          size={24}
                          color={
                            !isUnlocked
                              ? colors.outline
                              : isCompleted
                              ? colors.onSuccessContainer
                              : hasPartial
                              ? brand.during
                              : brand.espresso
                          }
                          filled={isCompleted}
                        />
                      </View>

                      {/* Detalles del módulo */}
                      <View style={styles.moduleDetails}>
                        <Text
                          style={[
                            styles.moduleTitle,
                            !isUnlocked && styles.moduleTitleLocked,
                          ]}
                          numberOfLines={2}
                        >
                          {lvl.title}
                        </Text>

                        {/* Estado y estrellas */}
                        <View style={styles.moduleMetaRow}>
                          {isCompleted ? (
                            <View style={styles.completedMeta}>
                              <Text style={styles.completedText}>
                                {scorePercent >= 100 ? '100% SUPERADO' : `${scorePercent}% APROBADO`}
                              </Text>
                              <View style={styles.starsRow}>
                                <Icon name="star" size={15} color={brand.during} filled />
                                <Icon name="star" size={15} color={brand.during} filled={scorePercent >= 70} />
                                <Icon name="star" size={15} color={brand.during} filled={scorePercent >= 100} />
                              </View>
                            </View>
                          ) : hasPartial ? (
                            <View style={styles.partialMeta}>
                              <View style={styles.partialTrack}>
                                <View style={styles.partialFill} />
                              </View>
                              <Text style={styles.partialText}>INTENTO EN PAUSA</Text>
                            </View>
                          ) : isUnlocked ? (
                            <Text style={styles.unlockedSubtext}>{totalQ} preguntas oficiales</Text>
                          ) : (
                            <Text style={styles.lockedSubtext}>
                              BLOQUEADO • REQUIERE NIVEL ANTERIOR (70%)
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Botón de acción */}
                      <View style={styles.moduleActionBox}>
                        {isUnlocked ? (
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              hasPartial ? styles.actionBtnPartial : styles.actionBtnPrimary,
                            ]}
                            onPress={() => navigation.navigate('Quiz', { levelId: lvl.id })}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={
                              hasPartial
                                ? `Continuar nivel: ${lvl.title}`
                                : `Comenzar Nivel: ${lvl.title}`
                            }
                          >
                            <Text style={styles.actionBtnText}>
                              {hasPartial ? 'Continuar nivel' : 'Comenzar Nivel'}
                            </Text>
                            <Icon
                              name={hasPartial ? 'play_arrow' : 'arrow_forward'}
                              size={16}
                              color={colors.onPrimary}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.lockIconBox}>
                             <Icon name="lock" size={20} color={colors.outline} />
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* Acceso directo a Insignias de Resiliencia */}
        <TouchableOpacity
          style={styles.achievementsShortcutCard}
          onPress={() => navigation.navigate('Achievements')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Abrir vitrina de insignias de resiliencia"
        >
          <View style={styles.shortcutIconBox}>
            <Icon name="workspace_premium" size={24} color={brand.during} filled />
          </View>
          <View style={styles.shortcutInfo}>
            <Text style={styles.shortcutTitle}>Insignias de Resiliencia (RF-03)</Text>
            <Text style={styles.shortcutSubtitle}>
              Revisa tus medallas ganadas en simulacros y trivias oficiales.
            </Text>
          </View>
           <Icon name="chevron_right" size={24} color={colors.outline} />
        </TouchableOpacity>

        {/* Callout de almacenamiento local */}
        <View style={styles.storageCallout}>
          <Icon name="database" size={18} color={colors.outline} />
          <Text style={styles.storageCalloutText}>
            Tus evaluaciones y progreso se almacenan en almacenamiento persistente local en tu dispositivo móvil (ISO A.8.10).
          </Text>
        </View>
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
  headerBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: brand.sand,
  },
  headerBadgeText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successContainer,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  offlineChipText: {
    ...typography.scale.labelCaps,
    color: colors.onSuccessContainer,
    letterSpacing: 0.8,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  streakChipText: {
    ...typography.scale.labelMd,
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
  heroSection: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  xpCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginBottom: spacing.lg,
    borderColor: brand.border,
    borderWidth: 1,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpInfo: {
    flex: 1,
  },
  xpRankLabel: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  xpRankTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    marginTop: 2,
  },
  xpValue: {
    ...typography.scale.labelLg,
    color: brand.during,
    fontWeight: '800',
    fontSize: 16,
  },
  xpProgressBlock: {
    marginTop: spacing.sm,
  },
  xpProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpProgressLabel: {
    ...typography.scale.labelMd,
    color: colors.onSurfaceVariant,
  },
  xpProgressCount: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  xpProgressBarTrack: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    padding: 1,
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: brand.during,
    borderRadius: borderRadius.full,
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
  modulesSection: {
    marginBottom: spacing.lg,
  },
  modulesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  },
  sectionCounter: {
    ...typography.scale.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  levelsList: {
    gap: spacing.xs,
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginVertical: spacing.space2xs,
    borderColor: brand.border,
    borderWidth: 1,
  },
  moduleCardLocked: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.75,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  moduleIconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconBoxCompleted: {
    backgroundColor: colors.tertiaryContainer,
  },
  moduleIconBoxPartial: {
    backgroundColor: colors.secondaryContainer,
  },
  moduleIconBoxActive: {
    backgroundColor: colors.surfaceVariant,
  },
  moduleIconBoxLocked: {
    backgroundColor: colors.outlineVariant,
  },
  moduleDetails: {
    flex: 1,
    minWidth: 140,
  },
  moduleTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 15,
  },
  moduleTitleLocked: {
    color: colors.outline,
  },
  moduleMetaRow: {
    marginTop: 4,
  },
  completedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    ...typography.scale.labelCaps,
    color: colors.onTertiaryContainer,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  partialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partialTrack: {
    width: 60,
    height: 6,
    backgroundColor: colors.outlineVariant,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  partialFill: {
    width: '50%',
    height: '100%',
    backgroundColor: brand.during,
    borderRadius: borderRadius.full,
  },
  partialText: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '800',
  },
  unlockedSubtext: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  lockedSubtext: {
    ...typography.scale.labelCaps,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  moduleActionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    minHeight: 36,
  },
  actionBtnPrimary: {
    backgroundColor: brand.fill,
  },
  actionBtnPartial: {
    backgroundColor: brand.during,
  },
  actionBtnText: {
    ...typography.scale.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  lockIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    minHeight: touchTargets.min,
  },
  shortcutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  shortcutInfo: {
    flex: 1,
  },
  shortcutTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 15,
  },
  shortcutSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  storageCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
  },
  storageCalloutText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
});
