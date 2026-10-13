import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Severity } from '../../contracts/types';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, borderRadius, typography } from '../theme/tokens';
import type { AppTheme, ColorPalette } from '../theme/theme';

export interface SeveritySelectorProps {
  onSelect: (severity: Severity) => void;
  selected?: Severity;
  disabled?: boolean;
  layout?: 'cards' | 'row';
}

interface SeverityOption {
  severity: Severity;
  title: string;
  shortTitle: string;
  caption: string;
  desc: string;
  icon: string;
  selectedBg: string;
  selectedBorder: string;
  selectedFg: string;
  badgeBg: string;
  badgeFg: string;
}

function buildOptions(colors: ColorPalette): SeverityOption[] {
  return [
    {
      severity: 'ILESO',
      title: 'Estoy Ileso',
      shortTitle: 'Ileso',
      caption: 'A salvo',
      desc: 'No requiero rescate físico. Notificar a mi entorno y registrar estado seguro.',
      icon: 'sentiment_satisfied',
      selectedBg: colors.tertiaryContainer,
      selectedBorder: colors.tertiary,
      selectedFg: colors.onTertiaryContainer,
      badgeBg: colors.tertiaryContainer,
      badgeFg: colors.onTertiaryContainer,
    },
    {
      severity: 'CON_LESIONES',
      title: 'Tengo Lesiones',
      shortTitle: 'Herido',
      caption: 'Movilidad OK',
      desc: 'Requiero primeros auxilios o asistencia médica de urgencia.',
      icon: 'personal_injury',
      selectedBg: colors.secondaryContainer,
      selectedBorder: colors.secondary,
      selectedFg: colors.onSecondaryContainer,
      badgeBg: colors.warningContainer,
      badgeFg: colors.onWarningContainer,
    },
    {
      severity: 'ATRAPADO',
      title: 'Estoy Atrapado',
      shortTitle: 'Atrapado',
      caption: 'Prioridad 1',
      desc: 'PRIORIDAD MÁXIMA: Bloqueado bajo escombros o sin posibilidad de salir.',
      icon: 'crisis_alert',
      selectedBg: colors.panicContainer,
      selectedBorder: colors.panic,
      selectedFg: colors.panic,
      badgeBg: colors.panic,
      badgeFg: colors.onPanic,
    },
  ];
}

export function SeveritySelector({
  onSelect,
  selected,
  disabled = false,
  layout = 'row',
}: SeveritySelectorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const OPTIONS = buildOptions(colors);
  const pingAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected === 'ATRAPADO') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pingAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pingAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pingAnim.setValue(1);
    }
  }, [selected, pingAnim]);

  if (layout === 'cards') {
    return (
      <View style={styles.cardsContainer}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.severity;
          return (
            <TouchableOpacity
              key={opt.severity}
              onPress={() => onSelect(opt.severity)}
              disabled={disabled}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${opt.title} (${opt.caption}). ${opt.desc}`}
              accessibilityState={{ selected: isSelected, disabled }}
              style={[
                styles.card,
                {
                  borderColor: isSelected ? opt.selectedBorder : colors.outlineVariant,
                  borderWidth: isSelected ? 2 : 1,
                  backgroundColor: isSelected ? opt.selectedBg : colors.surface,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIconWrap,
                    {
                      backgroundColor: isSelected ? opt.badgeBg : colors.surfaceVariant,
                    },
                  ]}
                >
                  <Icon
                    name={opt.icon}
                    size={22}
                    color={isSelected ? opt.badgeFg : colors.onSurface}
                  />
                </View>
                <View style={styles.cardTitleCol}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isSelected ? opt.selectedFg : colors.onSurface },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={styles.cardCaption}>{opt.caption}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Layout = 'row' (triage selector de 3 columnas según mockup)
  return (
    <View style={styles.rowContainer}>
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.severity;
        const isTrapped = opt.severity === 'ATRAPADO';

        return (
          <TouchableOpacity
            key={opt.severity}
            onPress={() => onSelect(opt.severity)}
            disabled={disabled}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${opt.shortTitle} (${opt.caption}). ${opt.desc}`}
            accessibilityState={{ selected: isSelected, disabled }}
            style={[
              styles.rowButton,
              {
                borderColor: isSelected ? opt.selectedBorder : colors.outlineVariant,
                borderWidth: isSelected ? 2 : 1,
                backgroundColor: isSelected ? opt.selectedBg : colors.surface,
              },
            ]}
          >
            {isSelected && isTrapped ? (
              <Animated.View
                style={[
                  styles.pingBadge,
                  {
                    transform: [{ scale: pingAnim }],
                    opacity: 0.85,
                    backgroundColor: colors.panic,
                  },
                ]}
              />
            ) : null}

            <View
              style={[
                styles.rowIconWrap,
                {
                  backgroundColor: isSelected ? opt.badgeBg : colors.surfaceVariant,
                },
              ]}
            >
              <Icon
                name={opt.icon}
                size={22}
                color={isSelected ? opt.badgeFg : (isTrapped ? colors.panic : colors.onSurface)}
              />
            </View>

            <View style={styles.rowTextCol}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    color: isSelected ? opt.selectedFg : (isTrapped ? colors.panic : colors.onSurface),
                    fontWeight: isSelected ? '800' : '700',
                  },
                ]}
              >
                {opt.shortTitle}
              </Text>
              <Text
                style={[
                  styles.rowCaption,
                  {
                    color: isSelected ? opt.selectedFg : colors.onSurfaceVariant,
                  },
                ]}
              >
                {opt.caption}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = ({ brand }: AppTheme) =>
  StyleSheet.create({
    // Cards Layout
    cardsContainer: {
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    card: {
      minHeight: 76,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      elevation: 2,
      shadowColor: brand.espresso,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    cardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    cardTitleCol: {
      flex: 1,
    },
    cardTitle: {
      ...typography.scale.headlineSm,
      fontWeight: '700',
    },
    cardCaption: {
      ...typography.scale.labelCaps,
      fontSize: 10,
      marginTop: 1,
    },
    cardDesc: {
      ...typography.scale.bodySm,
      lineHeight: 18,
      marginTop: 2,
    },

    // Row Layout (3 columnas)
    rowContainer: {
      flexDirection: 'row',
      gap: spacing.xs,
      width: '100%',
      paddingTop: spacing.xxs,
    },
    rowButton: {
      flex: 1,
      minHeight: 112,
      borderRadius: borderRadius.md,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 2,
      shadowColor: brand.espresso,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      position: 'relative',
    },
    pingBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      width: 14,
      height: 14,
      borderRadius: 7,
      zIndex: 10,
    },
    rowIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTextCol: {
      alignItems: 'center',
      width: '100%',
    },
    rowTitle: {
      ...typography.scale.labelMd,
      textAlign: 'center',
    },
    rowCaption: {
      ...typography.scale.labelCaps,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 2,
    },
  });
