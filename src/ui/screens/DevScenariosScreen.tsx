import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { DevScenario } from '../../contracts/dev';
import { useServices } from '../hooks/useServices';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { lightPalette } from '../theme/theme';
import { spacing, typography } from '../theme/tokens';

export interface DevScenariosScreenProps {
  onBack: () => void;
}

const DEFAULT_SCENARIOS: DevScenario[] = [
  { id: 'sismo_detectado', title: 'Sismo Detectado', description: 'Simula sacudida de acelerómetro > 0.03g activando alerta sísmica' },
  { id: 'mesh_5_nodos', title: 'Malla con 5 Nodos', description: 'Simula 5 dispositivos cercanos con distintas gravedades y distancias' },
  { id: 'bluetooth_apagado', title: 'Bluetooth Apagado', description: 'Simula fallo BLUETOOTH_OFF al intentar escanear o emitir baliza' },
  { id: 'permisos_denegados', title: 'Permisos Denegados', description: 'Simula PERMISSION_DENIED en ubicación y notificaciones' },
  { id: 'contenido_corrupto', title: 'Contenido Corrupto', description: 'Simula fallo CONTENT_CORRUPT en paquete de guías educativas' },
  { id: 'sync_parcial', title: 'Sync Parcial', description: 'Simula timeout de red dejando reportes en cola de sincronización' },
  { id: 'socorrista_recibe_ficha', title: 'Socorrista Recibe Ficha', description: 'Emula llegada de ficha médica completa vía GATT de rescate' },
  { id: 'bateria_15', title: 'Batería 15% (Ahorro)', description: 'Fuerza modo lowPower con ráfagas espaciadas de baliza y flash' },
  { id: 'sin_sensores', title: 'Sin Acelerómetro', description: 'Simula hardware sin soporte de sensores de movimiento (NO_SENSORS)' },
  { id: 'sin_mapa_cacheado', title: 'Sin Mapa Cacheado', description: 'Simula ausencia de MBTiles locales activando estado MAP_NOT_CACHED' },
  { id: 'offline_total', title: 'Modo Avión / Offline Total', description: 'Desconecta toda interfaz de red simulando zona de catástrofe' },
];

export function DevScenariosScreen({ onBack }: DevScenariosScreenProps) {
  const { dev } = useServices();

  const [scenarios, setScenarios] = useState<DevScenario[]>(DEFAULT_SCENARIOS);
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);

  useEffect(() => {
    if (dev) {
      setScenarios(dev.list());
      setActiveScenarios(dev.active());
    }
  }, [dev]);

  const handleToggleScenario = (id: string) => {
    if (dev) {
      dev.activate(id);
      setActiveScenarios(dev.active());
    } else {
      setActiveScenarios((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleReset = () => {
    if (dev) {
      dev.reset();
      setActiveScenarios([]);
    } else {
      setActiveScenarios([]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button title="← Volver" variant="outline" onPress={onBack} style={styles.backBtn} />
        <Button title="Restablecer Todo" variant="danger" onPress={handleReset} style={styles.resetBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Panel de Pruebas: DevScenarios</Text>
        <Text style={styles.subtitle}>
          Activa escenarios en memoria para verificar la UI sin requerir sismos o hardware físico real.
        </Text>

        <View style={styles.activeCounter}>
          <Text style={styles.activeText}>
            Escenarios activos: {activeScenarios.length}
          </Text>
        </View>

        {scenarios.map((sc) => {
          const isActive = activeScenarios.includes(sc.id);
          return (
            <Card key={sc.id} style={styles.scenarioCard}>
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioTitle}>{sc.title}</Text>
                <Chip
                  label={isActive ? 'ACTIVO' : 'INACTIVO'}
                  selected={isActive}
                  onPress={() => handleToggleScenario(sc.id)}
                />
              </View>
              <Text style={styles.scenarioDesc}>{sc.description}</Text>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightPalette.outlineVariant,
  },
  backBtn: {
    minWidth: 80,
  },
  resetBtn: {
    minWidth: 130,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.scale.headline,
    color: lightPalette.onBackground,
  },
  subtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  activeCounter: {
    backgroundColor: lightPalette.primaryContainer,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  activeText: {
    ...typography.scale.label,
    color: lightPalette.onPrimaryContainer,
  },
  scenarioCard: {
    marginBottom: spacing.sm,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scenarioTitle: {
    ...typography.scale.title,
    fontSize: 16,
    color: lightPalette.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  scenarioDesc: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    fontSize: 13,
  },
});
