import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Severity } from '../../contracts/types';
import { SeveritySelector } from '../components/SeveritySelector';
import { Countdown } from '../components/Countdown';
import { Button } from '../components/Button';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
  onSeveritySelected: (severity: Severity) => Promise<void>;
  onCancelCountdown: () => Promise<void>;
  onActivated: () => void;
}

export function PanicModal({
  visible,
  onClose,
  onSeveritySelected,
  onCancelCountdown,
  onActivated,
}: PanicModalProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [step, setStep] = useState<'SELECT' | 'CONFIRMING'>('SELECT');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | undefined>();

  const handleSelectSeverity = async (sev: Severity) => {
    setSelectedSeverity(sev);
    setStep('CONFIRMING');
    await onSeveritySelected(sev);
  };

  const handleCancel = async () => {
    await onCancelCountdown();
    setStep('SELECT');
    setSelectedSeverity(undefined);
    onClose();
  };

  const handleCountdownFinish = () => {
    setStep('SELECT');
    setSelectedSeverity(undefined);
    onActivated();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {step === 'SELECT' ? (
            <View style={styles.selectStepContainer}>
              <View style={styles.iconCircle}>
                <Icon name="crisis_alert" size={36} color={colors.panic} />
              </View>

              <Text style={styles.title}>¿Cuál es tu situación?</Text>
              <Text style={styles.subtitle}>
                Toca una opción para activar tu baliza de socorro.
              </Text>

              <View style={styles.selectorWrap}>
                <SeveritySelector
                  layout="cards"
                  onSelect={handleSelectSeverity}
                  selected={selectedSeverity}
                />
              </View>

              <Button
                title="Volver atrás"
                variant="outline"
                onPress={onClose}
                style={styles.backButton}
              />
            </View>
          ) : (
            <View style={styles.confirmingContainer}>
              <View style={styles.warningCard} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <View style={styles.activeTag}>
                  <View style={styles.pingDot} />
                  <Text style={styles.activeTagText}>MODO CRISIS ACTIVO • RF-05</Text>
                </View>

                <Text style={styles.confirmingTitle}>EMITIENDO ALERTA DE AUXILIO</Text>
                <Text style={styles.confirmingSubtitle}>
                  Se activará la linterna estroboscópica, el tono acústico y la baliza BLE.
                </Text>

                <View style={styles.countdownBox}>
                  <Countdown durationSeconds={3} onFinish={handleCountdownFinish} />
                </View>

                <Text style={styles.cancelHint}>
                  Si fue involuntario, cancela antes de que venza el contador:
                </Text>

                <Button
                  title="Cancelar pánico accidental"
                  variant="danger"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  selectStepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.panicContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.scale.headlineLg,
    color: brand.espresso,
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  selectorWrap: {
    width: '100%',
  },
  backButton: {
    marginTop: spacing.lg,
    width: '100%',
    minHeight: 52,
  },
  confirmingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: brand.border,
    elevation: 4,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panicContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.panic,
    marginRight: spacing.xs,
  },
  activeTagText: {
    ...typography.scale.labelCaps,
    color: colors.onPanicContainer,
    letterSpacing: 0.8,
  },
  confirmingTitle: {
    ...typography.scale.headlineMd,
    color: colors.panic,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confirmingSubtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  countdownBox: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  cancelHint: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  cancelButton: {
    width: '100%',
    minHeight: 52,
  },
});
