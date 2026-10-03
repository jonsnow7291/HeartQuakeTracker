import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { GuideMeta } from '../../contracts/content';
import { useServices } from '../hooks/useServices';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

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
  const { content } = useServices();

  const [guides, setGuides] = useState<GuideMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await content.listGuides();
      setGuides(list);
    } catch (err: any) {
      setError(err?.code || 'UNKNOWN');
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Guías de Prevención</Text>
        <Text style={styles.subtitle}>
          Disponibles sin conexión para preparar a tu hogar y comunidad.
        </Text>

        {/* Categories Carousel */}
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={selectedCategory === cat.key}
              onPress={() => setSelectedCategory(cat.key)}
            />
          ))}
        </View>

        {error ? (
          <ErrorState code={error} onRetry={fetchGuides} />
        ) : (
          <FlatList
            data={filteredGuides}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              loading ? (
                <Text style={styles.loadingText}>Cargando guías...</Text>
              ) : (
                <EmptyState
                  title="No hay guías disponibles"
                  description="No se encontraron guías en la categoría seleccionada."
                />
              )
            }
            renderItem={({ item }) => (
              <Card
                onPress={() => onSelectGuide(item.id)}
                accessibilityLabel={`${item.title}. Tiempo estimado: ${item.readMin} minutos`}
                style={styles.guideCard}
              >
                <View style={styles.guideHeader}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                  <Text style={styles.readTime}>⏱️ {item.readMin} min</Text>
                </View>
                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideSummary}>{item.summary}</Text>
              </Card>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.scale.headline,
    color: lightPalette.onBackground,
  },
  subtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  guideCard: {
    marginVertical: spacing.xs,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    ...typography.scale.label,
    fontSize: 10,
    color: lightPalette.primary,
    backgroundColor: lightPalette.primaryContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: 4,
    overflow: 'hidden',
  },
  readTime: {
    ...typography.scale.label,
    fontSize: 11,
    color: lightPalette.outline,
  },
  guideTitle: {
    ...typography.scale.title,
    fontSize: 16,
    color: lightPalette.onSurface,
  },
  guideSummary: {
    ...typography.scale.bodyMedium,
    fontSize: 13,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
});
