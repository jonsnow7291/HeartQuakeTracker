import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

/** Marcador temporal: cada pantalla que lo use está pendiente de implementación (ver docs/ESTADO_REQUISITOS.md). */
export function ScreenPlaceholder({ title, rf }: { title: string; rf: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Pendiente de implementación · {rf}</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    title: { ...typography.scale.headlineLg, color: colors.onBackground, textAlign: 'center' },
    sub: { ...typography.scale.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' },
  });
