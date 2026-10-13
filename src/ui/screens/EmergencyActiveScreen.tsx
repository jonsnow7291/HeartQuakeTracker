import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import { Banner } from '../components/Banner';
import { SeveritySelector } from '../components/SeveritySelector';
import { useEmergency } from '../hooks/useEmergency';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { shareStatus } from '../features/share/shareStatus';
import { Severity } from '../../contracts/types';
import type { MedicalProfile } from '../../contracts/medical';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

export interface EmergencyActiveScreenProps {
  onStopFinished: () => void;
  onNavigateToDuring: () => void;
}

export function EmergencyActiveScreen({
  onStopFinished,
  onNavigateToDuring,
}: EmergencyActiveScreenProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { state: emergencyState, stop, selectSeverity, cancel } = useEmergency();
  const { mesh, power, medical } = useServices();

  const [stopping, setStopping] = useState(false);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);

  // Estados de controles de hardware (RF-06)
  const [ledActive, setLedActive] = useState(true);
  const [soundActive, setSoundActive] = useState(true);

  // Red y batería reales
  const meshStatus = useSubscribe(mesh ? (cb) => mesh.subscribeStatus(cb) : undefined, mesh?.getStatus());
  const batteryLevel = power ? power.getLevel() : 100;

  // Carga de ficha médica para el payload comprimido (RF-13)
  useEffect(() => {
    let mounted = true;
    if (medical) {
      medical.get().then((prof) => {
        if (mounted) setMedicalProfile(prof);
      }).catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [medical]);

  // Temporizador de sesión activa SOS (hh:mm:ss)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const startTime = emergencyState.startedAt
      ? new Date(emergencyState.startedAt).getTime()
      : Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [emergencyState.startedAt]);

  const formatTimer = (total: number) => {
    const hrs = String(Math.floor(total / 3600)).padStart(2, '0');
    const mins = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const secs = String(total % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Contador de gracia para falso positivo (3s)
  const [graceCountdown, setGraceCountdown] = useState(3);
  useEffect(() => {
    if (graceCountdown <= 0) return;
    const t = setInterval(() => {
      setGraceCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [graceCountdown]);

  // Manejo de cancelación rápida o reporte de error
  const handleCancelGrace = async () => {
    if (graceCountdown > 0) {
      try {
        await cancel();
        onStopFinished();
      } catch {
        await stop();
        onStopFinished();
      }
    } else {
      Alert.alert(
        '¿Reportar error involuntario?',
        'Se desactivará la baliza y se notificará que estás a salvo.',
        [
          { text: 'Continuar alerta', style: 'cancel' },
          {
            text: 'Desactivar',
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
    }
  };

  // Radar animación
  const radarAnim = useRef(new Animated.Value(0.7)).current;
  const radarOpacity = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(radarAnim, {
          toValue: 1.4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(radarOpacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [radarAnim, radarOpacity]);

  // Selección de gravedad (RF-05)
  const handleSelectSeverity = async (sev: Severity) => {
    try {
      await selectSeverity(sev);
    } catch {
      // Estado se conserva localmente
    }
  };

  // Detención completa de emergencia
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

  // Llamada de emergencia directa
  const handleCallEmergency = () => {
    Linking.openURL('tel:123').catch(() => {
      Linking.openURL('tel:911').catch(() => {});
    });
  };

  // Formato de coordenadas
  const formatCoordinates = () => {
    if (emergencyState.lastPosition) {
      const { lat, lon } = emergencyState.lastPosition;
      return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
    }
    return 'Sin posición GPS'; // sin dato: no se inventa una ubicación
  };

  const accuracyText = emergencyState.lastPosition?.accuracyM
    ? `±${Math.round(emergencyState.lastPosition.accuracyM)}m`
    : 'sin dato';

  const medicalSummary = medicalProfile
    ? `${medicalProfile.bloodType ?? 'Sin dato'} • ${medicalProfile.allergies.length > 0 ? medicalProfile.allergies.join(', ') : 'Sin alergias'}`
    : 'Sin ficha médica';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Cabecera Oficial del Mockup */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleStopEmergency}
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Volver y finalizar auxilio"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow_back" size={24} color={brand.espresso} />
          </TouchableOpacity>
          <View style={styles.headerLogoWrap}>
            <LogoMark size={28} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Alerta Activa Durante
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Compartir estado de emergencia"
            hitSlop={8}
            onPress={() => {
              shareStatus('HELP', emergencyState.lastPosition);
            }}
          >
            <Icon name="share" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Icon name="person" size={18} color={brand.cream} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Alerta de Impacto Inmediato */}
        <View style={styles.alertBanner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <View style={styles.bannerGlow} />

          <View style={styles.bannerTopRow}>
            <View style={styles.modeTag}>
              <View style={styles.bannerPingDot} />
              <Text style={styles.modeTagText}>Modo Crisis Activo • RF-05</Text>
            </View>

            <View style={styles.timerRow}>
              <Icon name="timer" size={16} color={colors.onPanic} />
              <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>Baliza de Rescate en Terreno</Text>
          <Text style={styles.bannerSubtitle}>
            Emisión continua BLE 4.2 y señal audible activa para cuadrillas caninas y rescatistas.
          </Text>

          {/* Falso positivo / Cancelación Rápida */}
          <View style={styles.graceBox}>
            <View style={styles.graceLeft}>
              <Icon name="info" size={20} color={colors.secondaryContainer} />
              <Text style={styles.graceText} numberOfLines={1}>
                ¿Fue un error involuntario?
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.graceBtn,
                graceCountdown === 0 && styles.graceBtnExpired,
              ]}
              onPress={handleCancelGrace}
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={graceCountdown > 0 ? `Cancelar SOS (${graceCountdown} segundos restantes)` : 'Reportar error involuntario'}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.graceBtnText,
                  graceCountdown === 0 && styles.graceBtnTextExpired,
                ]}
              >
                {graceCountdown > 0 ? `Cancelar SOS (${graceCountdown}s)` : 'Reportar Error'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advertencia de batería baja si aplica */}
        {emergencyState.lowPower ? (
          <View style={styles.lowPowerNotice}>
            <Banner
              kind="warning"
              title="Modo Ahorro Activo (< 20% batería)"
              message="Los pulsos de linterna y baliza se espacian automáticamente para prolongar la señal."
            />
          </View>
        ) : null}

        {/* Selector de Estado de Gravedad (RF-05: 2 toques) */}
        <View style={styles.triageCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <Icon name="medical_services" size={20} color={brand.espresso} />
              <Text style={styles.cardTitle} numberOfLines={2}>
                Estado Vital & Gravedad
              </Text>
            </View>
            <View style={styles.chipTag}>
              <Text style={styles.chipTagText}>2 TOQUES REQUERIDOS</Text>
            </View>
          </View>

          <Text style={styles.cardExplainer}>
            Tu estado se inyecta directamente en el payload comprimido de telemetría de emergencia.
          </Text>

          <SeveritySelector
            layout="row"
            onSelect={handleSelectSeverity}
            selected={emergencyState.severity ?? 'ATRAPADO'}
          />
        </View>

        {/* Señalización Física de Supervivencia (RF-06 & RNF-02) */}
        <View style={styles.signalsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <Icon name="sensors" size={20} color={brand.espresso} />
              <Text style={styles.cardTitle}>Señales Físicas de Localización</Text>
            </View>
            <View style={styles.batteryChip}>
              <Icon name="battery_charging_full" size={14} color={colors.onSuccessContainer} />
              <Text style={styles.batteryChipText}>
                {`Batería ${batteryLevel}%`}
              </Text>
            </View>
          </View>

          {/* Control 1: Estroboscópico SOS */}
          <View style={styles.hardwareControlRow}>
            <View style={styles.controlLeft}>
              <View
                style={[
                  styles.controlIconCircle,
                  { backgroundColor: ledActive ? colors.secondaryContainer : colors.surfaceVariant },
                ]}
              >
                <Icon
                  name="flash_on"
                  size={22}
                  color={ledActive ? brand.during : colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Pulso LED Estroboscópico</Text>
                <Text style={styles.controlSub}>
                  Código Morse S.O.S. (••• — — — •••)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setLedActive(!ledActive)}
              style={[
                styles.switchPill,
                { backgroundColor: ledActive ? brand.during : colors.surfaceVariant },
              ]}
              accessible={true}
              accessibilityRole="switch"
              accessibilityState={{ checked: ledActive }}
              accessibilityLabel="Alternar linterna estroboscópica SOS"
              hitSlop={8}
            >
              <View
                style={[
                  styles.switchKnob,
                  { transform: [{ translateX: ledActive ? 22 : 0 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Control 2: Sirena Acústica Alta Frecuencia */}
          <View style={styles.hardwareControlRow}>
            <View style={styles.controlLeft}>
              <View
                style={[
                  styles.controlIconCircle,
                  { backgroundColor: soundActive ? colors.panicContainer : colors.surfaceVariant },
                ]}
              >
                <Icon
                  name="volume_up"
                  size={22}
                  color={soundActive ? colors.panic : colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Alarma Acústica K9</Text>
                <Text style={styles.controlSub}>Frecuencia penetrante 3 kHz</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSoundActive(!soundActive)}
              style={[
                styles.switchPill,
                { backgroundColor: soundActive ? colors.panic : colors.surfaceVariant },
              ]}
              accessible={true}
              accessibilityRole="switch"
              accessibilityState={{ checked: soundActive }}
              accessibilityLabel="Alternar alarma acústica de alta frecuencia"
              hitSlop={8}
            >
              <View
                style={[
                  styles.switchKnob,
                  { transform: [{ translateX: soundActive ? 22 : 0 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Medidor de Presión Sonora */}
          <View style={styles.splMeter}>
            <View style={styles.splLeft}>
              <Icon name="equalizer" size={18} color={brand.espresso} />
              <Text style={styles.splLabel}>Intensidad de Salida:</Text>
            </View>
            <View style={styles.splBarsGroup}>
              <View style={[styles.splBar, { height: 12, backgroundColor: soundActive ? brand.during : colors.outlineVariant }]} />
              <View style={[styles.splBar, { height: 16, backgroundColor: soundActive ? brand.during : colors.outlineVariant }]} />
              <View style={[styles.splBar, { height: 20, backgroundColor: soundActive ? brand.during : colors.outlineVariant }]} />
              <View style={[styles.splBar, { height: 24, backgroundColor: soundActive ? colors.panic : colors.outlineVariant }]} />
              <Text style={[styles.splValText, { color: soundActive ? colors.panic : colors.onSurfaceVariant }]}>
                {soundActive ? 'Activa' : 'Apagada'}
              </Text>
            </View>
          </View>
        </View>

        {/* Baliza BLE Activa & Radar de Proximidad (RF-07 & RF-13) */}
        <View style={styles.radarCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <Icon name="bluetooth_searching" size={20} color={brand.espresso} />
              <Text style={styles.cardTitle}>Baliza de Proximidad BLE 4.2</Text>
            </View>
            <View style={styles.txChip}>
              <Text style={styles.txChipText}>Tx: 1.2 seg</Text>
            </View>
          </View>

          {/* Visualizador Radar Concéntrico */}
          <View style={styles.radarVisualContainer}>
            <View style={styles.radarCircleWrap}>
              <Animated.View
                style={[
                  styles.radarPingRing,
                  {
                    transform: [{ scale: radarAnim }],
                    opacity: radarOpacity,
                  },
                ]}
              />
              <View style={[styles.radarRing, { width: 140, height: 140, borderRadius: 70 }]} />
              <View style={[styles.radarRing, { width: 96, height: 96, borderRadius: 48 }]} />

              <View style={styles.radarCenterTower}>
                <Icon name="cell_tower" size={24} color={colors.secondaryContainer} />
              </View>
            </View>

            <Text style={styles.radarDistanceText}>Radio Estimado: 15m - 30m</Text>
            <Text style={styles.radarMeshText}>
              Malla P2P con terminales de brigadistas activos
            </Text>
          </View>

          {/* Ficha Técnica Comprimida (AES-256) */}
          <View style={styles.payloadBox}>
            <View style={styles.payloadHeader}>
              <Text style={styles.payloadTitle}>Payload Estructurado RF-13</Text>
              <View style={styles.payloadLockRow}>
                <Icon name="lock" size={14} color={brand.during} />
                <Text style={styles.payloadLockText}>AES-256 Encrypted</Text>
              </View>
            </View>

            <View style={styles.payloadGrid}>
              <View style={styles.payloadTile}>
                <Text style={styles.payloadLabel}>ID Rescatado</Text>
                <Text style={styles.payloadVal}>Efímero (rota cada 15 min)</Text>
              </View>
              <View style={styles.payloadTile}>
                <Text style={styles.payloadLabel}>Ficha Médica</Text>
                <Text style={styles.payloadVal} numberOfLines={1}>
                  {medicalSummary}
                </Text>
              </View>
            </View>

            <View style={styles.coordinatesTile}>
              <View>
                <Text style={styles.payloadLabel}>Coordenadas Satelitales (Cache)</Text>
                <Text style={styles.coordinatesVal}>{formatCoordinates()}</Text>
              </View>
              <View style={styles.accuracyBadge}>
                <Text style={styles.accuracyText}>{accuracyText}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tip de Supervivencia */}
        <View style={styles.tipCard}>
          <Icon name="tips_and_updates" size={18} color={colors.onSurfaceVariant} />
          <Text style={styles.tipText}>
            Si estás bajo escombros: inhala despacio, golpea superficies sólidas en intervalos regulares de 3 golpes.
          </Text>
        </View>

        {/* Botones de Acción Primaria de Emergencia */}
        <View style={styles.bottomButtonsCol}>
          {/* Llamada 911 / Central */}
          <TouchableOpacity
            style={styles.btnCall911}
            onPress={handleCallEmergency}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Llamada de Emergencia 911 o Cruz Roja"
          >
            <Icon name="phone_in_talk" size={22} color={colors.panic} />
            <Text style={styles.btnCall911Text}>Llamada de Emergencia 911 / Cruz Roja</Text>
          </TouchableOpacity>

          {/* Desactivar Alarma y Volver */}
          <TouchableOpacity
            style={styles.btnDeactivate}
            onPress={handleStopEmergency}
            disabled={stopping}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Finalizar Operación y Desactivar Baliza"
            accessibilityState={{ disabled: stopping }}
          >
            <Icon name="stop_circle" size={18} color={brand.espresso} />
            <Text style={styles.btnDeactivateText}>
              {stopping ? 'Deteniendo señal...' : 'Finalizar Operación & Desactivar Baliza'}
            </Text>
          </TouchableOpacity>

          {/* Ver Guía de Autoprotección (Durante) */}
          <TouchableOpacity
            style={styles.btnGuideLink}
            onPress={onNavigateToDuring}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ver Guía de Autoprotección Durante el Sismo"
          >
            <Icon name="menu_book" size={18} color={brand.during} />
            <Text style={styles.btnGuideLinkText}>Ver Guía de Autoprotección (Durante)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenEdgePadding,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxs,
  },
  headerLogoWrap: {
    marginRight: spacing.xs,
  },
  headerTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.space3xl,
    gap: spacing.md,
  },

  // Banner Alerta de Impacto Inmediato
  alertBanner: {
    width: '100%',
    backgroundColor: colors.terracottaAlert, // Gradiente de error a secundario sintetizado
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  bannerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  bannerPingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onPanic,
    marginRight: 6,
  },
  modeTagText: {
    ...typography.scale.labelCaps,
    color: colors.onPanic,
    letterSpacing: 0.8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    ...typography.scale.labelMd,
    color: colors.onPanic,
    fontWeight: '700',
  },
  bannerTitle: {
    ...typography.scale.headlineLgMobile,
    color: colors.onPanic,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  bannerSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onPanic,
    opacity: 0.92,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  graceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.default,
  },
  graceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: spacing.xs,
  },
  graceText: {
    ...typography.scale.bodySm,
    color: colors.onPanic,
    flexShrink: 1,
  },
  graceBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  graceBtnExpired: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  graceBtnText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  graceBtnTextExpired: {
    color: colors.onPanic,
  },
  lowPowerNotice: {
    width: '100%',
  },

  // Triage Card
  triageCard: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    flexShrink: 1,
  },
  cardTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  chipTag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  chipTagText: {
    ...typography.scale.labelCaps,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: '800',
  },
  cardExplainer: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },

  // Señales Físicas Card
  signalsCard: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.sm,
  },
  batteryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  batteryChipText: {
    ...typography.scale.labelCaps,
    fontSize: 10,
    color: colors.onSuccessContainer,
    fontWeight: '800',
  },
  hardwareControlRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.xs,
  },
  controlIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlInfo: {
    flex: 1,
  },
  controlTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
  },
  controlSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  switchPill: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  splMeter: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splLabel: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    fontWeight: '500',
  },
  splBarsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  splBar: {
    width: 6,
    borderRadius: 3,
  },
  splValText: {
    ...typography.scale.labelMd,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Radar Card
  radarCard: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.sm,
  },
  txChip: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  txChipText: {
    ...typography.scale.labelCaps,
    fontSize: 10,
    color: colors.onTertiaryContainer,
    fontWeight: '800',
  },
  radarVisualContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  radarCircleWrap: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  radarPingRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: brand.during,
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 122, 34, 0.4)',
  },
  radarCenterTower: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  radarDistanceText: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
  },
  radarMeshText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },

  // Payload Box
  payloadBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  payloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  payloadTitle: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  payloadLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payloadLockText: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '800',
  },
  payloadGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  payloadTile: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    padding: 8,
    borderRadius: borderRadius.default,
  },
  payloadLabel: {
    ...typography.scale.labelCaps,
    fontSize: 9,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  payloadVal: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  coordinatesTile: {
    backgroundColor: colors.surfaceVariant,
    padding: 8,
    borderRadius: borderRadius.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordinatesVal: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    fontFamily: typography.fontFamily.monospace,
    fontWeight: '700',
  },
  accuracyBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  accuracyText: {
    ...typography.scale.labelCaps,
    fontSize: 10,
    color: colors.onTertiaryContainer,
    fontWeight: '800',
  },

  // Tip Card
  tipCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  tipText: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    flex: 1,
    lineHeight: 18,
  },

  // Botones Inferiores
  bottomButtonsCol: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  btnCall911: {
    width: '100%',
    height: 56,
    minHeight: 52,
    borderRadius: 9999,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    elevation: 4,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  btnCall911Text: {
    ...typography.scale.labelLg,
    color: brand.onFill,
    fontWeight: '700',
  },
  btnDeactivate: {
    width: '100%',
    height: 48,
    minHeight: 48,
    borderRadius: 9999,
    backgroundColor: colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnDeactivateText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  btnGuideLink: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnGuideLinkText: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
});
