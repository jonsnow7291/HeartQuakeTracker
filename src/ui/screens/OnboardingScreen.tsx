import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export function OnboardingScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useServices();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [pinConfirm, setPinConfirm] = useState<string>('');
  const [enableBiometrics, setEnableBiometrics] = useState<boolean>(true);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleNextStep = () => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!acceptedTerms) {
        setValidationError('Debes aceptar el consentimiento de Habeas Data para continuar.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!displayName.trim()) {
        setValidationError('El nombre para mostrar es obligatorio para tu perfil de auxilio.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!/^\d{6}$/.test(pin)) {
        setValidationError('El PIN debe tener exactamente 6 dígitos numéricos.');
        return;
      }
      if (pin !== pinConfirm) {
        setValidationError('La confirmación no coincide con el PIN ingresado.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setValidationError(null);
    setIsSubmitting(true);
    try {
      await session.createLocalAccount({
        displayName: displayName.trim(),
        email: email.trim() ? email.trim() : undefined,
        pin,
        acceptTerms: true,
      });

      navigation.replace('Main');
    } catch (err: unknown) {
      console.warn('[Onboarding] Error al crear cuenta:', err);
      setValidationError('No se pudo crear la cuenta local. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Bienvenido"
        eyebrow="EARTHQUAKE TRACKER"
        tone="espresso"
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* Step Indicator Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIndicatorRow}>
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  step === currentStep
                    ? styles.stepDotActive
                    : step < currentStep
                    ? styles.stepDotCompleted
                    : styles.stepDotInactive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepCounter}>Paso {currentStep} de 4</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Paso 1: Bienvenida y Habeas Data */}
          {currentStep === 1 ? (
            <View style={styles.stepContainer}>
              <View style={styles.heroBadge}>
                <Icon name="shield" size={32} color={brand.during} />
              </View>
              <Text style={styles.stepTitle}>Bienvenido a EarthQuakeTracker</Text>
              <Text style={styles.stepDescription}>
                Herramienta comunitaria offline-first para respuesta y autoprotección ante sismos en Colombia.
              </Text>

              <View style={styles.legalCard}>
                <View style={styles.legalCardHeader}>
                  <Text style={styles.legalTag}>LEY 1581 DE 2012</Text>
                  <Text style={styles.legalTitle}>Consentimiento Habeas Data</Text>
                </View>
                <Text style={styles.legalSummary}>
                  Tus datos de salud y ubicación se almacenan cifrados (AES-256) en tu propio teléfono.
                  No se suben a la nube sin tu consentimiento. La información médica solo se transmite a socorristas
                  acreditados vía Bluetooth en caso de activación de emergencia.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setAcceptedTerms(!acceptedTerms);
                  setValidationError(null);
                }}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                accessibilityLabel="Acepto el consentimiento de Habeas Data y el tratamiento de datos personales"
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>
                  He leído y acepto el tratamiento de mis datos personales para fines de emergencia y auxilio vital.
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Paso 2: Identidad local */}
          {currentStep === 2 ? (
            <View style={styles.stepContainer}>
              <View style={styles.heroBadge}>
                <Icon name="person" size={32} color={brand.espresso} />
              </View>
              <Text style={styles.stepTitle}>Tu Identidad de Auxilio</Text>
              <Text style={styles.stepDescription}>
                Ingresa el nombre con el que te identificarán los rescatistas y miembros de tu red comunitaria.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nombre completo o alias *</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    setValidationError(null);
                  }}
                  placeholder="Ej. Nombre y apellido"
                  placeholderTextColor={colors.outline}
                  autoCapitalize="words"
                  accessible={true}
                  accessibilityLabel="Nombre completo o alias de emergencia"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Correo electrónico (Opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel="Correo electrónico opcional"
                />
                <Text style={styles.fieldHint}>
                  Solo para vincular respaldos voluntarios de guías y mapas.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Paso 3: PIN de 6 dígitos */}
          {currentStep === 3 ? (
            <View style={styles.stepContainer}>
              <View style={styles.heroBadge}>
                <Icon name="lock" size={32} color={brand.espresso} />
              </View>
              <Text style={styles.stepTitle}>Seguridad y Cifrado Local</Text>
              <Text style={styles.stepDescription}>
                Define un PIN de 6 dígitos para proteger tu ficha médica confidencial.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>PIN de 6 dígitos *</Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text.replace(/[^0-9]/g, '').slice(0, 6));
                    setValidationError(null);
                  }}
                  placeholder="••••••"
                  placeholderTextColor={colors.outline}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  accessible={true}
                  accessibilityLabel="PIN de seguridad de 6 dígitos"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Confirmar PIN *</Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  value={pinConfirm}
                  onChangeText={(text) => {
                    setPinConfirm(text.replace(/[^0-9]/g, '').slice(0, 6));
                    setValidationError(null);
                  }}
                  placeholder="••••••"
                  placeholderTextColor={colors.outline}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  accessible={true}
                  accessibilityLabel="Confirmar PIN de 6 dígitos"
                />
              </View>

              <View style={styles.infoCard}>
                <Icon name="lightbulb" size={18} color={brand.during} />
                <Text style={styles.infoText}>
                  El botón de pánico nunca te pedirá PIN. Solo se solicitará para editar tu ficha médica y tus contactos.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Paso 4: Biometría y confirmación */}
          {currentStep === 4 ? (
            <View style={styles.stepContainer}>
              <View style={[styles.heroBadge, { backgroundColor: colors.tertiaryContainer }]}>
                <Icon name="task_alt" size={32} color={colors.onTertiaryContainer} />
              </View>
              <Text style={styles.stepTitle}>¡Todo Listo!</Text>
              <Text style={styles.stepDescription}>
                Revisa tus preferencias para comenzar a explorar guías, mapas y activar tu red de protección.
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Usuario:</Text>
                  <Text style={styles.summaryValue}>{displayName}</Text>
                </View>
                {email ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Correo:</Text>
                    <Text style={styles.summaryValue}>{email}</Text>
                  </View>
                ) : null}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PIN:</Text>
                  <Text style={styles.summaryValue}>Configurado (6 dígitos)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Consentimiento:</Text>
                  <Text style={[styles.summaryValue, { color: brand.prevention }]}>
                    Aceptado (Ley 1581)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setEnableBiometrics(!enableBiometrics)}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: enableBiometrics }}
                accessibilityLabel="Permitir desbloqueo con huella o biometría"
              >
                <View style={[styles.checkbox, enableBiometrics && styles.checkboxChecked]}>
                  {enableBiometrics ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>
                  Permitir desbloqueo con biometría (Huella / Reconocimiento facial) cuando esté disponible.
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Banner de error de validación */}
          {validationError ? (
            <Banner kind="critical" title="Validación" message={validationError} />
          ) : null}

          {/* Botones de navegación del formulario */}
          <View style={styles.buttonRow}>
            {currentStep > 1 ? (
              <Button
                title="← Atrás"
                variant="outline"
                onPress={handlePrevStep}
                style={styles.backButton}
                disabled={isSubmitting}
              />
            ) : null}

            {currentStep < 4 ? (
              <Button
                title="Continuar →"
                variant="primary"
                onPress={handleNextStep}
                style={styles.continueButton}
              />
            ) : (
              <Button
                title="Comenzar a usar la App"
                variant="primary"
                onPress={handleComplete}
                loading={isSubmitting}
                style={styles.continueButton}
              />
            )}
          </View>
        </ScrollView>
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
  stepHeader: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    backgroundColor: colors.surface,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  stepDotActive: {
    backgroundColor: brand.during,
    width: 36,
  },
  stepDotCompleted: {
    backgroundColor: brand.prevention,
  },
  stepDotInactive: {
    backgroundColor: colors.surfaceVariant,
  },
  stepCounter: {
    ...typography.scale.labelCaps,
    color: colors.outline,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.space3xl,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  legalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.md,
  },
  legalCardHeader: {
    marginBottom: spacing.xs,
  },
  legalTag: {
    ...typography.scale.labelCaps,
    color: brand.during,
  },
  legalTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    marginTop: 2,
  },
  legalSummary: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    width: '100%',
    padding: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: brand.fill,
    borderColor: brand.espresso,
  },
  checkboxLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  formGroup: {
    width: '100%',
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.scale.bodyMd,
    color: colors.onSurface,
    minHeight: 48,
  },
  pinInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  fieldHint: {
    ...typography.scale.bodySm,
    color: colors.outline,
    marginTop: spacing.xxs,
  },
  infoCard: {
    backgroundColor: colors.warningContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
  },
  infoText: {
    ...typography.scale.bodySm,
    color: colors.onWarningContainer,
    flex: 1,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});
