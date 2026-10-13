import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, borderRadius, typography } from '../theme/tokens';

export interface BadgeProps {
  title: string;
  unlocked?: boolean;
  /** Nombre de Material Symbols. Sin ícono por defecto: una etiqueta de categoría no es un logro. */
  icon?: string;
}

export function Badge({ title, unlocked = true, icon }: BadgeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: unlocked ? colors.primaryContainer : colors.surfaceVariant,
          borderColor: unlocked ? colors.primary : colors.outline,
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Insignia: ${title}. ${unlocked ? 'Desbloqueada' : 'Bloqueada'}`}
    >
      {!unlocked ? (
        <Icon name="lock" size={16} color={colors.outline} style={styles.icon} />
      ) : icon ? (
        <Icon name={icon} size={16} color={colors.onPrimaryContainer} style={styles.icon} />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: unlocked ? colors.onPrimaryContainer : colors.outline },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    margin: spacing.xxs,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.scale.label,
  },
});
