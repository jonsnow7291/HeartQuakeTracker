import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { useEmergency } from '../hooks/useEmergency';
import { shareStatus } from '../features/share/shareStatus';
import { useLocation } from '../hooks/useLocation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import Svg, { Rect, Path } from 'react-native-svg';

export function AfterScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { emergency } = useServices();
  const { state } = useEmergency();
  // GPS real; si no hay, la última posición guardada por una emergencia (puede no existir).
  const loc = useLocation();
  const position = loc.position ?? state.lastPosition;

  const [markedSafe, setMarkedSafe] = useState<boolean>(false);
  const [loadingSafe, setLoadingSafe] = useState<boolean>(false);

  const handleMarkSafe = async () => {
    try {
      setLoadingSafe(true);
      await emergency.markSafe();
      setMarkedSafe(true);
      await shareStatus('SAFE', position);
      Alert.alert(
        '¡Reporte "Estoy a Salvo" Registrado!',
        'Tu estado ha quedado registrado en la cola local de tu teléfono y se transmitirá por la red mesh y cuando haya internet.'
      );
    } catch {
      Alert.alert('Error', 'No se pudo registrar el estado en este momento.');
    } finally {
      setLoadingSafe(false);
    }
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:911').catch(() => {
      Alert.alert('Llamada de Emergencia', 'Por favor marca 911 o 123 desde el teclado numérico de tu teléfono.');
    });
  };

  return (
    <View style={styles.root}>
      {/* Cabecera dominante de Fase 3 en Steel Blue según DESIGN.md */}
      <ScreenHeader
        title="DESPUÉS"
        eyebrow="FASE 3 · TRAS EL EVENTO"
        tone="after"
        onBack={() => navigation.navigate('Main')}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-encabezado / Indicador de Fase 3 (del mockup oficial) */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderTopRow}>
            <View style={styles.phaseBadge}>
              <View style={styles.phaseBadgeDot} />
              <Text style={styles.phaseBadgeText}>Fase 3 • Tras el evento</Text>
            </View>
            <View style={styles.communityIconBadge}>
              <Icon name="diversity_3" size={22} color={brand.during} />
            </View>
          </View>
          <Text style={styles.heroTitle}>DESPUÉS</Text>
          <Text style={styles.heroSubtitle}>
            Comunícate, reporta y coordina auxilio solidario en tu comunidad.
          </Text>
        </View>

        {/* Banner Red Mesh / Conexión de Emergencia Offline */}
        <View style={styles.meshBanner}>
          <View style={styles.meshIconCircle}>
            <Icon name="cell_tower" size={18} color={colors.onSecondaryContainer} />
          </View>
          <View style={styles.meshTextCol}>
            <View style={styles.meshHeaderRow}>
              <Text style={styles.meshTitle}>Red Mesh & Bluetooth activa</Text>
              <View style={styles.meshPulseDot} />
            </View>
            <Text style={styles.meshDesc}>
              Tus reportes y solicitud de auxilio se sincronizan de forma local entre vecinos y saltan a la red al volver la señal.
            </Text>
          </View>
        </View>

        {/* Notificación de confirmación si ya se marcó a salvo */}
        {markedSafe && (
          <Banner
            kind="success"
            title="Estado: A Salvo"
            message="Tu reporte está guardado localmente y en cola de sincronización para familiares y socorristas."
          />
        )}

        {/* Acciones Post-Sismo Principales (Tarjetas del mockup) */}
        <View style={styles.actionsSection}>
          {/* 1. Estoy a salvo */}
          <Card style={styles.safeActionCard}>
            <View style={styles.safeCardTop}>
              <View style={styles.safeIconCircle}>
                <Icon name="verified_user" size={22} color={colors.onTertiaryContainer} filled />
              </View>
              <View style={styles.safeCardTextCol}>
                <Text style={styles.safeCardTitle}>Estoy a salvo</Text>
                <Text style={styles.safeCardSub}>Informa a tus contactos que te encuentras bien</Text>
              </View>
            </View>
            <View style={styles.safeCardBottom}>
              <View style={styles.safeReadyIndicator}>
                <Icon name="check_circle" size={16} color={brand.prevention} filled />
                <Text style={styles.safeReadyText}>
                  {markedSafe ? 'Reporte registrado' : 'Listo para emitir'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shareStatusBtn}
                onPress={handleMarkSafe}
                disabled={loadingSafe}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Compartir estado: estoy a salvo"
                accessibilityState={{ disabled: loadingSafe }}
              >
                <Icon name="share" size={18} color={brand.cream} />
                <Text style={styles.shareStatusBtnText}>
                  {loadingSafe ? 'Guardando...' : markedSafe ? 'Actualizar estado' : 'Compartir estado'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* 2. Reportar daños */}
          <Card
            style={styles.navRowCard}
            onPress={() => navigation.navigate('Report')}
            accessibilityLabel="Reportar daños. Derrumbes, fugas de gas o riesgos de estructuras"
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconCircle, { backgroundColor: colors.secondaryContainer }]}>
                <Icon name="warning" size={22} color={colors.onSecondaryContainer} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Reportar daños</Text>
                <Text style={styles.navSub}>Derrumbes, fugas de gas o riesgos de estructuras</Text>
              </View>
            </View>
              <Icon name="chevron_right" size={22} color={colors.onSurfaceVariant} />
          </Card>

          {/* 3. Ver solicitudes de ayuda */}
          <Card
            style={styles.navRowCard}
            onPress={() => navigation.navigate('AidRequest')}
            accessibilityLabel="Ver solicitudes de ayuda. Encuentra y asiste a personas o mascotas vulnerables"
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconCircle, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="group_work" size={22} color={brand.espresso} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Ver solicitudes de ayuda</Text>
                <Text style={styles.navSub}>Encuentra y asiste a personas o mascotas vulnerables</Text>
              </View>
            </View>
              <Icon name="chevron_right" size={22} color={colors.onSurfaceVariant} />
          </Card>

          {/* 4. Donaciones y voluntariado */}
          <Card
            style={styles.navRowCard}
            onPress={() => navigation.navigate('Aid')}
            accessibilityLabel="Donaciones y voluntariado. Víveres, ropa o canalización a centros de acopio"
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconCircle, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="volunteer_activism" size={22} color={colors.onPrimaryContainer} filled />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Donaciones y voluntariado</Text>
                <Text style={styles.navSub}>Víveres, ropa o canalización a centros de acopio</Text>
              </View>
            </View>
              <Icon name="chevron_right" size={22} color={colors.onSurfaceVariant} />
          </Card>

          {/* 5. Puntos de auxilio cercanos */}
          <Card
            style={styles.navRowCard}
            onPress={() => navigation.navigate('Main', { screen: 'Map' })}
            accessibilityLabel="Puntos de auxilio cercanos. Albergues oficiales, Cruz Roja y puestos de triaje"
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIconCircle, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="local_hospital" size={22} color={brand.espresso} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Puntos de auxilio cercanos</Text>
                <Text style={styles.navSub}>Albergues oficiales, Cruz Roja y puestos de triaje</Text>
              </View>
            </View>
              <Icon name="chevron_right" size={22} color={colors.onSurfaceVariant} />
          </Card>
        </View>

        {/* Módulo Visual: Red de Ayuda Humanitaria */}
        <View style={styles.humanitarianCard}>
          <View style={styles.humanitarianSvgBg}>
            <Svg width="100%" height="100%" viewBox="0 0 400 160">
              <Rect width="400" height="160" fill={brand.espresso} />
              <Path
                d="M-20 80 Q 80 20 200 90 T 420 70"
                stroke={brand.during}
                strokeWidth={2}
                opacity={0.35}
                fill="none"
              />
              <Path
                d="M-20 110 Q 120 50 240 120 T 420 100"
                stroke={brand.prevention}
                strokeWidth={2}
                opacity={0.3}
                fill="none"
              />
              <Path
                d="M-20 140 Q 140 80 260 140 T 420 130"
                stroke={brand.after}
                strokeWidth={2}
                opacity={0.3}
                fill="none"
              />
            </Svg>
          </View>
          <View style={styles.humanitarianContent}>
            <Text style={styles.humanitarianEyebrow}>RED DE AYUDA HUMANITARIA</Text>
            <Text style={styles.humanitarianTitle}>Coordinación en tiempo real</Text>
          </View>
        </View>

        {/* Sección Destacada: Ayuda y Donaciones */}
        <View style={styles.aidSection}>
          <View style={styles.aidSectionHeader}>
            <View style={styles.aidSectionTitleGroup}>
              <Icon name="favorite" size={20} color={brand.during} filled />
              <Text style={styles.aidSectionTitle}>Ayuda y Donaciones</Text>
            </View>
            <Text style={styles.aidPriorityTag}>PRIORITARIO</Text>
          </View>

          {/* Tarjeta Banner Cálida de Donación */}
          <View style={styles.donationBannerCard}>
            <View style={styles.donationBannerTop}>
              <View style={styles.handshakeCircle}>
                <Icon name="handshake" size={26} color={colors.onSecondaryContainer} filled />
              </View>
              <View style={styles.donationBannerTextCol}>
                <Text style={styles.donationBannerTitle}>Tu ayuda hace la diferencia</Text>
                <Text style={styles.donationBannerSub}>
                  Dona o apoya a las familias damnificadas por el sismo. Cada aporte canalizado salva vidas y acelera la reconstrucción.
                </Text>
              </View>
            </View>
            <View style={styles.donationBannerButtons}>
              <TouchableOpacity
                style={styles.donateCtaBtn}
                onPress={() => navigation.navigate('Aid')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Hacer donación a entidades oficiales"
              >
                <Icon name="volunteer_activism" size={18} color={brand.cream} filled />
                <Text style={styles.donateCtaBtnText}>Hacer donación</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acopioCtaBtn}
                onPress={() => navigation.navigate('Main', { screen: 'Map' })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ver centros de acopio"
              >
                <Icon name="inventory_2" size={18} color={brand.espresso} />
                <Text style={styles.acopioCtaBtnText}>Acopios</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bloque: Necesidades prioritarias */}
          <View style={styles.prioritiesBlock}>
            <View style={styles.prioritiesHeader}>
              <Text style={styles.prioritiesTitle}>Necesidades prioritarias</Text>
              <Text style={styles.urgentBadge}>URGENTE</Text>
            </View>

            <View style={styles.prioritiesList}>
              {/* Item 1 */}
              <View style={styles.priorityItem}>
                <View style={styles.priorityItemLeft}>
                  <View style={styles.priorityIconCircle}>
                    <Icon name="lunch_dining" size={20} color={brand.espresso} />
                  </View>
                  <View style={styles.priorityTextCol}>
                    <Text style={styles.priorityLabel}>Alimentos no perecederos</Text>
                    <Text style={styles.prioritySub}>Enlatados, legumbres, arroz, atún</Text>
                  </View>
                </View>
                <View style={[styles.priorityLevelBadge, styles.levelHigh]}>
                  <Text style={styles.levelHighText}>ALTA</Text>
                </View>
              </View>

              {/* Item 2 */}
              <View style={styles.priorityItem}>
                <View style={styles.priorityItemLeft}>
                  <View style={styles.priorityIconCircle}>
                    <Icon name="water_drop" size={20} color={brand.during} filled />
                  </View>
                  <View style={styles.priorityTextCol}>
                    <Text style={styles.priorityLabel}>Agua potable embotellada</Text>
                    <Text style={styles.prioritySub}>Garrafones y botellas selladas</Text>
                  </View>
                </View>
                <View style={[styles.priorityLevelBadge, styles.levelCritical]}>
                  <Text style={styles.levelCriticalText}>CRÍTICA</Text>
                </View>
              </View>

              {/* Item 3 */}
              <View style={styles.priorityItem}>
                <View style={styles.priorityItemLeft}>
                  <View style={styles.priorityIconCircle}>
                    <Icon name="medication" size={20} color={colors.panic} />
                  </View>
                  <View style={styles.priorityTextCol}>
                    <Text style={styles.priorityLabel}>Medicamentos y botiquines</Text>
                    <Text style={styles.prioritySub}>Gasas, alcohol, analgésicos, vendas</Text>
                  </View>
                </View>
                <View style={[styles.priorityLevelBadge, styles.levelHigh]}>
                  <Text style={styles.levelHighText}>ALTA</Text>
                </View>
              </View>

              {/* Item 4 */}
              <View style={styles.priorityItem}>
                <View style={styles.priorityItemLeft}>
                  <View style={styles.priorityIconCircle}>
                    <Icon name="bed" size={20} color={brand.espresso} />
                  </View>
                  <View style={styles.priorityTextCol}>
                    <Text style={styles.priorityLabel}>Ropa, colchas y cobijas</Text>
                    <Text style={styles.prioritySub}>Limpia, clasificada por talla</Text>
                  </View>
                </View>
                <View style={[styles.priorityLevelBadge, styles.levelMedium]}>
                  <Text style={styles.levelMediumText}>MEDIA</Text>
                </View>
              </View>

              {/* Item 5 */}
              <View style={styles.priorityItem}>
                <View style={styles.priorityItemLeft}>
                  <View style={styles.priorityIconCircle}>
                    <Icon name="soap" size={20} color={brand.espresso} />
                  </View>
                  <View style={styles.priorityTextCol}>
                    <Text style={styles.priorityLabel}>Higiene personal y pañales</Text>
                    <Text style={styles.prioritySub}>Papel higiénico, toallas, jabón neutro</Text>
                  </View>
                </View>
                <View style={[styles.priorityLevelBadge, styles.levelMedium]}>
                  <Text style={styles.levelMediumText}>MEDIA</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Directorio de Emergencias Directas */}
        <View style={styles.emergencyDirectCard}>
          <View style={styles.emergencyDirectLeft}>
            <View style={styles.emergencyPhoneCircle}>
              <Icon name="call" size={20} color={colors.panic} />
            </View>
            <View style={styles.emergencyDirectTextCol}>
              <Text style={styles.emergencyDirectTitle}>Línea Unificada de Emergencias</Text>
              <Text style={styles.emergencyDirectSub}>Central 911 / Cruz Roja / Bomberos</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={handleCallEmergency}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Llamar a línea unificada de emergencias 911"
            hitSlop={8}
          >
            <Icon name="phone" size={18} color={brand.cream} />
          </TouchableOpacity>
        </View>

        {/* Cola de Sincronización Diferida */}
        <Card
          style={styles.navRowCard}
          onPress={() => navigation.navigate('Sync')}
          accessibilityLabel="Revisar cola de sincronización diferida"
        >
          <View style={styles.navRowLeft}>
            <View style={[styles.navIconCircle, { backgroundColor: colors.surfaceVariant }]}>
              <Icon name="sync" size={22} color={brand.espresso} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Cola de Sincronización</Text>
              <Text style={styles.navSub}>Verifica el envío diferido de tus reportes al servidor</Text>
            </View>
          </View>
          <Icon name="chevron_right" size={22} color={colors.onSurfaceVariant} />
        </Card>

        {/* Protocolo de Verificación Post-Sismo */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <Icon name="assignment" size={20} color={brand.after} />
            <Text style={styles.protocolTitle}>Protocolo de Verificación Post-Sismo</Text>
          </View>
          <Text style={styles.protocolItem}>
            1. <Text style={styles.bold}>Inspecciona servicios:</Text> Cierra llaves de gas y corta el suministro eléctrico si sospechas daños o percibes olor a gas.
          </Text>
          <Text style={styles.protocolItem}>
            2. <Text style={styles.bold}>Alerta de réplicas:</Text> Prepárate para posibles réplicas en las próximas horas. No entres a edificaciones con grietas profundas.
          </Text>
          <Text style={styles.protocolItem}>
            3. <Text style={styles.bold}>Comunicaciones:</Text> Evita llamadas de voz para no congestionar antenas celulares. Usa mensajería de texto o la red de malla.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.cream,
  },
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  subHeader: {
    gap: spacing.xxs,
  },
  subHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  phaseBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.during,
  },
  phaseBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  communityIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  heroTitle: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
  },
  heroSubtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  meshBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  meshIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  meshTextCol: {
    flex: 1,
  },
  meshHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meshTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  meshPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryContainer,
  },
  meshDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  actionsSection: {
    gap: spacing.xs,
  },
  safeActionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.sm,
  },
  safeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  safeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeCardTextCol: {
    flex: 1,
  },
  safeCardTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  safeCardSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  safeCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  safeReadyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safeReadyText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
  },
  shareStatusBtn: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareStatusBtnText: {
    ...typography.scale.labelLg,
    color: brand.onFill,
  },
  navRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.xs,
  },
  navIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  navSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  humanitarianCard: {
    height: 140,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: brand.fill,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  humanitarianSvgBg: {
    ...StyleSheet.absoluteFill,
  },
  humanitarianContent: {
    zIndex: 2,
    gap: 2,
  },
  humanitarianEyebrow: {
    ...typography.scale.labelCaps,
    color: colors.secondaryContainer,
    letterSpacing: 0.88,
  },
  humanitarianTitle: {
    ...typography.scale.headlineSm,
    color: brand.onFill,
  },
  aidSection: {
    gap: spacing.sm,
  },
  aidSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aidSectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aidSectionTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  aidPriorityTag: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '800',
  },
  donationBannerCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  donationBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  handshakeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donationBannerTextCol: {
    flex: 1,
  },
  donationBannerTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  donationBannerSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  donationBannerButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  donateCtaBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  donateCtaBtnText: {
    ...typography.scale.labelLg,
    color: brand.onFill,
  },
  acopioCtaBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acopioCtaBtnText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  prioritiesBlock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: spacing.sm,
  },
  prioritiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prioritiesTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  urgentBadge: {
    ...typography.scale.labelCaps,
    color: colors.panic,
    fontWeight: '800',
  },
  prioritiesList: {
    gap: spacing.xs,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  priorityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.xs,
  },
  priorityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityTextCol: {
    flex: 1,
  },
  priorityLabel: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  prioritySub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  priorityLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  levelHigh: {
    backgroundColor: colors.panicContainer,
  },
  levelHighText: {
    ...typography.scale.labelCaps,
    color: colors.onPanicContainer,
    fontWeight: '800',
  },
  levelCritical: {
    backgroundColor: colors.panicContainer,
  },
  levelCriticalText: {
    ...typography.scale.labelCaps,
    color: colors.onPanicContainer,
    fontWeight: '800',
  },
  levelMedium: {
    backgroundColor: colors.secondaryContainer,
  },
  levelMediumText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
  },
  emergencyDirectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  emergencyDirectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  emergencyPhoneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.panicContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDirectTextCol: {
    flex: 1,
  },
  emergencyDirectTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  emergencyDirectSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  emergencyCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolCard: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xxs,
  },
  protocolTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  protocolItem: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: brand.espresso,
  },
});
