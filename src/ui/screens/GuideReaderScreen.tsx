import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { useServices } from '../hooks/useServices';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

export interface GuideReaderScreenProps {
  guideId: string;
  onBack: () => void;
}

export function GuideReaderScreen({ guideId, onBack }: GuideReaderScreenProps) {
  const { content } = useServices();

  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await content.getGuideMarkdown(guideId);
      setMarkdown(text);
    } catch (err: any) {
      setError(err?.code || 'CONTENT_MISSING');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [guideId, content]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button title="← Volver" variant="outline" onPress={onBack} style={styles.backBtn} />
      </View>

      {error ? (
        <ErrorState code={error} onRetry={loadContent} />
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando guía educativa...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.markdownBody}>{markdown}</Text>
          <Button title="Finalizar Lectura" variant="primary" onPress={onBack} style={styles.finishBtn} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightPalette.outlineVariant,
  },
  backBtn: {
    alignSelf: 'flex-start',
    minWidth: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
  },
  content: {
    padding: spacing.lg,
  },
  markdownBody: {
    ...typography.scale.bodyLarge,
    color: lightPalette.onBackground,
    lineHeight: 26,
  },
  finishBtn: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
});
