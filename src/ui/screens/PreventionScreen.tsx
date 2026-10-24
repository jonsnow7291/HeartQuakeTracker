import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useChecklists } from '../features/checklists/useChecklists';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { SignalingHardwareDriverImpl } from '../../platform/emergency/SignalingHardwareDriverImpl';

export function PreventionScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { kitItems, toggleKitItem, getKitProgress, getFamilyPlanProgress } = useChecklists();

  const [reminderActive, setReminderActive] = useState(false);
  const [alarmPlaying, setAlarmPlaying] = useState(false);

  const kitProgress = getKitProgress();
  const planProgress = getFamilyPlanProgress();

  // Promedio ponderado de preparación del hogar
  const globalPrepPercentage = Math.round((kitProgress.percentage + planProgress.percentage) / 2);

  // Mapeo interactivo de los 5 elementos clave de la mochila (mockup de Prevención)
  const previewItems = [
    {
      id: 'kit_agua',
      title: 'Agua y alimentos no perecederos',
      tag: '3 días',
      desc: '4L por persona, latas con abre fácil, barras energéticas.',
      completed: kitItems.find((i) => i.id === 'kit_agua')?.completed ?? false,
    },
    {
      id: 'kit_botiquin',
      title: 'Botiquín y medicamentos esenciales',
      tag: 'Médico',
      desc: 'Gasas, alcohol, analgésicos y recetas para 7 días continuos.',
      completed: kitItems.find((i) => i.id === 'kit_botiquin')?.completed ?? false,
    },
    {
      id: 'kit_linterna',
      title: 'Linterna dinamo y radio AM/FM',
      tag: 'Prioridad',
      tagPriority: true,
      desc: 'Linterna sin pilas o dinamo, pilas extra y radio con alerta.',
      completed: kitItems.find((i) => i.id === 'kit_linterna')?.completed ?? false,
    },
    {
      id: 'kit_silbato',
      title: 'Silbato, llaves y documentos',
      tag: 'Legal',
      desc: 'Copia de identificaciones en bolsa impermeable y silbato sin balín.',
      completed: kitItems.find((i) => i.id === 'kit_silbato')?.completed ?? false,
    },
    {
      id: 'kit_manta',
      title: 'Manta térmica, muda e higiene',
      tag: 'Refugio',
      desc: 'Manta de aluminio, muda completa abrigadora y papel higiénico.',
      completed: kitItems.find((i) => i.id === 'kit_manta')?.completed ?? false,
    },
  ];

  // Simulador de alarma: pitidos de 3 kHz (el mismo tono de la señalización de emergencia) durante
  // unos 3,5 s, por el canal de alarmas y a volumen moderado. Antes solo cambiaba el estado visual.
  const alarmDriver = useRef(new SignalingHardwareDriverImpl()).current;
  const alarmTimers = useRef<{ beep?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});

  const stopAlarmSimulator = useCallback(() => {
    if (alarmTimers.current.beep) clearInterval(alarmTimers.current.beep);
    if (alarmTimers.current.stop) clearTimeout(alarmTimers.current.stop);
    alarmTimers.current = {};
    alarmDriver.stopTone().catch(() => {});
    setAlarmPlaying(false);
  }, [alarmDriver]);

  useEffect(() => stopAlarmSimulator, [stopAlarmSimulator]);

  const toggleAlarmSimulator = () => {
    if (alarmPlaying) {
      stopAlarmSimulator();
      return;
    }
    setAlarmPlaying(true);
    let sounding = false;
    const beep = () => {
      sounding = !sounding;
      (sounding ? alarmDriver.playTone(3000, 0.6) : alarmDriver.stopTone()).catch(() => {});
    };
    beep();
    alarmTimers.current.beep = setInterval(beep, 450);
    alarmTimers.current.stop = setTimeout(stopAlarmSimulator, 3600);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-header con retorno y título contextual de Fase Prevención (según mockup) */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonCircle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="arrow_back" size={20} color={brand.espresso} />
            </TouchableOpacity>
            <View style={styles.subHeaderTitleBlock}>
              <View style={styles.phaseIndicatorRow}>
                <View style={styles.phaseIndicatorDot} />
                <Text style={styles.phaseIndicatorText}>Fase 1 • Antes del sismo</Text>
              </View>
              <Text style={styles.phaseTitleText} accessibilityRole="header">
                PREVENCIÓN
              </Text>
            </View>
          </View>
          <View style={styles.shieldBadge}>
            <Icon name="verified_user" size={22} color={colors.onTertiaryContainer} />
          </View>
        </View>

        {/* Lema sereno & inspirador */}
        <View style={styles.mottoCard}>
          <Text style={styles.mottoHighlight}>Infórmate. Prepárate. Protege tu vida.</Text>
          <Text style={styles.mottoBody}>
            La calma ante un sismo comienza con las decisiones que tomas hoy en tu hogar.
          </Text>
        </View>

        {/* Indicador del estado de preparación del hogar */}
        <View style={styles.prepCard}>
          <View style={styles.prepHeaderRow}>
            <View style={styles.prepTitleGroup}>
              <View style={styles.prepIconBadge}>
                <Icon name="task_alt" size={18} color={colors.onTertiaryContainer} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.prepSubtitle}>TU HOGAR SEGURO</Text>
                <Text style={styles.prepHeading}>Preparación del hogar</Text>
              </View>
            </View>
            <View style={styles.prepScoreGroup}>
              <View style={styles.prepStatusPill}>
                <Text style={styles.prepStatusPillText}>
                  {globalPrepPercentage >= 80
                    ? 'ALTA PREPARACIÓN'
                    : globalPrepPercentage >= 50
                    ? 'BUEN PROGRESO'
                    : 'EN PROGRESO'}
                </Text>
              </View>
              <Text style={styles.prepPercentageNumber}>{globalPrepPercentage}%</Text>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${globalPrepPercentage}%` }]} />
          </View>

          <View style={styles.prepFooterRow}>
            <View style={styles.prepFooterInfo}>
              <Icon name="info" size={14} color={colors.onSurfaceVariant} />
              <Text style={styles.prepFooterText}>
                {`Mochila ${kitProgress.percentage}% · Plan familiar ${planProgress.percentage}%`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Kit')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Ver detalle del kit de emergencia"
              hitSlop={8}
            >
              <Text style={styles.prepDetailLink}>Ver detalle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 1: Mochila de Emergencia (72 Horas) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.backpackIconBadge}>
                <Icon name="backpack" size={28} color={brand.espresso} />
              </View>
              <View style={styles.cardHeaderTextGroup}>
                <View style={styles.vitalTagRow}>
                  <Text style={styles.vitalTagText}>VITAL • 72 HORAS</Text>
                  <View style={styles.vitalDot} />
                </View>
                <Text style={styles.cardHeading}>Mochila de Emergencia</Text>
                <Text style={styles.cardSubtext}>
                  {`Tu mochila: ${kitProgress.completed} de ${kitProgress.total} elementos (${kitProgress.percentage}%). Aquí ves 5 claves.`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => navigation.navigate('GuideReader', { guideId: 'mochila-emergencia' })}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Información sobre la mochila de emergencia"
              hitSlop={8}
            >
              <Icon name="help_outline" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Checklist Interactivo */}
          <View style={styles.checklistGroup}>
            {previewItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checkItemRow}
                onPress={() => toggleKitItem(item.id)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.completed }}
                accessibilityLabel={`${item.title}. ${item.desc}. ${
                  item.completed ? 'Completado' : 'Pendiente'
                }`}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    item.completed && styles.checkboxBoxChecked,
                  ]}
                >
                  {item.completed ? (
                    <Icon name="check" size={14} color={colors.onTertiary} />
                  ) : null}
                </View>
                <View style={styles.checkItemContent}>
                  <View style={styles.checkItemTitleRow}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.checkItemTitle,
                        item.completed && styles.checkItemTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <View
                      style={[
                        styles.categoryPill,
                        item.tagPriority && styles.categoryPillPriority,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          item.tagPriority && styles.categoryPillPriorityText,
                        ]}
                      >
                        {item.tag}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.checkItemDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botón de acción kit (Pill de 52px) */}
          <TouchableOpacity
            style={styles.actionPillButton}
            onPress={() => navigation.navigate('Kit')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Personalizar e inventariar kit de emergencia"
          >
            <Icon name="checklist_rtl" size={20} color={brand.cream} />
            <Text style={styles.actionPillButtonText}>Personalizar e inventariar kit</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN 2: Simulacros y Ensayo */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionHeaderBar}>
            <View>
              <Text style={styles.sectionEyebrow}>Cultura Preventiva</Text>
              <Text style={styles.sectionTitle}>Simulacros y Ensayo</Text>
            </View>
            <Icon name="campaign" size={24} color={brand.during} />
          </View>

          {/* Tarjeta Próximo Simulacro */}
          <View style={styles.sectionCard}>
            <View style={styles.drillHeaderRow}>
              <View style={styles.drillBadge}>
                <Icon name="event_upcoming" size={22} color={colors.onSecondaryContainer} />
              </View>
              <View>
                <View style={styles.officialTagRow}>
                  <View style={styles.orangePingDot} />
                  <Text style={styles.officialTagText}>OFICIAL PROGRAMADO</Text>
                </View>
                <Text style={styles.drillTitle}>Simulacro Nacional Sísmico</Text>
              </View>
            </View>

            <View style={styles.drillDetailsGrid}>
              <View style={styles.drillDetailCol}>
                <Text style={styles.drillDetailLabel}>HORARIO</Text>
                <View style={styles.drillDetailValueRow}>
                  <Icon name="schedule" size={16} color={brand.during} />
                  <Text style={styles.drillDetailValueText}>Mañana • 11:00 hrs</Text>
                </View>
              </View>
              <View style={styles.drillDetailCol}>
                <Text style={styles.drillDetailLabel}>HIPÓTESIS</Text>
                <View style={styles.drillDetailValueRow}>
                  <Icon name="vibration" size={16} color={colors.panic} />
                  <Text style={styles.drillDetailValueText}>Sismo Mag. 7.8</Text>
                </View>
              </View>
            </View>

            <View style={styles.drillActionRow}>
              <TouchableOpacity
                style={[
                  styles.reminderButton,
                  reminderActive && styles.reminderButtonActive,
                ]}
                onPress={() => setReminderActive(!reminderActive)}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  reminderActive ? 'Recordatorio activo para el simulacro' : 'Activar recordatorio para el simulacro'
                }
                accessibilityState={{ selected: reminderActive }}
              >
                <Icon
                  name="notifications_active"
                  size={18}
                  color={reminderActive ? colors.onTertiaryContainer : brand.espresso}
                />
                <Text
                  style={[
                    styles.reminderButtonText,
                    reminderActive && styles.reminderButtonTextActive,
                  ]}
                >
                  {reminderActive ? 'Recordatorio listo' : 'Activar recordatorio'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => navigation.navigate('GuideReader', { guideId: 'durante-el-sismo' })}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Unirme al simulacro y repasar protocolo"
              >
                <Text style={styles.joinButtonText}>Unirme</Text>
                <Icon name="chevron_right" size={16} color={brand.cream} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta Entrenador de Sonido de Alarma */}
          <View style={styles.soundCard}>
            <View style={styles.soundCardLeft}>
              <View style={styles.soundIconBadge}>
                <Icon name="graphic_eq" size={24} color={brand.espresso} />
              </View>
              <View style={styles.soundCardTextGroup}>
                <Text style={styles.soundHeading}>Simulador de Alarma</Text>
                <Text style={styles.soundDescription}>
                  Escucha el sonido oficial para familiarizar a niños y mascotas sin pánico.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.soundToggleCircle,
                alarmPlaying && styles.soundToggleCircleActive,
              ]}
              onPress={toggleAlarmSimulator}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={alarmPlaying ? 'Detener simulador de alarma' : 'Reproducir simulador de alarma sísmica'}
              accessibilityState={{ selected: alarmPlaying }}
            >
              <Icon
                name={alarmPlaying ? 'pause' : 'play_arrow'}
                size={22}
                color={brand.cream}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 3: Guías y Planes Preventivos */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionHeaderBar}>
            <View>
              <Text style={styles.sectionEyebrow}>Organización Familiar</Text>
              <Text style={styles.sectionTitle}>Planes y Zonas Seguras</Text>
            </View>
          </View>

          {/* Guía 1: Plan Familiar de Emergencia */}
          <TouchableOpacity
            style={styles.guideRowCard}
            onPress={() => navigation.navigate('FamilyPlan')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir Plan Familiar de Emergencia"
          >
            <View style={styles.guideRowLeft}>
              <View style={styles.guideIconBadge}>
                <Icon name="diversity_3" size={22} color={brand.espresso} />
              </View>
              <View style={styles.guideTextGroup}>
                <Text style={styles.guideTitle}>Plan Familiar de Emergencia</Text>
                <Text style={styles.guideSub}>
                  Asignación de roles, llaves maestras y 2 puntos de reunión fuera del barrio.
                </Text>
              </View>
            </View>
            <Icon name="arrow_forward_ios" size={18} color={colors.outlineVariant} />
          </TouchableOpacity>

          {/* Guía 2: Zonas de Menor Riesgo en Casa */}
          <TouchableOpacity
            style={styles.guideRowCard}
            onPress={() =>
              navigation.navigate('GuideReader', { guideId: 'aseguramiento-estructural' })
            }
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir guía de Zonas de Menor Riesgo en Casa"
          >
            <View style={styles.guideRowLeft}>
              <View style={styles.guideIconBadge}>
                <Icon name="foundation" size={22} color={brand.espresso} />
              </View>
              <View style={styles.guideTextGroup}>
                <Text style={styles.guideTitle}>Zonas de Menor Riesgo en Casa</Text>
                <Text style={styles.guideSub}>
                  Identifica columnas portantes, muros de carga y aléjate de ventanas y estantes.
                </Text>
              </View>
            </View>
            <Icon name="arrow_forward_ios" size={18} color={colors.outlineVariant} />
          </TouchableOpacity>

          {/* Guía 3: Biblioteca de Guías Oficiales */}
          <TouchableOpacity
            style={styles.guideRowCard}
            onPress={() => navigation.navigate('Guides')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir Biblioteca de Guías Oficiales"
          >
            <View style={styles.guideRowLeft}>
              <View style={styles.guideIconBadge}>
                <Icon name="menu_book" size={22} color={brand.espresso} />
              </View>
              <View style={styles.guideTextGroup}>
                <Text style={styles.guideTitle}>Biblioteca de Guías Oficiales</Text>
                <Text style={styles.guideSub}>
                  Protocolos descargados 100% offline de UNGRD, IDIGER y Cruz Roja.
                </Text>
              </View>
            </View>
            <Icon name="arrow_forward_ios" size={18} color={colors.outlineVariant} />
          </TouchableOpacity>

          {/* Guía 4: Academia Sísmica y Trivias */}
          <TouchableOpacity
            style={styles.guideRowCard}
            onPress={() => navigation.navigate('QuizLevels')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir Academia Sísmica Gamificada"
          >
            <View style={styles.guideRowLeft}>
              <View style={styles.guideIconBadge}>
                <Icon name="school" size={22} color={brand.espresso} />
              </View>
              <View style={styles.guideTextGroup}>
                <Text style={styles.guideTitle}>Academia Sísmica Gamificada</Text>
                <Text style={styles.guideSub}>
                  Pon a prueba tu conocimiento por niveles y gana insignias de preparación.
                </Text>
              </View>
            </View>
            <Icon name="arrow_forward_ios" size={18} color={colors.outlineVariant} />
          </TouchableOpacity>

          {/* Guía 5: Insignias Comunitarias */}
          <TouchableOpacity
            style={styles.guideRowCard}
            onPress={() => navigation.navigate('Achievements')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir Insignias Comunitarias"
          >
            <View style={styles.guideRowLeft}>
              <View style={styles.guideIconBadge}>
                <Icon name="military_tech" size={22} color={brand.espresso} />
              </View>
              <View style={styles.guideTextGroup}>
                <Text style={styles.guideTitle}>Insignias Comunitarias</Text>
                <Text style={styles.guideSub}>
                  Medallas de acreditación ciudadana y progresión de brigadista.
                </Text>
              </View>
            </View>
            <Icon name="arrow_forward_ios" size={18} color={colors.outlineVariant} />
          </TouchableOpacity>

          {/* Banner informativo sereno */}
          <View style={styles.communityBanner}>
            <Icon name="nature_people" size={26} color={brand.espresso} />
            <Text style={styles.communityBannerText}>
              En Colombia y zonas sísmicas, la anticipación salva vidas. Comparte este plan con tus
              vecinos para coordinar brigadas de apoyo mutuo.
            </Text>
          </View>
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
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.spaceXs,
    paddingBottom: spacing.space3xl,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.spaceXs,
    marginBottom: spacing.spaceSm,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subHeaderTitleBlock: {
    justifyContent: 'center',
  },
  phaseIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  phaseIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  phaseIndicatorText: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: colors.onTertiaryContainer,
    letterSpacing: 0.88,
  },
  phaseTitleText: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    letterSpacing: -0.2,
  },
  shieldBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(174, 242, 192, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mottoCard: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.spaceSm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.spaceMd,
  },
  mottoHighlight: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  mottoBody: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 20,
  },
  prepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceMd,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  prepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.spaceSm,
  },
  prepTitleGroup: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  prepIconBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepSubtitle: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  prepHeading: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  prepScoreGroup: {
    flexShrink: 0,
    marginLeft: spacing.spaceXs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  prepStatusPill: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.spaceXs,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  prepStatusPillText: {
    ...typography.scale.labelCaps,
    color: colors.onTertiaryContainer,
    textTransform: 'uppercase',
  },
  prepPercentageNumber: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    marginLeft: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: spacing.spaceXs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.tertiary,
    borderRadius: 5,
  },
  prepFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.space2xs,
  },
  prepFooterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prepFooterText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  prepDetailLink: {
    ...typography.scale.labelMd,
    color: brand.during,
    textDecorationLine: 'underline',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.spaceMd,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.spaceSm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    flex: 1,
  },
  backpackIconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextGroup: {
    flex: 1,
  },
  vitalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vitalTagText: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: brand.during,
    letterSpacing: 0.5,
  },
  vitalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.during,
  },
  cardHeading: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  cardSubtext: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistGroup: {
    gap: spacing.spaceXs,
    marginBottom: spacing.spaceSm,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.spaceSm,
    padding: spacing.spaceSm,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceVariant,
    minHeight: touchTargets.min,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  checkItemContent: {
    flex: 1,
  },
  checkItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceXs,
  },
  checkItemTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    flex: 1,
  },
  checkItemTitleCompleted: {
    color: brand.espresso,
  },
  categoryPill: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillPriority: {
    backgroundColor: colors.secondaryContainer,
  },
  categoryPillText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
  },
  categoryPillPriorityText: {
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
  checkItemDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  actionPillButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceXs,
    marginTop: spacing.spaceXs,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionPillButtonText: {
    ...typography.scale.labelLg,
    color: brand.onFill,
  },
  sectionGroup: {
    marginBottom: spacing.spaceMd,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.space2xs,
    marginBottom: spacing.spaceSm,
  },
  sectionEyebrow: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: brand.during,
  },
  sectionTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  drillHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    marginBottom: spacing.spaceSm,
  },
  drillBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(254, 156, 67, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangePingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: brand.during,
  },
  officialTagText: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: brand.during,
    fontWeight: '800',
  },
  drillTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  drillDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.default,
    padding: spacing.spaceSm,
    gap: spacing.spaceXs,
    marginBottom: spacing.spaceSm,
  },
  drillDetailCol: {
    flex: 1,
    gap: 2,
  },
  drillDetailLabel: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  drillDetailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drillDetailValueText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  drillActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  reminderButton: {
    flex: 1,
    minHeight: touchTargets.min,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reminderButtonActive: {
    backgroundColor: colors.tertiaryContainer,
  },
  reminderButtonText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  reminderButtonTextActive: {
    color: colors.onTertiaryContainer,
  },
  joinButton: {
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.spaceMd,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  joinButtonText: {
    ...typography.scale.labelLg,
    color: brand.onFill,
  },
  soundCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  soundCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    flex: 1,
  },
  soundIconBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundCardTextGroup: {
    flex: 1,
  },
  soundHeading: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  soundDescription: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  soundToggleCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  soundToggleCircleActive: {
    backgroundColor: brand.during,
  },
  guideRowCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.spaceMd,
    borderWidth: 1,
    borderColor: brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spaceSm,
    marginBottom: spacing.spaceXs,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    minHeight: touchTargets.min,
  },
  guideRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    flex: 1,
  },
  guideIconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextGroup: {
    flex: 1,
  },
  guideTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  guideSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  communityBanner: {
    backgroundColor: 'rgba(247, 222, 206, 0.5)',
    padding: spacing.spaceMd,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
    marginTop: spacing.spaceSm,
  },
  communityBannerText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 20,
  },
});
