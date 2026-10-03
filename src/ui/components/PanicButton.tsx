import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, typography, touchTargets } from '../theme/tokens';

export interface PanicButtonProps {
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function PanicButton({ onPress, active = false, disabled = false }: PanicButtonProps) {
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

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.halo,
          {
            transform: [{ scale: pulseAnim }],
            opacity: active ? 0.6 : 0.2,
          },
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Botón de Pánico de Emergencia"
        accessibilityHint="Pulsa una vez para seleccionar tu situación y pedir auxilio inmediato"
        style={[
          styles.button,
          {
            backgroundColor: active ? '#93000A' : lightPalette.panic,
          },
        ]}
      >
        <Text style={styles.buttonText}>PÁNICO</Text>
        <Text style={styles.subtext}>{active ? 'TRANSMITIENDO' : 'TOCA PARA AUXILIO'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  halo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: lightPalette.panicContainer,
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
    shadowColor: lightPalette.panic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    ...typography.scale.headline,
    color: lightPalette.onPanic,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtext: {
    ...typography.scale.label,
    fontSize: 10,
    color: lightPalette.onPanic,
    marginTop: spacing.xxs,
    textTransform: 'uppercase',
  },
});
