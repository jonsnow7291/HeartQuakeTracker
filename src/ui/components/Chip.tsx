import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography, touchTargets } from '../theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filtro ${label}, ${selected ? 'seleccionado' : 'no seleccionado'}`}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? lightPalette.primary : lightPalette.surfaceVariant,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? lightPalette.onPrimary : lightPalette.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.scale.label,
  },
});
