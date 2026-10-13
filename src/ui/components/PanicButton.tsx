import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, touchTargets } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export interface PanicButtonProps {
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'circular' | 'pill';
  label?: string;
}

export function PanicButton({
  onPress,
  active = false,
  disabled = false,
  variant = 'circular',
  label,
}: PanicButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [active, pulseAnim]);

  if (variant === 'pill') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.88}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Botón de Pánico de Emergencia"
        accessibilityHint="Pulsa una vez para seleccionar tu situación y pedir auxilio inmediato"
        accessibilityState={{ disabled, busy: active }}
        accessibilityLiveRegion="polite"
        style={[
          styles.pillButton,
          {
            backgroundColor: colors.panic,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Icon name="crisis_alert" size={20} color={colors.onPanic} style={styles.pillIcon} />
        <Text style={[styles.pillText, { color: colors.onPanic }]}>
          {label ?? (active ? 'TRANSMITIENDO AUXILIO' : 'Botón SOS / Enviar mi ubicación')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.halo,
          {
            transform: [{ scale: pulseAnim }],
            opacity: active ? 0.7 : 0.25,
            backgroundColor: active ? colors.panicContainer : colors.secondaryContainer,
          },
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Botón de Pánico de Emergencia"
        accessibilityHint="Pulsa una vez para seleccionar tu situación y pedir auxilio inmediato"
        accessibilityState={{ disabled, busy: active }}
        accessibilityLiveRegion="polite"
        style={[
          styles.button,
          {
            backgroundColor: colors.panic,
            borderColor: active ? colors.onPanicContainer : colors.onPanic,
          },
        ]}
      >
        <Icon
          name="crisis_alert"
          size={36}
          color={colors.onPanic}
          style={styles.icon}
        />
        <Text style={[styles.buttonText, { color: colors.onPanic }]}>PÁNICO</Text>
        <Text style={[styles.subtext, { color: colors.onPanic }]}>
          {active ? 'TRANSMITIENDO' : 'TOCA PARA AUXILIO'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = ({ brand }: AppTheme) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: spacing.xl,
    },
    halo: {
      position: 'absolute',
      width: 176,
      height: 176,
      borderRadius: 88,
    },
    button: {
      width: 140,
      height: 140,
      borderRadius: 70,
      minHeight: touchTargets.panic,
      minWidth: touchTargets.panic,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: brand.espresso,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      borderWidth: 4,
    },
    icon: {
      marginBottom: spacing.xxs,
    },
    buttonText: {
      ...typography.scale.headlineMd,
      fontWeight: '800',
      letterSpacing: 2,
    },
    subtext: {
      ...typography.scale.labelCaps,
      fontSize: 10,
      marginTop: 2,
      letterSpacing: 1.2,
    },
    pillButton: {
      width: '100%',
      minHeight: 52,
      borderRadius: 9999,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      elevation: 4,
      shadowColor: brand.espresso,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    pillIcon: {
      marginRight: spacing.xs,
    },
    pillText: {
      ...typography.scale.labelLg,
      fontWeight: '700',
    },
  });
