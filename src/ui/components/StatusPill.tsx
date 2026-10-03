import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography } from '../theme/tokens';

export type StatusType = 'online' | 'offline' | 'syncing' | 'beacon' | 'lowPower';

export interface StatusPillProps {
  type: StatusType;
  label?: string;
}

export function StatusPill({ type, label }: StatusPillProps) {
  const getConfig = () => {
    switch (type) {
      case 'online':
        return {
          bg: lightPalette.successContainer,
          text: lightPalette.onSuccessContainer,
          dot: lightPalette.success,
          defaultLabel: 'En Línea',
        };
      case 'offline':
        return {
          bg: lightPalette.surfaceVariant,
          text: lightPalette.onSurfaceVariant,
          dot: lightPalette.outline,
          defaultLabel: 'Sin Conexión',
        };
      case 'syncing':
        return {
          bg: lightPalette.primaryContainer,
          text: lightPalette.onPrimaryContainer,
          dot: lightPalette.primary,
          defaultLabel: 'Sincronizando',
        };
      case 'beacon':
        return {
          bg: lightPalette.panicContainer,
          text: lightPalette.onPanicContainer,
          dot: lightPalette.panic,
          defaultLabel: 'Baliza BLE Activa',
        };
      case 'lowPower':
        return {
          bg: lightPalette.warningContainer,
          text: lightPalette.onWarningContainer,
          dot: lightPalette.warning,
          defaultLabel: 'Ahorro (<20%)',
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[styles.container, { backgroundColor: config.bg }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Estado: ${label || config.defaultLabel}`}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }]}>{label || config.defaultLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.scale.label,
    fontSize: 11,
  },
});
