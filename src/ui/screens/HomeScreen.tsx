import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { PanicButton } from '../components/PanicButton';
import { StatusPill } from '../components/StatusPill';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { useEmergency } from '../hooks/useEmergency';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';
import { PanicModal } from './PanicModal';

export interface HomeScreenProps {
  onNavigateToPrevention: () => void;
  onNavigateToDuring: () => void;
  onNavigateToAfter: () => void;
  onNavigateToEmergency: () => void;
}

export function HomeScreen({
  onNavigateToPrevention,
  onNavigateToDuring,
  onNavigateToAfter,
  onNavigateToEmergency,
}: HomeScreenProps) {
  const { state: emergencyState, selectSeverity, cancel } = useEmergency();
  const { sync, power } = useServices();

  const [panicModalVisible, setPanicModalVisible] = useState(false);

  // Subscriptions to system state
  const syncStatus = useSubscribe(sync ? (cb) => sync.subscribe(cb) : undefined, sync?.getStatus());
  const batteryLevel = power ? power.getLevel() : 100;

  const isEmergencyActive = emergencyState.phase === 'ACTIVE';

  const handlePanicButtonPress = () => {
    if (isEmergencyActive) {
      onNavigateToEmergency();
    } else {
      setPanicModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Bar Pills */}
        <View style={styles.statusBar}>
          <StatusPill
            type={syncStatus?.online ? 'online' : 'offline'}
            label={syncStatus?.online ? 'En Línea' : 'Sin Conexión'}
          />
          {batteryLevel < 20 ? <StatusPill type="lowPower" label={`Batería ${batteryLevel}%`} /> : null}
          {emergencyState.beaconActive ? <StatusPill type="beacon" /> : null}
        </View>

        {/* Emergency Active Alert */}
        {isEmergencyActive ? (
          <Banner
            kind="critical"
            title="EMERGENCIA EN CURSO"
            message="Tu baliza de socorro y linterna están activadas."
            actionText="Ver estado"
            onAction={onNavigateToEmergency}
          />
        ) : null}

        {/* Panic Button Call-To-Action */}
        <View style={styles.panicSection}>
          <Text style={styles.headerTitle}>EarthQuakeTracker</Text>
          <Text style={styles.headerSubtitle}>
            En caso de sismo violento o atrapamiento, presiona el botón para auxilio inmediato.
          </Text>

          <PanicButton onPress={handlePanicButtonPress} active={isEmergencyActive} />
        </View>

        {/* Quick Action Hubs */}
        <Text style={styles.sectionTitle}>Módulos de Preparación</Text>

        <Card onPress={onNavigateToDuring} style={styles.actionCard}>
          <Text style={styles.cardEmoji}>🚨</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Durante el Sismo</Text>
            <Text style={styles.cardDescription}>Agáchate, Cúbrete y Agárrate. Avisa si estás a salvo.</Text>
          </View>
        </Card>

        <Card onPress={onNavigateToPrevention} style={styles.actionCard}>
          <Text style={styles.cardEmoji}>📚</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Antes: Prevención y Guías</Text>
            <Text style={styles.cardDescription}>Mochila 72h, plan familiar, aseguramiento y quizzes.</Text>
          </View>
        </Card>

        <Card onPress={onNavigateToAfter} style={styles.actionCard}>
          <Text style={styles.cardEmoji}>🏥</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Después: Socorro y Reportes</Text>
            <Text style={styles.cardDescription}>Puntos de auxilio, zonas seguras y reporte de daños.</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Panic Modal (Step 1 Severity + Step 2 Countdown) */}
      <PanicModal
        visible={panicModalVisible}
        onClose={() => setPanicModalVisible(false)}
        onSeveritySelected={async (severity) => {
          await selectSeverity(severity);
        }}
        onCancelCountdown={async () => {
          await cancel();
          setPanicModalVisible(false);
        }}
        onActivated={() => {
          setPanicModalVisible(false);
          onNavigateToEmergency();
        }}
      />
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
  statusBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  panicSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  headerTitle: {
    ...typography.scale.headline,
    color: lightPalette.onBackground,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.scale.title,
    color: lightPalette.onBackground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.scale.label,
    fontSize: 15,
    color: lightPalette.onSurface,
  },
  cardDescription: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    fontSize: 13,
    marginTop: spacing.xxs,
  },
});
