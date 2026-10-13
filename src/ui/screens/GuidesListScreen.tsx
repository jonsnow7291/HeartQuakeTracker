import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GuideMeta } from '../../contracts/content';
import { useServices } from '../hooks/useServices';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { ErrorCode } from '../../contracts/errors';

export interface GuidesListScreenProps {
  onSelectGuide: (guideId: string) => void;
  onBack: () => void;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'MOCHILA', label: 'Mochila 72h' },
  { key: 'ESTRUCTURAL', label: 'Estructural' },
  { key: 'PLAN_FAMILIAR', label: 'Plan Familiar' },
  { key: 'OTRO', label: 'Acción y Rescate' },
];

export function GuidesListScreen({ onSelectGuide, onBack }: GuidesListScreenProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { content } = useServices();

  const [guides, setGuides] = useState<GuideMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorCode | null>(null);

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      if (content) {
        const list = await content.listGuides();
        setGuides(list);
      }
    } catch (err: unknown) {
      const code = (err as { code?: ErrorCode })?.code ?? 'UNKNOWN';
      console.warn('[GuidesList] error al cargar guías:', code, (err as Error)?.message);
      setError(code);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [content]);

  const filteredGuides =
    selectedCategory === 'ALL'
      ? guides
      : guides.filter((g) => g.category === selectedCategory);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabecera contextual */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButtonCircle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Volver a prevención"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="arrow_back" size={20} color={brand.espresso} />
            </TouchableOpacity>
            <View style={styles.subHeaderTitleBlock}>
              <View style={styles.phaseIndicatorRow}>
                <View style={styles.phaseIndicatorDot} />
                <Text style={styles.phaseIndicatorText}>Biblioteca Offline</Text>
              </View>
              <Text style={styles.phaseTitleText} accessibilityRole="header">
                Guías de Prevención
              </Text>
            </View>
          </View>
          <View style={styles.headerIconBadge}>
            <Icon name="menu_book" size={22} color={brand.espresso} />
          </View>
        </View>

        {/* Subtítulo institucional */}
        <Text style={styles.subtitle}>
          Material de lectura 100% offline basado en protocolos de UNGRD, IDIGER y Cruz Roja Colombiana.
        </Text>

        {/* Carrusel de Categorías */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[
                    styles.categoryFilterChip,
                    isSelected && styles.categoryFilterChipSelected,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por ${cat.label}`}
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      isSelected && styles.categoryFilterTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de guías */}
        {error ? (
          <ErrorState code={error} onRetry={fetchGuides} />
        ) : (
          <FlatList
            data={filteredGuides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Cargando catálogo offline...</Text>
                </View>
              ) : (
                <EmptyState
                  title="No hay guías disponibles"
                  description="No se encontraron guías en la categoría seleccionada."
                />
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectGuide(item.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. Tiempo estimado: ${item.readMin} minutos`}
                style={styles.guideCard}
                activeOpacity={0.7}
              >
                <View style={styles.guideHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {item.category.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={styles.readTimeRow}>
                    <Icon name="schedule" size={14} color={colors.outline} />
                    <Text style={styles.readTimeText}>{item.readMin} min de lectura</Text>
                  </View>
                </View>

                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideSummary}>{item.summary}</Text>

                <View style={styles.guideFooter}>
                  <View style={styles.officialBadgeRow}>
                    <Icon name="verified" size={14} color={brand.prevention} />
                    <Text style={styles.officialBadgeText}>Protocolo Oficial</Text>
                  </View>
                  <View style={styles.readMoreRow}>
                    <Text style={styles.readMoreText}>Leer guía</Text>
                    <Icon name="arrow_forward_ios" size={12} color={brand.during} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
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
    flex: 1,
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.spaceXs,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.spaceXs,
    marginBottom: spacing.space2xs,
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
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.spaceSm,
    lineHeight: 18,
  },
  categoriesContainer: {
    marginBottom: spacing.spaceSm,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: spacing.spaceXs,
    paddingVertical: 2,
  },
  categoryFilterChip: {
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.spaceXs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterChipSelected: {
    backgroundColor: brand.fill,
    borderColor: brand.espresso,
  },
  categoryFilterText: {
    ...typography.scale.labelMd,
    color: colors.onSurfaceVariant,
  },
  categoryFilterTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing.space3xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.space2xl,
  },
  loadingText: {
    ...typography.scale.bodyMd,
    color: colors.outline,
  },
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceSm,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: touchTargets.min,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.spaceXs,
  },
  categoryBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    ...typography.scale.bodySm,
    color: colors.outline,
  },
  guideTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    marginBottom: 4,
  },
  guideSummary: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 19,
    marginBottom: spacing.spaceSm,
  },
  guideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.spaceXs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  officialBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  officialBadgeText: {
    ...typography.scale.labelCaps,
    color: brand.prevention,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
});
