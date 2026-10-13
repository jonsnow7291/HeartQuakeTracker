import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { DevScenario } from '../../contracts/dev';
import { useServices } from '../hooks/useServices';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export interface DevScenariosScreenProps {
  onBack?: () => void;
}

const DEFAULT_SCENARIOS: DevScenario[] = [
  { id: 'sismo_detectado', title: 'Sismo Detectado', description: 'Simula sacudida de acelerómetro > 0.03g activando alerta sísmica inmediata' },
  { id: 'mesh_5_nodos', title: 'Malla con 5 Nodos', description: 'Simula 5 dispositivos cercanos con distintas gravedades y distancias' },
  { id: 'bluetooth_apagado', title: 'Bluetooth Apagado', description: 'Simula fallo BLUETOOTH_OFF al intentar escanear o emitir baliza' },
  { id: 'permisos_denegados', title: 'Permisos Denegados', description: 'Simula PERMISSION_DENIED en ubicación y notificaciones' },
  { id: 'contenido_corrupto', title: 'Contenido Corrupto', description: 'Simula fallo CONTENT_CORRUPT en paquete de guías educativas' },
  { id: 'sync_parcial', title: 'Sync Parcial', description: 'Simula timeout de red dejando reportes en cola de sincronización' },
  { id: 'socorrista_recibe_ficha', title: 'Socorrista Recibe Ficha', description: 'Emula llegada de ficha médica completa vía GATT de rescate' },
  { id: 'bateria_15', title: 'Batería 15% (Ahorro)', description: 'Fuerza modo lowPower con ráfagas espaciadas de baliza y flash' },
  { id: 'sin_sensores', title: 'Sin Acelerómetro', description: 'Simula hardware sin soporte de sensores de movimiento (NO_SENSORS)' },
  { id: 'sin_mapa_cacheado', title: 'Sin Mapa Cacheado', description: 'Simula ausencia de MBTiles locales activando estado MAP_NOT_CACHED' },
  { id: 'offline_total', title: 'Modo Avión / Offline Total', description: 'Desconecta toda interfaz de red simulando zona de catástrofe sin internet' },
];

export function DevScenariosScreen({ onBack }: DevScenariosScreenProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { dev } = useServices();

  const [scenarios, setScenarios] = useState<DevScenario[]>(DEFAULT_SCENARIOS);
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

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
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="DevScenarios"
        eyebrow="PANEL DE SIMULACIÓN"
        tone="espresso"
        onBack={handleBack}
        right={
          <TouchableOpacity
            style={styles.resetHeaderBtn}
            onPress={handleReset}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Restablecer todos los escenarios a inactivo"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="restart_alt" size={18} color={colors.onPanic} />
            <Text style={styles.resetHeaderBtnText}>Reset</Text>
          </TouchableOpacity>
        }
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Simulación y Control de Estados</Text>
          <Text style={styles.subtitle}>
            Activa escenarios en memoria para verificar la UI de alertas, mapas, pánico y malla sin necesidad de sismos o hardware físico.
          </Text>

          <View style={styles.activeCounter}>
            <Icon name="tune" size={18} color={brand.during} />
            <Text style={styles.activeText}>
              Escenarios activos actualmente: {activeScenarios.length}
            </Text>
          </View>

          <View style={styles.list}>
            {scenarios.map((sc) => {
              const isActive = activeScenarios.includes(sc.id);
              return (
                <View key={sc.id} style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <Text style={styles.scenarioTitle}>{sc.title}</Text>
                    <TouchableOpacity
                      style={[styles.chipPill, isActive ? styles.chipPillActive : styles.chipPillInactive]}
                      onPress={() => handleToggleScenario(sc.id)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Escenario ${sc.title}: ${isActive ? 'Activo' : 'Inactivo'}`}
                      accessibilityState={{ selected: isActive }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isActive ? <Icon name="check" size={14} color={colors.onPrimary} style={{ marginRight: 2 }} /> : null}
                      <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.scenarioDesc}>{sc.description}</Text>
                </View>
              );
            })}
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
  resetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.panic,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  resetHeaderBtnText: {
    ...typography.scale.labelCaps,
    color: colors.onPanic,
    fontWeight: '800',
    fontSize: 10,
  },
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.space3xl,
  },
  title: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  subtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  activeCounter: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  activeText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  scenarioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    elevation: 1,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scenarioTitle: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
    flex: 1,
    marginRight: spacing.sm,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    minHeight: 32,
  },
  chipPillActive: {
    backgroundColor: brand.fill,
  },
  chipPillInactive: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: brand.border,
  },
  chipText: {
    ...typography.scale.labelCaps,
    fontWeight: '800',
    fontSize: 10,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  chipTextInactive: {
    color: colors.onSurfaceVariant,
  },
  scenarioDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
