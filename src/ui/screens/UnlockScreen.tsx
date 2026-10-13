import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export function UnlockScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useServices();

  const [pinDigits, setPinDigits] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleKeyPress = async (num: string) => {
    if (loading) return;
    setErrorMessage(null);

    const newPin = pinDigits + num;
    if (newPin.length <= 6) {
      setPinDigits(newPin);

      if (newPin.length === 6) {
        setLoading(true);
        try {
          await session.unlock({ pin: newPin });
          navigation.goBack();
        } catch (err: unknown) {
          const errCode = (err as { code?: string })?.code;
          if (errCode === 'AUTH_FAILED') {
            setErrorMessage('PIN incorrecto. Por favor verifica e intenta de nuevo.');
          } else {
            setErrorMessage('Ocurrió un error al verificar tus credenciales.');
          }
          setPinDigits('');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setErrorMessage(null);
    setPinDigits(pinDigits.slice(0, -1));
  };

  const handleBiometricUnlock = async () => {
    if (loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await session.unlock({ biometric: true });
      navigation.goBack();
    } catch (err: unknown) {
      console.warn('[UnlockScreen] Biometría falló:', err);
      setErrorMessage('Autenticación biométrica no completada o denegada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Desbloquear Sesión"
        eyebrow="SEGURIDAD Y CIFRADO"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.shieldBadge}>
            <Icon name="lock" size={32} color={brand.espresso} />
          </View>

          <Text style={styles.title}>Desbloquear Ficha Médica</Text>
          <Text style={styles.subtitle}>
            Ingresa tu PIN de 6 dígitos para acceder a tus datos médicos protegidos y de rescate.
          </Text>

          {/* Indicadores de dígitos del PIN */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = idx < pinDigits.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isFilled ? styles.dotFilled : styles.dotEmpty,
                  ]}
                />
              );
            })}
          </View>

          {/* Mensaje de error o indicador de carga */}
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={brand.espresso} size="small" />
              <Text style={styles.loadingText}>Verificando credenciales...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.bannerWrapper}>
              <Banner kind="critical" title="Error de autenticación" message={errorMessage} />
            </View>
          ) : null}

          {/* Teclado numérico táctil */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyButton}
                    onPress={() => handleKeyPress(digit)}
                    disabled={loading}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Número ${digit}`}
                    accessibilityState={{ disabled: loading }}
                  >
                    <Text style={styles.keyDigit}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Última fila: Biometría, 0, Borrar */}
            <View style={styles.keypadRow}>
              <TouchableOpacity
                style={styles.keyButtonAux}
                onPress={handleBiometricUnlock}
                disabled={loading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Desbloquear con huella dactilar o biometría"
                accessibilityState={{ disabled: loading }}
              >
                <Icon name="fingerprint" size={28} color={brand.espresso} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyButton}
                onPress={() => handleKeyPress('0')}
                disabled={loading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Número 0"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.keyDigit}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keyButtonAux}
                onPress={handleDelete}
                disabled={loading || pinDigits.length === 0}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Borrar último dígito"
                accessibilityState={{ disabled: loading || pinDigits.length === 0 }}
              >
                <Icon name="backspace" size={24} color={pinDigits.length > 0 ? brand.espresso : colors.outline} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: brand.cream,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  shieldBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotFilled: {
    backgroundColor: brand.fill,
    transform: [{ scale: 1.15 }],
  },
  dotEmpty: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: 'transparent',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.scale.bodySm,
    color: colors.outline,
  },
  bannerWrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  keypad: {
    width: '100%',
    maxWidth: 290,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  keyDigit: {
    ...typography.scale.headlineLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  keyButtonAux: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
