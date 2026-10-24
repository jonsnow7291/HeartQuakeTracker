import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import type { AlertItem } from '../../contracts/sensors';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Banner } from '../components/Banner';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';

const DRILL_DAY_OPTIONS = [
  { id: 'today', label: 'Hoy', daysOffset: 0 },
  { id: 'tomorrow', label: 'Mañana', daysOffset: 1 },
  { id: 'in_3_days', label: 'En 3 días', daysOffset: 3 },
  { id: 'in_1_week', label: 'En 1 semana', daysOffset: 7 },
];

const DRILL_TIME_OPTIONS = [
  { id: '08:00', label: '8:00', hour: 8, minute: 0 },
  { id: '10:00', label: '10:00', hour: 10, minute: 0 },
  { id: '14:00', label: '14:00', hour: 14, minute: 0 },
  { id: '18:00', label: '18:00', hour: 18, minute: 0 },
];

function computeDrillIso(daysOffset: number, timeStr: string): string {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0] ?? '10', 10);
  const minute = parseInt(parts[1] ?? '00', 10);
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function AlertsScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { alerts, sensors, dev } = useServices();

  const [alertList, setAlertList] = useState<AlertItem[]>([]);
  const [filterKind, setFilterKind] = useState<'ALL' | 'SEISMIC' | 'DRILL'>('ALL');
  const [sensorsAvailable, setSensorsAvailable] = useState<boolean>(true);
  const [drillModalVisible, setDrillModalVisible] = useState<boolean>(false);
  const [drillTitle, setDrillTitle] = useState<string>('Simulacro de Evacuación Familiar');
  const [drillDayOffset, setDrillDayOffset] = useState<number>(1);
  const [drillTimeId, setDrillTimeId] = useState<string>('10:00');
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      const isSinSensores = dev?.active().includes('sin_sensores');
      const available = !isSinSensores && sensors.isAvailable();
      setSensorsAvailable(available);

      const page = await alerts.list();
      setAlertList(page.items);
    } catch (err) {
      console.warn('[AlertsScreen] Error al cargar alertas:', err);
    }
  }, [alerts, sensors, dev]);

  useEffect(() => {
    loadAlerts();

    const unsub = alerts.subscribeNew((newItem) => {
      setAlertList((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
    });

    return () => unsub();
  }, [loadAlerts, alerts]);

  // Alerta sísmica confirmada o crítica para destacar en hero
  const activeCriticalAlert = alertList.find(
    (a) => a.kind === 'SEISMIC' && a.seismic?.level === 'CONFIRMED'
  );

  const filteredAlerts = alertList.filter((a) => {
    if (filterKind === 'ALL') return true;
    return a.kind === filterKind;
  });

  const handleScheduleDrill = async () => {
    if (!drillTitle.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa un título para el simulacro.');
      return;
    }
    try {
      setIsScheduling(true);
      const iso = computeDrillIso(drillDayOffset, drillTimeId);
      await alerts.scheduleDrill(iso, drillTitle.trim());
      Alert.alert(
        'Simulacro Agendado',
        `El simulacro "${drillTitle}" se ha programado para preparar a tu familia y comunidad.`
      );
      setDrillModalVisible(false);
      await loadAlerts();
    } catch {
      Alert.alert('Error', 'No se pudo agendar el simulacro.');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatAlertTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Cabecera oficial del Centro de Alertas */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerEyebrow}>SISMOS TRACKER</Text>
          <Text style={styles.headerTitle}>Alertas</Text>
        </View>

        <TouchableOpacity
          style={styles.scheduleActionBtn}
          onPress={() => setDrillModalVisible(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Agendar nuevo simulacro de evacuación"
        >
          <Icon name="event" size={18} color={brand.espresso} />
          <Text style={styles.scheduleActionText}>Agendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Active Urgent Alert Hero Card (Mockup) o Estado de Monitoreo Sereno */}
        {activeCriticalAlert ? (
          <View style={styles.criticalHeroCard}>
            <View style={styles.criticalHeroHeader}>
              <View style={styles.criticalIconBadge}>
                <Icon name="vital_signs" size={28} color={colors.onPanic} filled />
              </View>
              <View style={styles.criticalHeaderTexts}>
                <View style={styles.criticalTitleRow}>
                  <Text style={styles.criticalTitle}>Alerta sísmica</Text>
                  <View style={styles.criticalPillBadge}>
                    <Text style={styles.criticalPillText}>EN CURSO</Text>
                  </View>
                </View>
                <Text style={styles.criticalSubtitle}>Posible sismo detectado</Text>
              </View>
            </View>

            {/* Chips de detalles en vivo */}
            <View style={styles.criticalChipsRow}>
              <View style={styles.criticalChip}>
                <Icon name="speed" size={16} color={colors.onPanic} />
                <Text style={styles.criticalChipText}>
                  Pico:{' '}
                  <Text style={styles.boldWhite}>
                    {activeCriticalAlert.seismic?.peakG.toFixed(3) ?? '0.050'} g
                  </Text>
                </Text>
              </View>
              <View style={styles.criticalChip}>
                <Icon name="hub" size={16} color={colors.onPanic} />
                <Text style={styles.criticalChipText}>
                  Quórum:{' '}
                  <Text style={styles.boldWhite}>
                    {activeCriticalAlert.seismic?.quorumNodes ?? 3} nodos
                  </Text>
                </Text>
              </View>
              <View style={styles.criticalChip}>
                <Icon name="schedule" size={16} color={colors.onPanic} />
                <Text style={styles.criticalChipText}>
                  {formatAlertTime(activeCriticalAlert.ts)}
                </Text>
              </View>
            </View>

            {/* Botón de acción inmediata: Ver protocolo durante */}
            <TouchableOpacity
              style={styles.protocolActionBtn}
              onPress={() => navigation.navigate('During')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Ver protocolo de acción durante el sismo"
            >
              <Icon name="shield" size={20} color={brand.espresso} filled />
              <Text style={styles.protocolActionText}>Ver protocolo de acción</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.calmMonitoringCard}>
            <View style={styles.calmMonitoringHeader}>
              <View style={styles.calmIconBadge}>
                <Icon name="shield" size={24} color={colors.onTertiaryContainer} filled />
              </View>
              <View style={styles.calmTexts}>
                <View style={styles.calmTitleRow}>
                  <Text style={styles.calmTitle}>Monitoreo Sísmico Activo</Text>
                  <View style={styles.calmStatusPill}>
                    <Text style={styles.calmStatusText}>EN VIGILANCIA</Text>
                  </View>
                </View>
                <Text style={styles.calmSubtitle}>
                  Sin sismos anómalos detectados en tu cuadrante en este momento.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Real-time Status Card with Bluetooth & Sensors */}
        <Card style={styles.sensorStatusCard}>
          <View style={styles.sensorStatusLeft}>
            <View style={styles.sensorsIconBox}>
              <Icon name="sensors" size={20} color={colors.onTertiaryContainer} />
            </View>
            <View style={styles.sensorsInfo}>
              <Text style={styles.sensorsTitle}>Red de monitoreo activa</Text>
              <Text style={styles.sensorsSubtitle}>
                {sensorsAvailable
                  ? 'Acelerómetro local activo • Buscando dispositivos cercanos por BLE'
                  : 'Modo sin acelerómetro • Red comunitaria ciudadana'}
              </Text>
            </View>
          </View>
          <View style={styles.pulsingGreenDot} />
        </Card>

        {/* Advertencia si el hardware no tiene acelerómetro */}
        {!sensorsAvailable && (
          <View style={styles.bannerMargin}>
            <Banner
              kind="warning"
              title="Acelerómetro no disponible"
              message="Este dispositivo no cuenta con sensor inercial compatible. Recibirás alertas sísmicas propagadas por la red de malla ciudadana BLE."
            />
          </View>
        )}

        {/* Sección: Historial de alertas */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historyTitle}>Historial de alertas</Text>
            <View style={styles.filterGroup}>
              <Icon name="tune" size={16} color={brand.during} />
              <Text style={styles.filterLabel}>Filtro:</Text>
            </View>
          </View>

          {/* Fila de Filtros (Chips interactivos) */}
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                filterKind === 'ALL' && styles.filterPillActive,
              ]}
              onPress={() => setFilterKind('ALL')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: filterKind === 'ALL' }}
              accessibilityLabel="Ver todas las alertas"
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterKind === 'ALL' && styles.filterPillTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                filterKind === 'SEISMIC' && styles.filterPillActive,
              ]}
              onPress={() => setFilterKind('SEISMIC')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: filterKind === 'SEISMIC' }}
              accessibilityLabel="Filtrar por eventos sísmicos"
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterKind === 'SEISMIC' && styles.filterPillTextActive,
                ]}
              >
                Sismos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                filterKind === 'DRILL' && styles.filterPillActive,
              ]}
              onPress={() => setFilterKind('DRILL')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: filterKind === 'DRILL' }}
              accessibilityLabel="Filtrar por simulacros"
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterKind === 'DRILL' && styles.filterPillTextActive,
                ]}
              >
                Simulacros
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de alertas */}
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="notifications_off" size={40} color={colors.outline} />
               <Text style={styles.emptyTitle}>Sin alertas registradas</Text>
               <Text style={styles.emptyDesc}>
                 No hay eventos sísmicos ni simulacros en este filtro. La app continuará monitoreando en segundo plano.
               </Text>
            </View>
          ) : (
            <View style={styles.alertsList}>
              {filteredAlerts.map((item) => {
                const isSeismic = item.kind === 'SEISMIC';
                const isDrill = item.kind === 'DRILL';

                let iconBoxBg = colors.surfaceVariant;
                let iconColor: string = brand.espresso;
                let iconName = 'info';
                let tagLabel = 'Guía';
                let tagBg = colors.surfaceVariant;
                let tagColor = colors.onSurfaceVariant;

                if (isSeismic) {
                  iconBoxBg = colors.secondaryContainer;
                  iconColor = colors.onSecondaryContainer;
                  iconName = 'warning';
                  tagLabel = item.seismic?.peakG
                    ? `Pico ${item.seismic.peakG.toFixed(2)}g`
                    : 'Mag 5.2';
                  tagBg = colors.secondaryContainer;
                  tagColor = colors.onSecondaryContainer;
                } else if (isDrill) {
                  iconBoxBg = colors.tertiaryContainer;
                  iconColor = colors.onTertiaryContainer;
                  iconName = 'campaign';
                  tagLabel = 'Simulacro';
                  tagBg = colors.tertiaryContainer;
                  tagColor = colors.onTertiaryContainer;
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.alertItemCard}
                    onPress={() => {
                      if (isSeismic && item.seismic?.level === 'CONFIRMED') {
                        navigation.navigate('During');
                      }
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Alerta: ${item.title}`}
                  >
                    <View style={[styles.alertIconCircle, { backgroundColor: iconBoxBg }]}>
                      <Icon name={iconName} size={24} color={iconColor} filled />
                    </View>

                    <View style={styles.alertContent}>
                      <View style={styles.alertTopRow}>
                        <Text style={styles.alertItemTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={[styles.alertTagPill, { backgroundColor: tagBg }]}>
                          <Text style={[styles.alertTagText, { color: tagColor }]}>
                            {tagLabel}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.alertItemSub}>
                        {formatAlertTime(item.ts)} • {item.body || 'Evento registrado'}
                      </Text>
                    </View>

                    <Icon name="chevron_right" size={20} color={colors.outline} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Action: Reportar sensación sísmica no reportada (Mockup) */}
        <View style={styles.reportCalloutCard}>
          <View style={styles.reportHeaderRow}>
            <Icon name="contact_support" size={22} color={brand.during} />
            <Text style={styles.reportTitle}>¿Sentiste un movimiento no reportado?</Text>
          </View>
          <Text style={styles.reportDesc}>
            Tu reporte colaborativo ayuda al centro sismológico a calcular aceleraciones locales y emitir avisos tempranos a tu comunidad.
          </Text>
          <TouchableOpacity
            style={styles.reportActionBtn}
            onPress={() => navigation.navigate('Report')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Reportar sensación sísmica colaborativa"
          >
            <Icon name="add_location_alt" size={18} color={colors.onPrimary} />
            <Text style={styles.reportActionBtnText}>Reportar sensación sísmica</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Agendar Simulacro */}
      <Modal visible={drillModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Icon name="event" size={24} color={brand.espresso} />
              <Text style={styles.modalTitle}>Agendar Simulacro</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Programa un simulacro para practicar la evacuación y el uso de la app con tu familia.
            </Text>

            <Text style={styles.inputLabel}>Nombre del evento o simulacro:</Text>
            <TextInput
              style={styles.textInput}
              value={drillTitle}
              onChangeText={setDrillTitle}
              placeholder="Ej.: Simulacro Nacional de Evacuación"
              placeholderTextColor={colors.outline}
               accessible={true}
               accessibilityLabel="Título del simulacro"
            />

            {/* Selector de Día (A-13) */}
            <Text style={styles.inputLabel}>Día programado:</Text>
            <View style={styles.drillChipsRow}>
              {DRILL_DAY_OPTIONS.map((opt) => {
                const isSelected = drillDayOffset === opt.daysOffset;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.drillChip,
                      isSelected && styles.drillChipSelected,
                    ]}
                    onPress={() => setDrillDayOffset(opt.daysOffset)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Seleccionar día: ${opt.label}`}
                  >
                    <Text
                      style={[
                        styles.drillChipText,
                        isSelected && styles.drillChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selector de Hora (A-13) */}
            <Text style={styles.inputLabel}>Hora programada:</Text>
            <View style={styles.drillChipsRow}>
              {DRILL_TIME_OPTIONS.map((opt) => {
                const isSelected = drillTimeId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.drillChip,
                      isSelected && styles.drillChipSelected,
                    ]}
                    onPress={() => setDrillTimeId(opt.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Seleccionar hora: ${opt.label}`}
                  >
                    <Text
                      style={[
                        styles.drillChipText,
                        isSelected && styles.drillChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setDrillModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Programar"
                variant="primary"
                loading={isScheduling}
                onPress={handleScheduleDrill}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenEdgePadding,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: brand.border,
    },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerEyebrow: {
    ...typography.scale.labelCaps,
    color: brand.during,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    fontWeight: '800',
    marginTop: 1,
  },
  scheduleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: brand.sand,
    borderWidth: 1,
    borderColor: brand.border,
  },
  scheduleActionText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  container: {
    padding: spacing.screenEdgePadding,
    paddingBottom: spacing.bottomNavHeight + spacing.xl,
  },
  criticalHeroCard: {
    backgroundColor: brand.during,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginBottom: spacing.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  criticalHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  criticalIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalHeaderTexts: {
    flex: 1,
  },
  criticalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  criticalTitle: {
    ...typography.scale.headlineLgMobile,
    color: colors.onPanic,
    fontWeight: '800',
  },
  criticalPillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  criticalPillText: {
    ...typography.scale.labelCaps,
    color: colors.onPanic,
    fontWeight: '800',
  },
  criticalSubtitle: {
    ...typography.scale.bodyMd,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },
  criticalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  criticalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  criticalChipText: {
    ...typography.scale.labelMd,
    color: colors.onPanic,
  },
  boldWhite: {
    fontWeight: '800',
    color: colors.onPanic,
  },
  protocolActionBtn: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  protocolActionText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  calmMonitoringCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
  },
  calmMonitoringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calmIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmTexts: {
    flex: 1,
  },
  calmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calmTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
  },
  calmStatusPill: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  calmStatusText: {
    ...typography.scale.labelCaps,
    color: colors.onTertiaryContainer,
    fontWeight: '800',
  },
  calmSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  sensorStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  sensorStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sensorsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorsInfo: {
    flex: 1,
  },
  sensorsTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  sensorsSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  pulsingGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.prevention,
  },
  bannerMargin: {
    marginBottom: spacing.md,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  historyTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    fontWeight: '800',
    fontSize: 18,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabel: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterPill: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: brand.fill,
    borderColor: brand.espresso,
  },
  filterPillText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  alertsList: {
    gap: spacing.xs,
  },
  alertItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.sm,
    minHeight: touchTargets.min,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  alertItemTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  alertTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  alertTagText: {
    ...typography.scale.labelCaps,
    fontWeight: '800',
    fontSize: 10,
  },
  alertItemSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  reportCalloutCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    borderWidth: 1,
    borderColor: brand.border,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  reportTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 15,
  },
  reportDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  reportActionBtn: {
    height: 48,
    backgroundColor: brand.fill,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: touchTargets.min,
  },
  reportActionBtnText: {
    ...typography.scale.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  modalTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: brand.espresso,
    backgroundColor: brand.cream,
    ...typography.scale.bodyMd,
    marginBottom: spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  drillChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  drillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: brand.border,
  },
  drillChipSelected: {
    backgroundColor: brand.fill,
    borderColor: brand.espresso,
  },
  drillChipText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '600',
  },
  drillChipTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
