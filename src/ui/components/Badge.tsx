import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography } from '../theme/tokens';

export interface BadgeProps {
  title: string;
  unlocked?: boolean;
}

export function Badge({ title, unlocked = true }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: unlocked ? lightPalette.primaryContainer : lightPalette.surfaceVariant,
          borderColor: unlocked ? lightPalette.primary : lightPalette.outline,
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Insignia: ${title}. ${unlocked ? 'Desbloqueada' : 'Bloqueada'}`}
    >
      <Text style={styles.icon}>{unlocked ? '🏆' : '🔒'}</Text>
      <Text
        style={[
          styles.text,
          { color: unlocked ? lightPalette.onPrimaryContainer : lightPalette.outline },
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
