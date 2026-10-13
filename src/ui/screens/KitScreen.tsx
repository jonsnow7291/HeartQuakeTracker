import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { useChecklists } from '../features/checklists/useChecklists';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Agua y Alimentos':
      return 'restaurant';
    case 'Comunicación e Iluminación':
      return 'highlight';
    case 'Primeros Auxilios':
      return 'medical_services';
    case 'Documentos y Valores':
      return 'description';
    case 'Ropa y Abrigo':
      return 'checkroom';
    default:
      return 'inventory_2';
  }
}

export function KitScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { progress } = useServices();
  const { kitItems, toggleKitItem, getKitProgress, resetKit } = useChecklists();

  const [awardNotice, setAwardNotice] = useState<boolean>(false);

  const { completed, total, percentage } = getKitProgress();

  useEffect(() => {
    if (percentage === 100 && progress) {
      progress
        .awardBadge('MOCHILA_COMPLETA')
        .then(() => setAwardNotice(true))
        .catch((err) => console.warn('Error al otorgar insignia de mochila:', err));
    }
  }, [percentage, progress]);

  // Agrupación por categoría
  const categories = Array.from(new Set(kitItems.map((i) => i.category)));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cabecera contextual de pantalla */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonCircle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Volver al menú de prevención"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="arrow_back" size={20} color={brand.espresso} />
            </TouchableOpacity>
            <View style={styles.subHeaderTitleBlock}>
              <View style={styles.phaseIndicatorRow}>
                <View style={styles.phaseIndicatorDot} />
                <Text style={styles.phaseIndicatorText}>Fase 1 • Prevención</Text>
              </View>
              <Text style={styles.phaseTitleText} accessibilityRole="header">
                Mochila de Emergencia
              </Text>
            </View>
          </View>
          <View style={styles.headerIconBadge}>
            <Icon name="backpack" size={22} color={brand.espresso} />
          </View>
        </View>

        {/* Lema & contexto */}
        <View style={styles.mottoCard}>
          <Text style={styles.mottoHighlight}>Autonomía de supervivencia de 72 horas</Text>
          <Text style={styles.mottoBody}>
            Insumos mínimos e indispensables para subsistir los 3 primeros días tras un desastre sísmico. Basado en estándares UNGRD y Cruz Roja.
          </Text>
        </View>

        {awardNotice ? (
          <View style={styles.bannerContainer}>
            <Banner
              kind="success"
              title="¡Mochila 100% Completa!"
              message="Tu mochila contiene todos los suministros recomendados por la Cruz Roja y la UNGRD. Has desbloqueado la insignia 'Mochila de Emergencia 72h'."
            />
          </View>
        ) : null}

        {/* Tarjeta de Progreso */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <View style={styles.progressTitleGroup}>
              <View style={styles.progressIconBadge}>
                <Icon name="task_alt" size={18} color={colors.onTertiaryContainer} />
              </View>
              <View>
                <Text style={styles.progressTag}>AUTONOMÍA • 3 DÍAS</Text>
                <Text style={styles.progressHeading}>Estado de la Mochila</Text>
              </View>
            </View>
            <View style={styles.progressScoreGroup}>
              <View
                style={[
                  styles.progressPill,
                  percentage === 100 && styles.progressPillComplete,
                ]}
              >
                <Text
                  style={[
                    styles.progressPillText,
                    percentage === 100 && styles.progressPillTextComplete,
                  ]}
                >
                  {percentage === 100
                    ? 'COMPLETO'
                    : percentage >= 50
                    ? 'BUEN PROGRESO'
                    : 'EN PROGRESO'}
                </Text>
              </View>
              <Text style={styles.progressPercentText}>{percentage}%</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>

          <Text style={styles.progressFootText}>
            {completed} de {total} elementos listos en tu mochila
          </Text>
        </View>

        {/* Acceso a la Guía Oficial */}
        <TouchableOpacity
          style={styles.guideBannerCard}
          onPress={() => navigation.navigate('GuideReader', { guideId: 'mochila-emergencia' })}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Leer guía oficial de preparación de la mochila 72 horas"
        >
          <View style={styles.guideBannerRow}>
            <View style={styles.guideIconBadge}>
              <Icon name="menu_book" size={22} color={brand.espresso} />
            </View>
            <View style={styles.guideBannerInfo}>
              <Text style={styles.guideBannerTitle}>Guía Oficial de la Mochila 72h</Text>
              <Text style={styles.guideBannerDesc}>
                Conoce las cantidades exactas por persona, recomendaciones de almacenamiento y caducidad.
              </Text>
            </View>
            <Icon name="arrow_forward_ios" size={16} color={colors.outlineVariant} />
          </View>
        </TouchableOpacity>

        {/* Listado de ítems por categoría */}
        {categories.map((category) => {
          const items = kitItems.filter((i) => i.category === category);
          const catCompleted = items.filter((i) => i.completed).length;
          const catTotal = items.length;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <View style={styles.categoryTitleGroup}>
                  <Icon name={getCategoryIcon(category)} size={18} color={brand.during} />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                <View style={styles.catCounterBadge}>
                  <Text style={styles.catCounterText}>
                    {catCompleted}/{catTotal}
                  </Text>
                </View>
              </View>

              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    item.completed && styles.itemCardChecked,
                  ]}
                  onPress={() => toggleKitItem(item.id)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}
                  accessibilityLabel={`${item.title}: ${item.description}. ${
                    item.completed ? 'Marcado como empacado' : 'Pendiente por empacar'
                  }`}
                >
                  <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                    {item.completed ? <Icon name="check" size={14} color={colors.onTertiary} /> : null}
                  </View>
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemTitle,
                        item.completed && styles.itemTitleChecked,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* Acciones al final */}
        <View style={styles.footerActions}>
          <Button
            title="Reiniciar lista de la mochila"
            variant="outline"
            onPress={resetKit}
            style={styles.resetBtn}
          />
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
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.spaceXs,
    paddingBottom: spacing.space3xl,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.spaceXs,
    marginBottom: spacing.spaceSm,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subHeaderTitleBlock: {
    justifyContent: 'center',
  },
  phaseIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  phaseIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  phaseIndicatorText: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: colors.onTertiaryContainer,
    letterSpacing: 0.88,
  },
  phaseTitleText: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    letterSpacing: -0.2,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mottoCard: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.spaceSm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.spaceMd,
  },
  mottoHighlight: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  mottoBody: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  bannerContainer: {
    marginBottom: spacing.spaceMd,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceMd,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.spaceSm,
  },
  progressTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  progressIconBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTag: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: brand.during,
  },
  progressHeading: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  progressScoreGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  progressPill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.spaceXs,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  progressPillComplete: {
    backgroundColor: colors.tertiaryContainer,
  },
  progressPillText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    textTransform: 'uppercase',
  },
  progressPillTextComplete: {
    color: colors.onTertiaryContainer,
  },
  progressPercentText: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    marginLeft: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: spacing.spaceXs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.tertiary,
    borderRadius: 5,
  },
  progressFootText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  guideBannerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceMd,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  guideBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  guideIconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBannerInfo: {
    flex: 1,
  },
  guideBannerTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  guideBannerDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: spacing.spaceMd,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.space2xs,
    marginBottom: spacing.spaceXs,
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  categoryTitle: {
    ...typography.scale.labelCaps,
    color: brand.during,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catCounterBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catCounterText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.spaceSm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.default,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceXs,
    minHeight: touchTargets.min,
    gap: spacing.spaceSm,
  },
  itemCardChecked: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.tertiaryContainer,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  itemTitleChecked: {
    color: brand.espresso,
  },
  itemDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: spacing.spaceMd,
    alignItems: 'center',
  },
  resetBtn: {
    width: '100%',
  },
});
