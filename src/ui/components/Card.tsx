import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({ children, onPress, style, accessible = true, accessibilityLabel, accessibilityHint }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessible={accessible}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        activeOpacity={0.7}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View accessible={accessibilityLabel ? accessible : undefined} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: brand.border,
      elevation: 2,
      shadowColor: brand.espresso, // sombra cálida difusa (DESIGN.md › Elevation)
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
  });
