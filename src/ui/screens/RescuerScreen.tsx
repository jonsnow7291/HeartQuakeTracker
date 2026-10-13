import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useServices } from '../hooks/useServices';
import type { ReceivedMedicalCard } from '../../contracts/rescuer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export function RescuerScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { rescuer } = useServices();

  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [credCode, setCredCode] = useState<string>('');
  const [cards, setCards] = useState<ReceivedMedicalCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    try {
      const list = await rescuer.listReceived();
      setCards(list);
    } catch (err) {
      console.warn('[RescuerScreen] Error cargando tarjetas:', err);
    }
  }, [rescuer]);

  useEffect(() => {
    if (isEnabled) {
      loadCards();
      const unsub = rescuer.subscribeReceived((newCard) => {
        setCards((prev) => [newCard, ...prev.filter((c) => c.fromIdEphemeral !== newCard.fromIdEphemeral)]);
      });
      return () => unsub();
    }
  }, [isEnabled, loadCards, rescuer]);

  const handleEnable = async () => {
    if (!credCode.trim()) {
      Alert.alert('Código Requerido', 'Por favor ingresa tu código de credencial de socorrista.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await rescuer.enable({ code: credCode.trim() });
      setIsEnabled(true);
      await loadCards();
    } catch (err: any) {
      const msg =
        err?.code === 'RECEIVER_NOT_AUTHORIZED'
          ? 'Código no autorizado. Esta función es de uso exclusivo para brigadistas y personal acreditado de Defensa Civil, Cruz Roja o Bomberos.'
          : 'No se pudo activar el modo socorrista.';
      setErrorMessage(msg);
      Alert.alert('Autenticación Fallida', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    rescuer.disable();
    setIsEnabled(false);
    setCards([]);
    setCredCode('');
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Modo Socorrista"
        eyebrow="RADAR GATT BLE"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {!isEnabled ? (
            /* Vista de autenticación para personal institucional */
            <View>
              <Text style={styles.title}>Acreditación Institucional (RF-13)</Text>
              <Text style={styles.subtitle}>
                El modo socorrista permite recibir de forma inalámbrica vía BLE GATT las fichas médicas cifradas de personas atrapadas o heridas en un radio de 30 metros.
              </Text>

              {errorMessage && (
                <View style={styles.bannerMargin}>
                  <Banner
                    kind="critical"
                    title="Error de Acreditación"
                    message={errorMessage}
                  />
                </View>
              )}

              <View style={styles.authCard}>
                <View style={styles.authHeader}>
                  <Icon name="health_and_safety" size={24} color={brand.after} />
                  <Text style={styles.authTitle}>Ingreso de Credencial</Text>
                </View>
                <Text style={styles.authDesc}>
                  Ingresa el código oficial provisto por tu organismo de rescate (ej. XXX-XXXX-XXXX-XXXX).
                </Text>

                <Text style={styles.inputLabel}>Código de socorrista acreditado:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Código oficial..."
                  placeholderTextColor={colors.outline}
                  value={credCode}
                  onChangeText={setCredCode}
                  autoCapitalize="characters"
                  accessible={true}
                  accessibilityLabel="Código de socorrista"
                />

                <TouchableOpacity
                  style={styles.authBtn}
                  onPress={handleEnable}
                  disabled={loading}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Habilitar escucha GATT"
                  accessibilityState={{ disabled: loading }}
                >
                  <Icon name="lock_open" size={20} color={colors.onPrimary} />
                  <Text style={styles.authBtnText}>
                    {loading ? 'Verificando...' : 'Habilitar Escucha GATT'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.securityNoticeCard}>
                <View style={styles.noticeHeader}>
                  <Icon name="policy" size={20} color={brand.espresso} />
                  <Text style={styles.noticeTitle}>Privacidad y Ley 1581 (Habeas Data)</Text>
                </View>
                <Text style={styles.noticeBody}>
                  Los datos médicos transmitidos en emergencia son de carácter altamente confidencial. La firma digital de cada tarjeta es verificada antes de mostrar diagnósticos y contactos.
                </Text>
              </View>
            </View>
          ) : (
            /* Vista de monitoreo activo y radar de tarjetas médicas recibidas */
            <View>
              <View style={styles.activeHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.radarTitleRow}>
                    <Icon name="sensors" size={22} color={brand.prevention} />
                    <Text style={styles.radarTitle}>Radar de Rescate Activo</Text>
                  </View>
                  <Text style={styles.radarSubtitle}>
                    Escuchando balizas BLE y solicitudes de ficha médica en proximidad (30 m).
                  </Text>
                </View>
                <Button
                  title="Detener"
                  variant="outline"
                  onPress={handleDisable}
                  style={styles.stopBtn}
                />
              </View>

              <View style={styles.activePillContainer}>
                <StatusPill type="online" label="Escaneo GATT Activo" />
                <Text style={styles.cardsCounter}>Fichas recibidas: {cards.length}</Text>
              </View>

              {cards.length === 0 ? (
                <EmptyState
                  title="Sin señales detectadas"
                  description="No hay personas transmitiendo balizas de emergencia o fichas médicas en el radio de alcance inmediato."
                  icon="sensors"
                />
              ) : (
                cards.map((card) => {
                  const isTrapped = card.severity === 'ATRAPADO';
                  const isInjured = card.severity === 'CON_LESIONES';

                  return (
                    <View
                      key={card.fromIdEphemeral}
                      style={[
                        styles.cardItem,
                        isTrapped && styles.cardItemTrapped,
                        isInjured && styles.cardItemInjured,
                      ]}
                    >
                      <View style={styles.cardItemHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.tagRow}>
                            <Badge title={card.severity} />
                            <Text style={styles.cardTime}>
                              {new Date(card.receivedAt).toLocaleTimeString('es-CO')}
                            </Text>
                          </View>
                          <Text style={styles.cardId}>ID Efímero: {card.fromIdEphemeral}</Text>
                        </View>
                        <StatusPill
                          type={card.signatureValid ? 'online' : 'offline'}
                          label={card.signatureValid ? 'Firma Válida' : 'Firma No Válida'}
                        />
                      </View>

                      {/* Alertas de integridad */}
                      {!card.signatureValid && (
                        <View style={styles.warningBox}>
                          <Icon name="warning" size={16} color={brand.during} />
                          <Text style={styles.warningText}>
                            Firma digital no verificada. Los datos podrían haber sido alterados.
                          </Text>
                        </View>
                      )}

                      {card.incomplete && (
                        <View style={styles.warningBox}>
                          <Icon name="info" size={16} color={brand.after} />
                          <Text style={styles.warningText}>
                            Ficha médica parcial: Se transmitió un paquete reducido por límites BLE.
                          </Text>
                        </View>
                      )}

                      {/* Datos médicos del paciente */}
                      <View style={styles.medicalInfoBox}>
                        <Text style={styles.medicalInfoTitle}>Datos Clínicos de Urgencia:</Text>

                        <View style={styles.medicalGrid}>
                          <View style={styles.medicalRow}>
                            <Icon name="bloodtype" size={16} color={colors.panic} />
                            <Text style={styles.medicalLabel}>
                              Tipo de Sangre: <Text style={styles.medicalValue}>{card.profile?.bloodType ?? 'No informado'}</Text>
                            </Text>
                          </View>
                          <View style={styles.medicalRow}>
                            <Icon name="warning" size={16} color={brand.during} />
                            <Text style={styles.medicalLabel}>
                              Alergias: <Text style={styles.medicalValue}>{card.profile?.allergies?.join(', ') || 'Ninguna registrada'}</Text>
                            </Text>
                          </View>
                          <View style={styles.medicalRow}>
                            <Icon name="medication" size={16} color={brand.after} />
                            <Text style={styles.medicalLabel}>
                              Medicamentos: <Text style={styles.medicalValue}>{card.profile?.medications?.join(', ') || 'Ninguno'}</Text>
                            </Text>
                          </View>
                          <View style={styles.medicalRow}>
                            <Icon name="local_hospital" size={16} color={brand.prevention} />
                            <Text style={styles.medicalLabel}>
                              Enfermedades: <Text style={styles.medicalValue}>{card.profile?.conditions?.join(', ') || 'Ninguna'}</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Contactos de emergencia */}
                        {card.profile?.contacts && card.profile.contacts.length > 0 && (
                          <View style={styles.contactsBox}>
                            <View style={styles.contactsTitleRow}>
                              <Icon name="call" size={14} color={brand.espresso} />
                              <Text style={styles.contactsTitle}>Contactos SOS:</Text>
                            </View>
                            {card.profile.contacts.map((c, i) => (
                              <Text key={i} style={styles.contactItem}>
                                • {c.name} ({c.relation ?? 'Contacto'}): {c.phone}
                              </Text>
                            ))}
                          </View>
                        )}

                        {card.position && (
                          <View style={styles.positionRow}>
                            <Icon name="location_on" size={16} color={brand.during} />
                            <Text style={styles.positionText}>
                              Coordenadas: Lat {card.position.lat.toFixed(4)}, Lon {card.position.lon.toFixed(4)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
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
  bannerMargin: {
    marginBottom: spacing.md,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  authTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  authDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  inputLabel: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    marginBottom: spacing.xxs,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.onSurface,
    backgroundColor: colors.background,
    ...typography.scale.bodyMd,
    marginBottom: spacing.md,
  },
  authBtn: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  authBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  securityNoticeCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  noticeTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
  },
  noticeBody: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  radarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  radarTitle: {
    ...typography.scale.headlineSm,
    color: brand.prevention,
    fontWeight: '800',
  },
  radarSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  stopBtn: {
    minHeight: 48,
    minWidth: 80,
  },
  activePillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  cardsCounter: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  cardItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  cardItemTrapped: {
    borderLeftWidth: 6,
    borderLeftColor: colors.panic,
    backgroundColor: colors.panicContainer,
  },
  cardItemInjured: {
    borderLeftWidth: 6,
    borderLeftColor: brand.during,
    backgroundColor: colors.warningContainer,
  },
  cardItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTime: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  cardId: {
    ...typography.scale.bodySm,
    color: colors.outline,
    fontFamily: 'monospace',
    marginTop: spacing.xxs,
  },
  warningBox: {
    backgroundColor: colors.warningContainer,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    ...typography.scale.bodySm,
    color: brand.during,
    fontSize: 11,
    flex: 1,
  },
  medicalInfoBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  medicalInfoTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    marginBottom: spacing.xs,
  },
  medicalGrid: {
    gap: spacing.xxs,
  },
  medicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medicalLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  medicalValue: {
    fontWeight: '700',
    color: colors.onSurface,
  },
  contactsBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  contactsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xxs,
  },
  contactsTitle: {
    ...typography.scale.labelCaps,
    color: brand.espresso,
  },
  contactItem: {
    ...typography.scale.bodySm,
    color: colors.onSurface,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  positionText: {
    ...typography.scale.bodySm,
    color: brand.during,
    fontWeight: '700',
  },
});
