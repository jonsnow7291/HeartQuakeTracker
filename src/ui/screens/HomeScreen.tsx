import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmergency } from '../hooks/useEmergency';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import { PanicModal } from './PanicModal';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

export interface HomeScreenProps {
  onNavigateToPrevention: () => void;
  onNavigateToDuring: () => void;
  onNavigateToAfter: () => void;
  onNavigateToEmergency: () => void;
  onNavigateToRescuer?: () => void;
  onNavigateToPermissions?: () => void;
  onNavigateToDev?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToProfile?: () => void;
}

/**
 * HomeScreen (D1 - Rediseño oficial según inicio_earthquake_tracker)
 * Componente principal con jerarquía visual de tres fases:
 * - Cabecera oficial con identidad de marca
 * - Saludo y pastilla de estado en línea / sin conexión
 * - Emblema central de marca con anillo trifásico y lema
 * - Barra de micro-alerta de la Red Sísmica Nacional
 * - Tres tarjetas semánticas principales: Prevención (Verde), Durante (Ocre), Después (Azul)
 * - Botón SOS pastilla de 52 px para acceso inmediato
 * - Accesos a utilidades (Socorrista, Permisos, Dev)
 */
export function HomeScreen({
  onNavigateToPrevention,
  onNavigateToDuring,
  onNavigateToAfter,
  onNavigateToEmergency,
  onNavigateToRescuer,
  onNavigateToPermissions,
  onNavigateToDev,
  onNavigateToAlerts,
  onNavigateToProfile,
}: HomeScreenProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { state: emergencyState, selectSeverity, cancel, requestPanic } = useEmergency();
  const { sync, power, permissions } = useServices();

  const [panicModalVisible, setPanicModalVisible] = useState(false);

  // Suscripciones al estado del sistema
  const syncStatus = useSubscribe(sync ? (cb) => sync.subscribe(cb) : undefined, sync?.getStatus());
  const batteryLevel = power ? power.getLevel() : 100;
  const isEmergencyActive = emergencyState.phase === 'ACTIVE';

  // Si la emergencia se activa externamente, cierra el selector y redirige a la pantalla activa
  useEffect(() => {
    if (isEmergencyActive && panicModalVisible) {
      setPanicModalVisible(false);
      onNavigateToEmergency();
    }
  }, [isEmergencyActive, panicModalVisible, onNavigateToEmergency]);

  // RF-05: Solicitar permisos si faltan antes del pánico, pero nunca bloquear la activación
  const handlePanicButtonPress = async () => {
    if (isEmergencyActive) {
      onNavigateToEmergency();
      return;
    }
    try {
      const { missing } = await requestPanic();
      for (const kind of missing) {
        await permissions.request(kind);
      }
    } catch {
      // Se continúa incluso si se deniega
    }
    setPanicModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header Superior Fijo de Marca */}
      <View style={styles.topHeader}>
        <View style={styles.headerBrandRow}>
          <LogoMark size={32} />
          <View style={styles.headerTitles}>
            <Text style={styles.headerEyebrow}>SISMOS TRACKER</Text>
            <Text style={styles.headerTitle} accessibilityRole="header">Inicio</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            onPress={onNavigateToAlerts}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Icon name="notifications" size={22} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            onPress={onNavigateToProfile}
            style={styles.avatarButton}
          >
            <View style={styles.avatarCircle}>
              <Icon name="person" size={18} color={brand.cream} />
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Emergencia Activa (si aplica) */}
        {isEmergencyActive ? (
          <Pressable
            onPress={onNavigateToEmergency}
            style={styles.activeEmergencyBanner}
            accessibilityRole="button"
            accessibilityLabel="Emergencia en curso. Ver estado."
            accessibilityLiveRegion="assertive"
          >
            <View style={styles.emergencyBannerRow}>
              <Icon name="crisis_alert" size={24} color={colors.onPanic} filled />
              <View style={styles.emergencyBannerText}>
                <Text style={styles.emergencyBannerTitle}>EMERGENCIA EN CURSO</Text>
                <Text style={styles.emergencyBannerSubtitle}>
                  Baliza de socorro y linterna activadas. Toca para ver estado.
                </Text>
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* Saludo de bienvenida y Pastilla de Estado */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextCol}>
            <View style={styles.monitoringBadgeRow}>
              <View style={styles.monitoringDot} />
              <Text style={styles.monitoringText}>MONITOREO ACTIVO</Text>
            </View>
            <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
            <Text style={styles.welcomeSubtitle}>¿En qué podemos ayudarte hoy?</Text>
          </View>

          {/* Pastilla de Conexión */}
          <View style={styles.statusPill}>
            <Icon
              name={syncStatus?.online ? 'wifi_tethering' : 'cloud_off'}
              size={16}
              color={syncStatus?.online ? brand.during : colors.status.offline}
            />
            <Text style={styles.statusPillText} numberOfLines={1}>
              {syncStatus?.online ? 'En línea' : 'Sin conexión'}
            </Text>
          </View>
        </View>

        {/* Emblema Central de Marca y Tríada Infográfica */}
        <View style={styles.brandCenterContainer}>
          <View style={styles.emblemWrapper}>
            {/* Arcos concéntricos coloreados por fase */}
            <Svg
              width={208}
              height={208}
              viewBox="0 0 200 200"
              style={styles.emblemArcs}
            >
              {/* Prevención (Verde) */}
              <Circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke={brand.prevention}
                strokeWidth={6}
                strokeDasharray="110 430"
                strokeDashoffset={190}
                strokeLinecap="round"
                opacity={0.9}
              />
              {/* Durante (Ocre) */}
              <Circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke={brand.during}
                strokeWidth={6}
                strokeDasharray="110 430"
                strokeDashoffset={55}
                strokeLinecap="round"
                opacity={0.95}
              />
              {/* Después (Azul acero) */}
              <Circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke={brand.after}
                strokeWidth={6}
                strokeDasharray="110 430"
                strokeDashoffset={460}
                strokeLinecap="round"
                opacity={0.9}
              />
            </Svg>

            {/* Escudo Circular Central */}
            <View style={styles.emblemCore}>
              <LogoMark size={64} />
              <View style={styles.emblemBrandText}>
                <Text style={styles.emblemMainWord}>EARTHQUAKE</Text>
                <Text style={styles.emblemSubWord}>— TRACKER —</Text>
              </View>
            </View>

            {/* Burbuja FASE 1: PREVENCIÓN (Izquierda) */}
            <Pressable
              onPress={onNavigateToPrevention}
              style={[styles.phaseBubble, styles.bubbleLeft]}
              accessibilityRole="button"
              accessibilityLabel="Ir a Prevención"
              hitSlop={8}
            >
              <View style={[styles.bubbleIconCircle, { backgroundColor: brand.prevention }]}>
                <Icon name="menu_book" size={18} color={brand.onPhase} />
              </View>
            </Pressable>

            {/* Burbuja FASE 2: DURANTE (Arriba) */}
            <Pressable
              onPress={onNavigateToDuring}
              style={[styles.phaseBubble, styles.bubbleTop]}
              accessibilityRole="button"
              accessibilityLabel="Ir a Durante el Sismo"
              hitSlop={8}
            >
              <View style={[styles.bubbleIconCircle, { backgroundColor: brand.during }]}>
                <Icon name="bluetooth" size={18} color={brand.onPhase} />
              </View>
            </Pressable>

            {/* Burbuja FASE 3: DESPUÉS (Derecha) */}
            <Pressable
              onPress={onNavigateToAfter}
              style={[styles.phaseBubble, styles.bubbleRight]}
              accessibilityRole="button"
              accessibilityLabel="Ir a Después del Sismo"
              hitSlop={8}
            >
              <View style={[styles.bubbleIconCircle, { backgroundColor: brand.after }]}>
                <Icon name="groups" size={18} color={brand.onPhase} />
              </View>
            </Pressable>
          </View>

          {/* Lema Ribbon */}
          <View style={styles.mottoRibbon}>
            <Text style={styles.mottoItem}>Prepara</Text>
            <Text style={styles.mottoSeparator}>•</Text>
            <Text style={styles.mottoItem}>Protégete</Text>
            <Text style={styles.mottoSeparator}>•</Text>
            <Text style={styles.mottoItem}>Actúa</Text>
            <Text style={styles.mottoSeparator}>•</Text>
            <Text style={styles.mottoItem}>Ayuda</Text>
          </View>
        </View>

        {/* Live Micro Alert Bar */}
        <View style={styles.alertBarCard}>
          <View style={styles.alertBarLeft}>
            <View style={styles.alertBarIconWrapper}>
              <Icon name="graphic_eq" size={18} color={colors.onSecondaryContainer} />
            </View>
            <View style={styles.alertBarTextCol}>
              <Text style={styles.alertBarTitle} numberOfLines={1}>
                Detección local
              </Text>
              <Text style={styles.alertBarSubtitle} numberOfLines={1}>
                Acelerómetro del teléfono activo, sin sacudidas anómalas
              </Text>
            </View>
          </View>
          <Icon name="check_circle" size={20} color={colors.outlineVariant} />
        </View>

        {/* Tres Tarjetas Semánticas de Acción */}
        <View style={styles.actionCardsGroup}>
          {/* Card 1: PREVENCIÓN */}
          <Pressable
            onPress={onNavigateToPrevention}
            style={[styles.actionCard, { borderColor: 'rgba(61, 125, 84, 0.5)' }]}
            accessibilityRole="button"
            accessibilityLabel="Módulo de Prevención. Aprende y prepárate antes de un sismo."
          >
            <View style={styles.actionCardBody}>
              <View style={[styles.actionCardIconHalo, { backgroundColor: 'rgba(61, 125, 84, 0.12)' }]}>
                <View style={[styles.actionCardIconInner, { backgroundColor: brand.prevention }]}>
                  <Icon name="menu_book" size={20} color={brand.onPhase} />
                </View>
              </View>
              <View style={styles.actionCardTextCol}>
                <View style={styles.actionCardHeaderRow}>
                  <Text style={styles.actionCardTitle}>Prevención</Text>
                  <View style={[styles.actionCardTag, { backgroundColor: 'rgba(61, 125, 84, 0.15)' }]}>
                    <Text style={[styles.actionCardTagText, { color: colors.onTertiaryContainer }]}>Antes</Text>
                  </View>
                </View>
                <Text style={styles.actionCardDesc}>Aprende y prepárate antes de un sismo</Text>
              </View>
            </View>
            <View style={styles.actionCardArrow}>
              <Icon name="arrow_forward" size={18} color={brand.espresso} />
            </View>
          </Pressable>

          {/* Card 2: DURANTE */}
          <Pressable
            onPress={onNavigateToDuring}
            style={[styles.actionCard, { borderColor: 'rgba(212, 122, 34, 0.6)' }]}
            accessibilityRole="button"
            accessibilityLabel="Módulo Durante el sismo. Actúa correctamente durante un sismo."
          >
            <View style={styles.actionCardBody}>
              <View style={[styles.actionCardIconHalo, { backgroundColor: 'rgba(212, 122, 34, 0.15)' }]}>
                <View style={[styles.actionCardIconInner, { backgroundColor: brand.during }]}>
                  <Icon name="bluetooth" size={20} color={brand.onPhase} />
                </View>
              </View>
              <View style={styles.actionCardTextCol}>
                <View style={styles.actionCardHeaderRow}>
                  <Text style={styles.actionCardTitle}>Durante</Text>
                  <View style={[styles.actionCardTag, { backgroundColor: 'rgba(212, 122, 34, 0.15)' }]}>
                    <Text style={[styles.actionCardTagText, { color: colors.onSecondaryContainer }]}>Acción Rápida</Text>
                  </View>
                </View>
                <Text style={styles.actionCardDesc}>Actúa correctamente durante un sismo</Text>
              </View>
            </View>
            <View style={styles.actionCardArrow}>
              <Icon name="arrow_forward" size={18} color={brand.espresso} />
            </View>
          </Pressable>

          {/* Card 3: DESPUÉS */}
          <Pressable
            onPress={onNavigateToAfter}
            style={[styles.actionCard, { borderColor: 'rgba(63, 111, 142, 0.6)' }]}
            accessibilityRole="button"
            accessibilityLabel="Módulo Después del sismo. Comunícate, reporta y recibe ayuda."
          >
            <View style={styles.actionCardBody}>
              <View style={[styles.actionCardIconHalo, { backgroundColor: 'rgba(63, 111, 142, 0.15)' }]}>
                <View style={[styles.actionCardIconInner, { backgroundColor: brand.after }]}>
                  <Icon name="groups" size={20} color={brand.onPhase} />
                </View>
              </View>
              <View style={styles.actionCardTextCol}>
                <View style={styles.actionCardHeaderRow}>
                  <Text style={styles.actionCardTitle}>Después</Text>
                  <View style={[styles.actionCardTag, { backgroundColor: 'rgba(63, 111, 142, 0.15)' }]}>
                    <Text style={[styles.actionCardTagText, { color: colors.onAuxiliaryContainer }]}>Auxilio</Text>
                  </View>
                </View>
                <Text style={styles.actionCardDesc}>Comunícate, reporta y recibe ayuda</Text>
              </View>
            </View>
            <View style={styles.actionCardArrow}>
              <Icon name="arrow_forward" size={18} color={brand.espresso} />
            </View>
          </Pressable>
        </View>

        {/* Botón SOS / Enviar mi ubicación (Pastilla 52 px) */}
        <View style={styles.sosContainer}>
          <Pressable
            onPress={handlePanicButtonPress}
            style={styles.sosButton}
            accessibilityRole="button"
            accessibilityLabel="Botón SOS. Enviar mi ubicación o activar emergencia."
            accessibilityLiveRegion="polite"
          >
            <Icon name="crisis_alert" size={20} color={colors.secondaryContainer} filled />
            <Text style={styles.sosButtonText}>Botón SOS / Enviar mi ubicación</Text>
          </Pressable>
        </View>

        {/* Sección de Utilidades Secundarias */}
        <View style={styles.utilitiesSection}>
          <Text style={styles.utilitiesSectionTitle}>UTILIDADES Y ACCESOS</Text>

          <View style={styles.utilitiesList}>
            {onNavigateToRescuer ? (
              <Pressable
                onPress={onNavigateToRescuer}
                style={styles.utilityItem}
                accessibilityRole="button"
                accessibilityLabel="Modo Socorrista"
              >
                <View style={styles.utilityItemLeft}>
                  <Icon name="medical_services" size={20} color={brand.espresso} />
                  <View style={styles.utilityItemTextCol}>
                    <Text style={styles.utilityItemTitle}>Modo Socorrista</Text>
                    <Text style={styles.utilityItemDesc}>Recepción de fichas médicas de rescate</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            ) : null}

            {onNavigateToPermissions ? (
              <Pressable
                onPress={onNavigateToPermissions}
                style={styles.utilityItem}
                accessibilityRole="button"
                accessibilityLabel="Permisos del sistema"
              >
                <View style={styles.utilityItemLeft}>
                  <Icon name="security" size={20} color={brand.espresso} />
                  <View style={styles.utilityItemTextCol}>
                    <Text style={styles.utilityItemTitle}>Permisos del Sistema</Text>
                    <Text style={styles.utilityItemDesc}>Bluetooth, ubicación y sensores</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            ) : null}

            {__DEV__ && onNavigateToDev ? (
              <Pressable
                onPress={onNavigateToDev}
                style={styles.utilityItem}
                accessibilityRole="button"
                accessibilityLabel="Escenarios de prueba"
              >
                <View style={styles.utilityItemLeft}>
                  <Icon name="developer_mode" size={20} color={brand.espresso} />
                  <View style={styles.utilityItemTextCol}>
                    <Text style={styles.utilityItemTitle}>Escenarios de Prueba (DEV)</Text>
                    <Text style={styles.utilityItemDesc}>Simulación de sismos y sensores</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Emergencia y Selección de Gravedad (RF-05) */}
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

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.cream,
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenEdgePadding,
    backgroundColor: brand.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 213, 195, 0.4)',
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  headerTitles: {
    flexDirection: 'column',
  },
  headerEyebrow: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: brand.during,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: brand.espresso,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingTop: spacing.spaceSm,
    paddingBottom: spacing.space3xl + 24, // Margen para el AppTabBar
  },
  activeEmergencyBanner: {
    backgroundColor: brand.terracotta,
    borderRadius: borderRadius.md,
    padding: spacing.spaceSm,
    marginBottom: spacing.spaceMd,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencyBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  emergencyBannerText: {
    flex: 1,
  },
  emergencyBannerTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.onPanic,
    letterSpacing: 0.5,
  },
  emergencyBannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.onPanic,
    opacity: 0.95,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 8,
  },
  greetingTextCol: {
    flex: 1,
    flexDirection: 'column',
    marginRight: 4,
  },
  monitoringBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  monitoringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.prevention,
  },
  monitoringText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: brand.prevention,
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: brand.espresso,
    letterSpacing: -0.2,
  },
  welcomeSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: brand.espresso,
    flexShrink: 0,
  },
  brandCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.spaceSm,
    paddingBottom: spacing.spaceXs,
  },
  emblemWrapper: {
    width: 208,
    height: 208,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emblemArcs: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  emblemCore: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 213, 195, 0.6)',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  emblemBrandText: {
    alignItems: 'center',
    marginTop: 2,
  },
  emblemMainWord: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: brand.espresso,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  emblemSubWord: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: brand.during,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  // Ancho fijo de 56 px: el círculo (36 px) queda centrado sobre el anillo aunque la etiqueta sea más ancha.
  phaseBubble: {
    position: 'absolute',
    width: 56,
    alignItems: 'center',
  },
  bubbleLeft: {
    left: -14,
    top: '50%',
    marginTop: -18,
  },
  bubbleTop: {
    top: -4,
    left: '50%',
    marginLeft: -28,
  },
  bubbleRight: {
    right: -14,
    top: '50%',
    marginTop: -18,
  },
  bubbleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mottoRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.spaceSm,
  },
  mottoItem: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mottoSeparator: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: brand.during,
  },
  alertBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 213, 195, 0.6)',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginTop: spacing.spaceXs,
    marginBottom: spacing.spaceSm,
  },
  alertBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  alertBarIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBarTextCol: {
    flex: 1,
  },
  alertBarTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: brand.espresso,
  },
  alertBarSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.onSurfaceVariant,
  },
  actionCardsGroup: {
    gap: 12,
    marginBottom: spacing.spaceSm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionCardIconHalo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardIconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTextCol: {
    flex: 1,
  },
  actionCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: brand.espresso,
    textTransform: 'uppercase',
    letterSpacing: -0.1,
  },
  actionCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  actionCardTagText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  actionCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sosContainer: {
    paddingTop: 4,
    marginBottom: spacing.spaceMd,
  },
  sosButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  sosButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: brand.onFill,
    letterSpacing: 0.2,
  },
  utilitiesSection: {
    marginTop: spacing.spaceXs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 213, 195, 0.6)',
    paddingTop: spacing.spaceSm,
  },
  utilitiesSectionTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.spaceSm,
  },
  utilitiesList: {
    gap: 8,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.default,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 213, 195, 0.6)',
  },
  utilityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  utilityItemTextCol: {
    flex: 1,
  },
  utilityItemTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: brand.espresso,
  },
  utilityItemDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.onSurfaceVariant,
  },
});
