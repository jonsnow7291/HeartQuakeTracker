import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Severity } from '../../contracts/types';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography, touchTargets } from '../theme/tokens';

export interface SeveritySelectorProps {
  onSelect: (severity: Severity) => void;
  selected?: Severity;
  disabled?: boolean;
}

export function SeveritySelector({ onSelect, selected, disabled = false }: SeveritySelectorProps) {
  const options: { severity: Severity; title: string; desc: string; color: string; bgColor: string }[] = [
    {
      severity: 'ILESO',
      title: 'Estoy Ileso',
      desc: 'No requiero rescate físico. Notificar a mi entorno y registrar estado seguro.',
      color: lightPalette.success,
      bgColor: lightPalette.successContainer,
    },
    {
      severity: 'CON_LESIONES',
      title: 'Tengo Lesiones',
      desc: 'Requiero primeros auxilios o asistencia médica de urgencia.',
      color: lightPalette.warning,
      bgColor: lightPalette.warningContainer,
    },
    {
      severity: 'ATRAPADO',
      title: 'Estoy Atrapado',
      desc: 'PRIORIDAD MÁXIMA: Bloqueado bajo escombros o sin posibilidad de salir.',
      color: lightPalette.panic,
      bgColor: lightPalette.panicContainer,
    },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = selected === opt.severity;
        return (
          <TouchableOpacity
            key={opt.severity}
            onPress={() => onSelect(opt.severity)}
            disabled={disabled}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${opt.title}. ${opt.desc}`}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.card,
              {
                borderColor: isSelected ? opt.color : lightPalette.outlineVariant,
                borderWidth: isSelected ? 3 : 1,
                backgroundColor: isSelected ? opt.bgColor : lightPalette.surface,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.indicator, { backgroundColor: opt.color }]} />
              <Text style={[styles.title, { color: opt.color }]}>{opt.title}</Text>
            </View>
            <Text style={styles.description}>{opt.desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  card: {
    minHeight: 72,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.scale.title,
    fontWeight: '700',
  },
  description: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    marginLeft: 14 + spacing.sm,
  },
});
