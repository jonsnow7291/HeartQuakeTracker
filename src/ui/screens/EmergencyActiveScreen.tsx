import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { useEmergency } from '../hooks/useEmergency';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { lightPalette } from '../theme/theme';
import { spacing, typography, borderRadius } from '../theme/tokens';

export interface EmergencyActiveScreenProps {
  onStopFinished: () => void;
  onNavigateToDuring: () => void;
}

export function EmergencyActiveScreen({ onStopFinished, onNavigateToDuring }: EmergencyActiveScreenProps) {
  const { state: emergencyState, stop } = useEmergency();
  const { mesh, power } = useServices();

  const [stopping, setStopping] = useState(false);

  const meshStatus = useSubscribe(mesh ? (cb) => mesh.subscribeStatus(cb) : undefined, mesh?.getStatus());
  const nearbyNodes = mesh ? mesh.listNearby() : [];
  const batteryLevel = power ? power.getLevel() : 100;

  const handleStopEmergency = () => {
    Alert.alert(
      '¿Detener señal de auxilio?',
      'Se desactivará la baliza BLE, la linterna y el tono sonoro de emergencia.',
      [
        { text: 'Continuar transmitiendo', style: 'cancel' },
        {
          text: 'Sí, detener auxilio',
          style: 'destructive',
          onPress: async () => {
            setStopping(true);
            try {
              await stop();
              onStopFinished();
            } finally {
              setStopping(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Urgent Header */}
        <View style={styles.header}>
          <Text style={styles.alertBadge}>EMERGENCIA EN CURSO</Text>
          <Text style={styles.severityText}>
            Estado reportado: {emergencyState.severity || 'ATRAPADO'}
          </Text>
        </View>

        {/* Battery warning if low */}
        {emergencyState.lowPower ? (
          <Banner
            kind="warning"
            title="Modo Ahorro Activo (< 20% batería)"
            message="Los pulsos de linterna y baliza se espacian automáticamente para prolongar la señal."
          />
        ) : null}

        {/* Transmission Card */}
        <Card style={styles.beaconCard}>
          <View style={styles.cardRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.cardHeaderTitle}>Baliza de Socorro Emitiendo</Text>
          </View>
          <Text style={styles.cardBodyText}>
            Tu terminal está emitiendo paquetes de radiofrecuencia Bluetooth de alta prioridad a socorristas y teléfonos en un radio de hasta 30 metros.
          </Text>
          <View style={styles.pillsRow}>
            <StatusPill type="beacon" label="BLE Activo" />
            <StatusPill type={meshStatus?.bluetoothOn ? 'online' : 'offline'} label="Malla P2P" />
          </View>
        </Card>

        {/* Nearby Mesh Nodes */}
        <Card style={styles.nodesCard}>
          <Text style={styles.cardHeaderTitle}>Red Comunitaria Cercana</Text>
          <Text style={styles.nodesCountText}>
            {nearbyNodes.length} {nearbyNodes.length === 1 ? 'dispositivo detectado' : 'dispositivos detectados'}
          </Text>
          <Text style={styles.cardBodyText}>
            {nearbyNodes.length > 0
              ? 'Los mensajes de socorro están siendo retransmitidos automáticamente por la malla local.'
              : 'Buscando teléfonos cercanos en la red mallada...'}
          </Text>
        </Card>

        {/* Action button to During Instructions */}
        <Button
          title="Ver Guía de Autoprotección (Durante)"
          variant="secondary"
          onPress={onNavigateToDuring}
          style={styles.duringButton}
        />

        {/* Stop Emergency Button */}
        <Button
          title="Detener Señal de Emergencia"
          variant="danger"
          loading={stopping}
          onPress={handleStopEmergency}
          style={styles.stopButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  container: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertBadge: {
    ...typography.scale.label,
    fontSize: 14,
    color: lightPalette.onPanic,
    backgroundColor: lightPalette.panic,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    letterSpacing: 1,
    textAlign: 'center',
    overflow: 'hidden',
  },
  severityText: {
    ...typography.scale.title,
    color: lightPalette.onBackground,
    marginTop: spacing.sm,
  },
  beaconCard: {
    borderColor: lightPalette.panic,
    borderWidth: 2,
    backgroundColor: lightPalette.panicContainer,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: lightPalette.panic,
    marginRight: spacing.sm,
  },
  cardHeaderTitle: {
    ...typography.scale.title,
    fontSize: 18,
    color: lightPalette.onSurface,
  },
  cardBodyText: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  nodesCard: {
    marginTop: spacing.md,
  },
  nodesCountText: {
    ...typography.scale.headline,
    color: lightPalette.primary,
    marginVertical: spacing.xxs,
  },
  duringButton: {
    marginTop: spacing.xl,
  },
  stopButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
