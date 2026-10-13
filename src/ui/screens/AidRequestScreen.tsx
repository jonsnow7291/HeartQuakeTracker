import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import type { GeoPoint } from '../../contracts/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const SUGGESTED_NEEDS = [
  { label: 'Primeros Auxilios', icon: 'medical_services' },
  { label: 'Atrapados / Rescate', icon: 'emergency' },
  { label: 'Agua Potable', icon: 'water_drop' },
  { label: 'Alimentos', icon: 'lunch_dining' },
  { label: 'Abrigo / Cobijas', icon: 'bed' },
  { label: 'Evacuación de Mayores', icon: 'accessible' },
];

export function AidRequestScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reports } = useServices();

  const [needText, setNeedText] = useState<string>('Primeros Auxilios');
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [includeLocation, setIncludeLocation] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!needText.trim()) {
      Alert.alert('Requerimiento no especificado', 'Por favor ingresa qué tipo de ayuda necesitas.');
      return;
    }

    try {
      setSubmitting(true);
      const position: GeoPoint | undefined = includeLocation
        ? { lat: 4.5981, lon: -74.076, ts: new Date().toISOString() }
        : undefined;

      await reports.requestAid({
        need: needText.trim(),
        people: Math.max(1, peopleCount),
        position,
      });

      setSubmitted(true);
      Alert.alert(
        'Solicitud de Ayuda Encolada',
        'Tu solicitud ha sido guardada en la cola de emergencia y se transmitirá a los organismos de socorro a través de la red mesh BLE y tan pronto se detecte conexión.'
      );
    } catch {
      Alert.alert('Error', 'No se pudo guardar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Cabecera Steel Blue de fase Después */}
      <ScreenHeader
        title="Solicitar Ayuda"
        eyebrow="AUXILIO Y RESCATE"
        tone="after"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Petición de Auxilio y Suministros</Text>
          <Text style={styles.subtitle}>
            Envía tus necesidades prioritarias a los centros de acopio y unidades de la Cruz Roja y Defensa Civil.
          </Text>
        </View>

        {/* Alerta de pánico si hay peligro vital inminente */}
        <View accessibilityLiveRegion="polite">
        <Card style={styles.urgentAlertCard}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentIconCircle}>
              <Icon name="crisis_alert" size={24} color={colors.panic} filled />
            </View>
            <View style={styles.urgentTextCol}>
              <Text style={styles.urgentAlertTitle}>¿Peligro inminente de vida?</Text>
              <Text style={styles.urgentAlertBody}>
                Si alguien está atrapado bajo los escombros o en estado crítico, activa el botón de pánico para encender la baliza BLE continua de rescate.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.urgentBtn}
            onPress={() => navigation.navigate('Panic')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Activar modo pánico y baliza de socorro"
          >
            <Icon name="warning" size={18} color={colors.onPanic} filled />
            <Text style={styles.urgentBtnText}>Activar Modo Pánico</Text>
          </TouchableOpacity>
        </Card>
        </View>

        {submitted && (
          <Banner
            kind="success"
            title="Solicitud Encolada"
            message="Tu solicitud de ayuda ha sido encolada para transmisión store-and-forward vía malla y satélite/celular."
          />
        )}

        {/* Tipos de ayuda sugeridos */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Selecciona o escribe el tipo de ayuda:</Text>
          <View style={styles.chipsWrap}>
            {SUGGESTED_NEEDS.map((sug) => {
              const isSelected = needText.includes(sug.label);
              return (
                <TouchableOpacity
                  key={sug.label}
                  style={[
                    styles.needChip,
                    isSelected && styles.needChipSelected,
                  ]}
                  onPress={() => setNeedText(sug.label)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Tipo de ayuda: ${sug.label}`}
                >
                  <Icon
                    name={sug.icon}
                    size={18}
                    color={isSelected ? colors.onPrimary : brand.espresso}
                  />
                  <Text
                    style={[
                      styles.needChipText,
                      isSelected && styles.needChipTextSelected,
                    ]}
                  >
                    {sug.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Entrada de texto detallada */}
        <TextInput
          style={styles.textInput}
          placeholder="Escribe detalles específicos de la ayuda requerida (p. ej. persona con movilidad reducida, niños pequeños, falta de agua)..."
          placeholderTextColor={colors.outline}
          value={needText}
          onChangeText={setNeedText}
          multiline
          numberOfLines={3}
          accessible={true}
          accessibilityLabel="Descripción detallada de la ayuda necesitada"
        />

        {/* Contador de personas afectadas */}
        <View style={styles.counterSection}>
          <Text style={styles.inputLabel}>Cantidad de personas afectadas:</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPeopleCount((p) => Math.max(1, p - 1))}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Disminuir cantidad de personas"
            >
              <Icon name="remove" size={22} color={brand.espresso} />
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterNumber}>{peopleCount}</Text>
              <Text style={styles.counterLabel}>
                {peopleCount === 1 ? 'persona' : 'personas'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPeopleCount((p) => p + 1)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Aumentar cantidad de personas"
            >
              <Icon name="add" size={22} color={brand.espresso} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle de ubicación GPS */}
        <TouchableOpacity
          style={styles.locationToggle}
          onPress={() => setIncludeLocation(!includeLocation)}
          accessible={true}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: includeLocation }}
          accessibilityLabel="Adjuntar ubicación GPS a la solicitud de rescate"
        >
          <Icon
            name={includeLocation ? 'check_box' : 'check_box_outline_blank'}
            size={24}
            color={includeLocation ? brand.prevention : colors.outline}
          />
          <View style={styles.locationTextCol}>
            <Text style={styles.locationTitle}>Adjuntar coordenadas de rescate</Text>
            <Text style={styles.locationSubtitle}>
              {includeLocation ? 'Lat: 4.5981, Lon: -74.0760 (Bogotá D.C.)' : 'Sin ubicación GPS'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Botón de envío */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting }}
          accessibilityLabel="Enviar solicitud de ayuda"
        >
          <Icon name="cell_tower" size={20} color={colors.onPrimary} />
          <Text style={styles.submitBtnText}>
            {submitting ? 'Encolando solicitud...' : 'Enviar Solicitud de Ayuda'}
          </Text>
        </TouchableOpacity>
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
  titleSection: {
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
  },
  subtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
    lineHeight: 20,
  },
  urgentAlertCard: {
    backgroundColor: colors.surface,
    borderColor: colors.terracottaAlert,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  urgentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.panicContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTextCol: {
    flex: 1,
  },
  urgentAlertTitle: {
    ...typography.scale.headlineSm,
    color: colors.panic,
  },
  urgentAlertBody: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    marginTop: 2,
    lineHeight: 18,
  },
  urgentBtn: {
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.panic,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  urgentBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPanic,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  needChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minHeight: touchTargets.min,
    borderWidth: 1,
    borderColor: brand.border,
  },
  needChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  needChipText: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    fontWeight: '600',
  },
  needChipTextSelected: {
    color: colors.onPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 88,
    textAlignVertical: 'top',
    color: brand.espresso,
    ...typography.scale.bodyMd,
    backgroundColor: colors.surface,
  },
  counterSection: {
    gap: spacing.xs,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.border,
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 90,
  },
  counterNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.espresso,
  },
  counterLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
    minHeight: touchTargets.min,
  },
  locationTextCol: {
    flex: 1,
  },
  locationTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  locationSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
  },
});
