import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Severity } from '../../contracts/types';
import { SeveritySelector } from '../components/SeveritySelector';
import { Countdown } from '../components/Countdown';
import { Button } from '../components/Button';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

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
            <>
              <Text style={styles.title}>¿Cuál es tu situación?</Text>
              <Text style={styles.subtitle}>
                Toca una opción para activar tu baliza de socorro.
              </Text>

              <SeveritySelector
                onSelect={handleSelectSeverity}
                selected={selectedSeverity}
              />

              <Button
                title="Volver atrás"
                variant="outline"
                onPress={onClose}
                style={styles.backButton}
              />
            </>
          ) : (
            <View style={styles.confirmingContainer}>
              <Text style={styles.confirmingTitle}>EMITIENDO ALERTA DE AUXILIO</Text>
              <Text style={styles.confirmingSubtitle}>
                Se activará la linterna estroboscópica, el tono acústico y la baliza BLE.
              </Text>

              <Countdown durationSeconds={3} onFinish={handleCountdownFinish} />

              <Button
                title="Cancelar pánico accidental"
                variant="danger"
                onPress={handleCancel}
                style={styles.cancelButton}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.scale.headline,
    color: lightPalette.panic,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.lg,
  },
  confirmingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmingTitle: {
    ...typography.scale.title,
    color: lightPalette.panic,
    textAlign: 'center',
    fontWeight: '800',
  },
  confirmingSubtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xxl,
    width: '100%',
  },
});
