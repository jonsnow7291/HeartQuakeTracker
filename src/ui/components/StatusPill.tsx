import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, borderRadius, typography } from '../theme/tokens';

export type StatusType = 'online' | 'offline' | 'syncing' | 'beacon' | 'lowPower';

export interface StatusPillProps {
  type: StatusType;
  label?: string;
}

export function StatusPill({ type, label }: StatusPillProps) {
  const { colors } = useTheme();
  const getConfig = () => {
    switch (type) {
      case 'online':
        return {
          bg: colors.successContainer,
          text: colors.onSuccessContainer,
          dot: colors.success,
          defaultLabel: 'En Línea',
        };
      case 'offline':
        return {
          bg: colors.surfaceVariant,
          text: colors.onSurfaceVariant,
          dot: colors.outline,
          defaultLabel: 'Sin Conexión',
        };
      case 'syncing':
        return {
          bg: colors.primaryContainer,
          text: colors.onPrimaryContainer,
          dot: colors.primary,
          defaultLabel: 'Sincronizando',
        };
      case 'beacon':
        return {
          bg: colors.panicContainer,
          text: colors.onPanicContainer,
          dot: colors.panic,
          defaultLabel: 'Baliza BLE Activa',
        };
      case 'lowPower':
        return {
          bg: colors.warningContainer,
          text: colors.onWarningContainer,
          dot: colors.warning,
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
