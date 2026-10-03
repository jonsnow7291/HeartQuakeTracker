import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = '📋',
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container} accessible={true} accessibilityRole="none">
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction ? (
        <Button title={actionText} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.scale.headline,
    color: lightPalette.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
});
