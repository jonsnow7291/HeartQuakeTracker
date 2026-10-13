import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

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
  icon = 'inbox',
  actionText,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessible={true} accessibilityRole="none">
      <Icon name={icon} size={48} color={colors.outline} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction ? (
        <Button title={actionText} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const makeStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
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
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    description: {
      ...typography.scale.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    button: {
      marginTop: spacing.sm,
    },
  });
