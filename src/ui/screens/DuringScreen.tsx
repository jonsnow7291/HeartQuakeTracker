import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import type { RootStackParamList } from '../navigation/types';
import { useEmergency } from '../hooks/useEmergency';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { shareStatus } from '../features/share/shareStatus';
import { useLocation } from '../hooks/useLocation';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

/* ==========================================================================
   ILUSTRACIONES VECTORIALES OFFLINE (Agáchate, Cúbrete, Agárrate)
   ========================================================================== */

function DropIllustration({ size = 56 }: { size?: number }) {
  const { colors, brand } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="1. Agáchate hacia el suelo">
      <Path d="M 8 52 L 56 52" stroke={colors.outline} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={20} cy={30} r={5} fill={brand.during} />
      <Path d="M 22 34 Q 30 36 38 42" stroke={brand.espresso} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M 23 35 L 17 52" stroke={brand.espresso} strokeWidth={3} strokeLinecap="round" />
      <Path d="M 38 42 L 46 48 L 36 52" stroke={brand.espresso} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 48 18 L 48 28 M 44 24 L 48 28 L 52 24" stroke={brand.during} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CoverIllustration({ size = 56 }: { size?: number }) {
  const { colors, brand } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="2. Cúbrete bajo mesa firme">
      <Path d="M 6 54 L 58 54" stroke={colors.outline} strokeWidth={2.5} strokeLinecap="round" />
      {/* Mesa resistente */}
      <Rect x={12} y={22} width={40} height={6} rx={2} fill={brand.espresso} />
      <Rect x={14} y={28} width={4} height={26} rx={1} fill={brand.espresso} />
      <Rect x={46} y={28} width={4} height={26} rx={1} fill={brand.espresso} />
      {/* Persona resguardada */}
      <Circle cx={30} cy={38} r={4.5} fill={brand.during} />
      <Path d="M 32 42 Q 38 44 40 54" stroke={brand.espresso} strokeWidth={3} strokeLinecap="round" />
      <Path d="M 26 40 Q 28 34 34 36" stroke={brand.espresso} strokeWidth={2.5} strokeLinecap="round" />
      {/* Objetos cayendo desviados */}
      <Path d="M 20 10 L 23 14 M 42 8 L 45 12" stroke={brand.during} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function HoldIllustration({ size = 56 }: { size?: number }) {
  const { colors, brand } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="3. Agárrate hasta que cese">
      <Path d="M 6 54 L 58 54" stroke={colors.outline} strokeWidth={2.5} strokeLinecap="round" />
      {/* Pata de mesa */}
      <Rect x={22} y={14} width={8} height={40} rx={2} fill={brand.espresso} />
      {/* Manos sujetando firmemente */}
      <Path d="M 14 28 C 18 28 22 26 30 26 C 31 27 31 30 30 31 C 22 31 18 32 14 32" fill={brand.during} stroke={brand.espresso} strokeWidth={1.5} />
      <Path d="M 14 36 C 18 36 22 34 30 34 C 31 35 31 38 30 39 C 22 39 18 40 14 40" fill={brand.during} stroke={brand.espresso} strokeWidth={1.5} />
      {/* Cuerpo anclado */}
      <Path d="M 38 46 Q 30 46 26 40" stroke={brand.espresso} strokeWidth={3} strokeLinecap="round" />
      {/* Líneas de estabilidad */}
      <Path d="M 36 22 C 38 20 42 20 44 22 M 34 18 C 38 15 44 15 48 18" stroke={brand.during} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/* ==========================================================================
   PANTALLA: DuranteScreen
   ========================================================================== */

export function DuringScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { markSafe, state } = useEmergency();
  const loc = useLocation();
  const { mesh, sensors } = useServices();

  const meshStatus = useSubscribe(mesh ? (cb) => mesh.subscribeStatus(cb) : undefined, mesh?.getStatus());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animación del punto pulsante
  const pingAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pingAnim]);

  // Manejador "Estoy a salvo"
  const handleMarkSafe = async () => {
    try {
      await markSafe();
      setToastMessage('¡Marcado como a salvo! Notificando a tu red.');
      setTimeout(() => {
        setToastMessage(null);
        navigation.navigate('After');
      }, 1200);
    } catch {
      navigation.navigate('After');
    }
  };

  // Manejador "Necesito ayuda"
  const handleNeedHelp = () => {
    navigation.navigate('Panic');
  };

  const isBluetoothConnected = Boolean(meshStatus?.bluetoothOn);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Cabecera Oficial del Mockup */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
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
            accessibilityLabel="Compartir estado"
            hitSlop={8}
            onPress={() => {
              shareStatus('HELP', loc.position ?? state.lastPosition);
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
        {/* Phase Alert Cap / Status Header */}
        <View style={styles.phaseAlertCap}>
          <View style={styles.phaseCapAccent} />
          <View style={styles.modeActiveRow}>
            <View style={styles.pingContainer}>
              <Animated.View style={[styles.pingDotOuter, { transform: [{ scale: pingAnim }] }]} />
              <View style={styles.pingDotInner} />
            </View>
            <Text style={styles.modeActiveText}>MODO ACTIVO</Text>
          </View>
          <Text style={styles.phaseTitle}>DURANTE</Text>
          <Text style={styles.phaseSubtitle}>Mantén la calma y actúa de inmediato.</Text>
        </View>

        {/* Primary Survival Action Card (Drop, Cover, Hold On) */}
        <View style={styles.survivalCard}>
          <Text style={styles.survivalEyebrow}>PROTOCOLO VITAL DE SUPERVIVENCIA</Text>
          <Text style={styles.survivalHeadline}>
            AGÁCHATE{'\n'}
            <Text style={styles.survivalHeadlineHighlight}>CÚBRETE</Text>{'\n'}
            AGÁRRATE
          </Text>

          {/* 3 Sequence Graphic Panels */}
          <View style={styles.sequenceGrid}>
            {/* Paso 1: Agáchate */}
            <View style={styles.stepTile}>
              <View style={styles.stepImageWrap}>
                <DropIllustration size={56} />
              </View>
              <Text style={styles.stepName}>1. AGÁCHATE</Text>
              <Text style={styles.stepSub}>Hacia el suelo</Text>
            </View>

            {/* Paso 2: Cúbrete */}
            <View style={styles.stepTile}>
              <View style={styles.stepImageWrap}>
                <CoverIllustration size={56} />
              </View>
              <Text style={styles.stepName}>2. CÚBRETE</Text>
              <Text style={styles.stepSub}>Bajo mesa firme</Text>
            </View>

            {/* Paso 3: Agárrate */}
            <View style={styles.stepTile}>
              <View style={styles.stepImageWrap}>
                <HoldIllustration size={56} />
              </View>
              <Text style={styles.stepName}>3. AGÁRRATE</Text>
              <Text style={styles.stepSub}>Hasta que cese</Text>
            </View>
          </View>

          {/* Reassuring Micro-Instruction */}
          <View style={styles.microInstructionPill}>
            <Icon name="verified_user" size={18} color={brand.during} />
            <Text style={styles.microInstructionText}>
              Aléjate de ventanas, vidrios y estantes
            </Text>
          </View>
        </View>

        {/* Live Sensor & Beacon Detection Card */}
        <View style={styles.sensorCard}>
          <View style={styles.sensorRow}>
            <View style={styles.sensorTitleGroup}>
              <Icon name="sensors" size={22} color={brand.during} />
              <Text style={styles.sensorTitle}>Sensores de movimiento</Text>
            </View>
            <View style={styles.sensorBadge}>
              <Text style={styles.sensorBadgeText}>Activos</Text>
            </View>
          </View>

          <View style={styles.bluetoothRow}>
            <View style={styles.bluetoothLeft}>
              <View style={styles.bluetoothIconWrap}>
                <Icon name="bluetooth" size={18} color={brand.espresso} />
              </View>
              <View style={styles.bluetoothInfo}>
                <Text style={styles.bluetoothTitle}>Conexión Bluetooth</Text>
                <Text style={styles.bluetoothSub}>Red de malla activa</Text>
              </View>
            </View>

            <View style={[styles.connectedPill, !isBluetoothConnected && styles.searchingPill]}>
              <View style={[styles.statusDot, !isBluetoothConnected && styles.statusDotSearching]} />
              <Text style={[styles.statusDotText, !isBluetoothConnected && styles.statusDotTextSearching]}>
                {isBluetoothConnected ? 'Conectado' : 'Buscando'}
              </Text>
            </View>
          </View>
        </View>

        {/* Recomendaciones Clave: Qué No Hacer */}
        <View style={styles.dontCard}>
          <View style={styles.dontHeader}>
            <Icon name="block" size={18} color={colors.panic} />
            <Text style={styles.dontTitle}>QUÉ NO DEBES HACER</Text>
          </View>
          <Text style={styles.dontItem}>• NO uses ascensores bajo ninguna circunstancia.</Text>
          <Text style={styles.dontItem}>• NO salgas corriendo a la calle si caen vidrios, cornisas o cables.</Text>
          <Text style={styles.dontItem}>• NO enciendas fósforos, velas ni interruptores de luz (fugas de gas).</Text>
          <Text style={styles.dontItem}>• NO empujes en escaleras ni bloquees salidas de evacuación.</Text>
        </View>

        {/* High Priority Action Buttons */}
        <View style={styles.actionButtonsCol}>
          {/* Botón Principal: Estoy a salvo */}
          <TouchableOpacity
            style={styles.btnSafe}
            onPress={handleMarkSafe}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Estoy a salvo. Informa que no requieres auxilio y avanza a la siguiente fase"
          >
            <Icon name="check_circle" size={20} color={colors.tertiaryContainer} />
            <Text style={styles.btnSafeText}>Estoy a salvo</Text>
          </TouchableOpacity>

          {/* Botón Secundario: Necesito ayuda */}
          <TouchableOpacity
            style={styles.btnHelp}
            onPress={handleNeedHelp}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Necesito ayuda. Activar pánico y baliza de socorro de emergencia"
          >
            <Icon name="crisis_alert" size={20} color={colors.panic} />
            <Text style={styles.btnHelpText}>Necesito ayuda</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Feedback Flotante */}
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Icon name="check" size={16} color={colors.tertiaryContainer} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
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
  },

  // Phase Alert Cap / Status Header
  phaseAlertCap: {
    width: '100%',
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  phaseCapAccent: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(212, 122, 34, 0.25)',
  },
  modeActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pingContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pingDotOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.panic,
    opacity: 0.6,
  },
  pingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.panic,
  },
  modeActiveText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    letterSpacing: 1.2,
  },
  phaseTitle: {
    ...typography.scale.headlineLgMobile,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  phaseSubtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSecondaryContainer,
    fontWeight: '500',
    marginTop: 2,
  },

  // Survival Action Card
  survivalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  survivalEyebrow: {
    ...typography.scale.labelCaps,
    color: brand.during,
    letterSpacing: 1.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  survivalHeadline: {
    ...typography.scale.headlineLg,
    color: brand.espresso,
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.2,
    marginBottom: spacing.md,
  },
  survivalHeadlineHighlight: {
    color: brand.during,
  },
  sequenceGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.md,
  },
  stepTile: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    alignItems: 'center',
  },
  stepImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepName: {
    ...typography.scale.labelCaps,
    color: brand.espresso,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepSub: {
    ...typography.scale.bodySm,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 12,
  },
  microInstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  microInstructionText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },

  // Live Sensor & Beacon Detection Card
  sensorCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  sensorTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sensorTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
  },
  sensorBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sensorBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
  },
  bluetoothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  bluetoothLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  bluetoothIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bluetoothInfo: {
    flex: 1,
  },
  bluetoothTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  bluetoothSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  searchingPill: {
    backgroundColor: colors.surfaceVariant,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onTertiaryContainer,
  },
  statusDotSearching: {
    backgroundColor: colors.onSurfaceVariant,
  },
  statusDotText: {
    ...typography.scale.labelMd,
    color: colors.onTertiaryContainer,
    fontWeight: '700',
  },
  statusDotTextSearching: {
    color: colors.onSurfaceVariant,
  },

  // Dont Card
  dontCard: {
    width: '100%',
    backgroundColor: colors.panicContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.panicContainer,
    marginBottom: spacing.lg,
  },
  dontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dontTitle: {
    ...typography.scale.labelMd,
    color: colors.panic,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dontItem: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    marginBottom: 4,
    lineHeight: 18,
  },

  // Buttons
  actionButtonsCol: {
    width: '100%',
    gap: spacing.sm,
  },
  btnSafe: {
    width: '100%',
    height: 52,
    minHeight: 52,
    borderRadius: 9999,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    elevation: 3,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  btnSafeText: {
    ...typography.scale.labelLg,
    color: brand.onFill,
    fontWeight: '700',
  },
  btnHelp: {
    width: '100%',
    height: 52,
    minHeight: 52,
    borderRadius: 9999,
    backgroundColor: colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnHelpText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    elevation: 6,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 999,
  },
  toastText: {
    ...typography.scale.bodySm,
    color: brand.onFill,
    fontWeight: '500',
  },
});
