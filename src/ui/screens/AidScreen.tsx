import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import type { AidEntity, AidNeed, AidChannel } from '../../contracts/aid';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Badge } from '../components/Badge';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';

export function AidScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { aid } = useServices();

  const [entities, setEntities] = useState<AidEntity[]>([]);
  const [needs, setNeeds] = useState<AidNeed[]>([]);
  const [filterKind, setFilterKind] = useState<'ALL' | 'GOBIERNO' | 'ONG' | 'SOCORRO'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ents, nds] = await Promise.all([aid.listEntities(), aid.listNeeds()]);
      setEntities(ents);
      setNeeds(nds);
    } catch (err) {
      console.warn('[AidScreen] Error al cargar entidades y necesidades:', err);
    } finally {
      setLoading(false);
    }
  }, [aid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEntities = entities.filter((e) => {
    if (filterKind === 'ALL') return true;
    return e.kind === filterKind;
  });

  const getNeedIcon = (category: string) => {
    const cat = category.toUpperCase();
    if (cat.includes('ALIMENT') || cat.includes('VIVER')) return 'lunch_dining';
    if (cat.includes('AGUA')) return 'water_drop';
    if (cat.includes('MEDIC') || cat.includes('SALUD')) return 'medication';
    if (cat.includes('ROPA') || cat.includes('COBIJ') || cat.includes('ABRIGO')) return 'bed';
    if (cat.includes('HIGIENE') || cat.includes('ASEO')) return 'soap';
    return 'inventory_2';
  };

  const getUrgencyBadge = (urgency: AidNeed['urgency']) => {
    switch (urgency) {
      case 'ALTA':
        return (
          <View style={[styles.urgencyBadge, styles.urgencyHigh]}>
            <Text style={styles.urgencyHighText}>ALTA</Text>
          </View>
        );
      case 'MEDIA':
        return (
          <View style={[styles.urgencyBadge, styles.urgencyMedium]}>
            <Text style={styles.urgencyMediumText}>MEDIA</Text>
          </View>
        );
      case 'BAJA':
      default:
        return (
          <View style={[styles.urgencyBadge, styles.urgencyLow]}>
            <Text style={styles.urgencyLowText}>MODERADA</Text>
          </View>
        );
    }
  };

  const openExternal = useCallback((url: string, failMessage: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('[AidScreen] No se pudo abrir el enlace externo:', err);
      Alert.alert('No se pudo abrir', failMessage);
    });
  }, []);

  const isChannelActionable = (ch: AidChannel) =>
    ch.type === 'TEL' || ch.type === 'WEB' || ch.type === 'EMAIL';

  const handleChannelPress = (entity: AidEntity, ch: AidChannel) => {
    if (!ch.active) return;
    if (ch.type === 'TEL') {
      const number = ch.value.replace(/[^0-9+]/g, '');
      openExternal(`tel:${number}`, `No se pudo abrir el marcador para llamar a ${entity.name}.`);
    } else if (ch.type === 'WEB') {
      openExternal(ch.value, `No se pudo abrir el sitio web oficial de ${entity.name}.`);
    } else if (ch.type === 'EMAIL') {
      openExternal(`mailto:${ch.value}`, `No se pudo abrir el correo de ${entity.name}.`);
    }
  };

  const handleDonate = (entity: AidEntity) => {
    const officialChannel = entity.channels.find((ch) => ch.active && ch.type === 'WEB');
    if (!officialChannel) return;
    openExternal(
      officialChannel.value,
      `No se pudo abrir el canal oficial de donación de ${entity.name}.`
    );
  };

  return (
    <View style={styles.root}>
      {/* Cabecera Steel Blue de fase Después según DESIGN.md */}
      <ScreenHeader
        title="Ayudas y Donaciones"
        eyebrow="DIRECTORIO OFICIAL VERIFICADO"
        tone="after"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Aviso legal estricto: RF-11 Directorio puramente informativo */}
        <Banner
          kind="warning"
          title="Directorio Oficial Informativo"
          message="DIRECTORIO INFORMATIVO: EarthQuakeTracker NO recauda fondos ni procesa pagos. Consulta los canales oficiales verificados de las autoridades colombianas."
        />

        {/* Acceso rápido a solicitar auxilio si el usuario es víctima (RF-11 Alterno A2) */}
        <Card style={styles.immediateHelpCard}>
          <View style={styles.immediateHelpHeader}>
            <View style={styles.immediateHelpIconCircle}>
              <Icon name="emergency" size={24} color={colors.panic} filled />
            </View>
            <View style={styles.immediateHelpTextCol}>
              <Text style={styles.immediateHelpTitle}>¿Necesitas ayuda inmediata en tu zona?</Text>
              <Text style={styles.immediateHelpDesc}>
                Si tú o tu familia necesitan alimentos, agua o rescate médico, envía tu solicitud directa a los brigadistas.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.immediateHelpBtn}
            onPress={() => navigation.navigate('AidRequest')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Solicitar ayuda inmediata a brigadistas"
          >
            <Icon name="crisis_alert" size={18} color={colors.onPanic} filled />
            <Text style={styles.immediateHelpBtnText}>Solicitar Ayuda Inmediata</Text>
          </TouchableOpacity>
        </Card>

        {/* Necesidades humanitarias actuales */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="inventory_2" size={20} color={brand.during} filled />
            <Text style={styles.sectionTitle}>Necesidades Humanitarias Prioritarias</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Artículos y suministros requeridos en albergues y centros de acopio oficiales:
          </Text>
        </View>

        <View style={styles.needsList}>
          {needs.map((item) => (
            <Card key={item.id} style={styles.needCard}>
              <View style={styles.needCardHeader}>
                <View style={styles.needIconCircle}>
                  <Icon
                    name={getNeedIcon(item.category)}
                    size={20}
                    color={brand.espresso}
                  />
                </View>
                <View style={styles.needTextCol}>
                  <Text style={styles.needCategory}>{item.category}</Text>
                  <Text style={styles.needLabel}>{item.label}</Text>
                </View>
                {getUrgencyBadge(item.urgency)}
              </View>
            </Card>
          ))}
        </View>

        {/* Directorio de entidades autorizadas */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="verified_user" size={20} color={brand.prevention} filled />
            <Text style={styles.sectionTitle}>Entidades Oficiales Autorizadas</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Canales de atención verificados de la Defensa Civil, Cruz Roja y UNGRD:
          </Text>
        </View>

        {/* Filtros por tipo de entidad */}
        <View style={styles.filterRow}>
          <Chip
            label="Todas"
            selected={filterKind === 'ALL'}
            onPress={() => setFilterKind('ALL')}
          />
          <Chip
            label="Gobierno"
            selected={filterKind === 'GOBIERNO'}
            onPress={() => setFilterKind('GOBIERNO')}
          />
          <Chip
            label="Socorro"
            selected={filterKind === 'SOCORRO'}
            onPress={() => setFilterKind('SOCORRO')}
          />
          <Chip
            label="ONGs"
            selected={filterKind === 'ONG'}
            onPress={() => setFilterKind('ONG')}
          />
        </View>

        <View style={styles.entitiesList}>
          {filteredEntities.map((entity) => (
            <Card key={entity.id} style={styles.entityCard}>
              <View style={styles.entityHeader}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <View style={styles.badgeRow}>
                    <Badge title={entity.kind} />
                    <View style={styles.verifiedRow}>
                      <Icon
                        name={entity.verified ? 'verified' : 'info'}
                        size={14}
                        color={entity.verified ? brand.prevention : brand.during}
                        filled={entity.verified}
                      />
                      <Text style={[styles.verifiedText, !entity.verified && { color: brand.during }]}>
                        {entity.verified
                          ? `Verificado (${new Date(entity.verifiedAt).toLocaleDateString('es-CO')})`
                          : `Dato de referencia · revisado ${new Date(entity.verifiedAt).toLocaleDateString('es-CO')}, confirma el canal antes de usarlo`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.entityName}>{entity.name}</Text>
                </View>
                <StatusPill
                  type={entity.active ? 'online' : 'offline'}
                  label={entity.active ? 'Activa' : 'Inactiva'}
                />
              </View>

              {entity.description ? (
                <Text style={styles.entityDesc}>{entity.description}</Text>
              ) : null}

              {/* Canales de la entidad */}
              <View style={styles.channelsSection}>
                <Text style={styles.channelsTitle}>Canales de contacto y donación:</Text>
                {entity.channels.map((ch, idx) => {
                  const actionable = isChannelActionable(ch);
                  const canPress = ch.active && actionable;
                  const channelActionLabel =
                    ch.type === 'TEL'
                      ? `Llamar a ${entity.name}`
                      : ch.type === 'WEB'
                      ? `Abrir ${entity.name}`
                      : `Escribir a ${entity.name}`;

                  return (
                    <TouchableOpacity
                      key={`${entity.id}-ch-${idx}`}
                      style={[
                        styles.channelItem,
                        !ch.active && styles.channelItemInactive,
                      ]}
                      onPress={canPress ? () => handleChannelPress(entity, ch) : undefined}
                      disabled={!canPress}
                      activeOpacity={0.7}
                      accessible={canPress}
                      accessibilityRole={canPress ? 'link' : undefined}
                      accessibilityLabel={canPress ? channelActionLabel : undefined}
                    >
                      <View style={styles.channelRow}>
                        <View style={styles.channelTypeBadgeRow}>
                          <Icon
                            name={
                              ch.type === 'TEL'
                                ? 'call'
                                : ch.type === 'WEB'
                                ? 'language'
                                : ch.type === 'CUENTA'
                                ? 'account_balance'
                                : 'mail'
                            }
                            size={16}
                            color={brand.espresso}
                          />
                          <Text style={styles.channelTypeBadge}>
                            {ch.type === 'TEL' ? 'TELÉFONO' : ch.type === 'WEB' ? 'SITIO WEB' : ch.type === 'CUENTA' ? 'BANCO' : 'CORREO'}
                          </Text>
                        </View>
                        <View style={styles.channelValueGroup}>
                          <Text
                            style={[
                              styles.channelValue,
                              !ch.active && styles.channelValueInactive,
                            ]}
                            selectable={!canPress}
                          >
                            {ch.value}
                          </Text>
                          {canPress ? (
                            <Icon
                              name={
                                ch.type === 'TEL'
                                  ? 'call'
                                  : ch.type === 'WEB'
                                  ? 'open_in_new'
                                  : 'mail'
                              }
                              size={16}
                              color={brand.after}
                            />
                          ) : null}
                        </View>
                      </View>

                      {/* Estado del canal: activo vs inactivo (RF-11 Alterno A1) */}
                      {!ch.active ? (
                        <View style={styles.inactiveWarningBox}>
                          <Icon name="warning" size={14} color={colors.panic} />
                          <Text style={styles.inactiveWarning}>
                            CANAL INACTIVO: Deshabilitado temporalmente por auditoría o cese de recepción. No realizar transferencias por este medio.
                          </Text>
                        </View>
                      ) : null}

                      {ch.requirements ? (
                        <Text style={styles.channelReqs}>
                          Requisitos: {ch.requirements}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Donación: abre únicamente el canal oficial. La app nunca procesa pagos (D-05). */}
              {entity.channels.some((ch) => ch.active && ch.type === 'WEB') ? (
                <TouchableOpacity
                  style={styles.donateBtn}
                  onPress={() => handleDonate(entity)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Hacer donación a ${entity.name}`}
                >
                  <Icon name="volunteer_activism" size={18} color={brand.onPhase} filled />
                  <Text style={styles.donateBtnText}>Hacer donación</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  immediateHelpCard: {
    backgroundColor: colors.panicContainer,
    borderColor: colors.panic,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  immediateHelpHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  immediateHelpIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.panicContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  immediateHelpTextCol: {
    flex: 1,
  },
  immediateHelpTitle: {
    ...typography.scale.headlineSm,
    color: colors.panic,
  },
  immediateHelpDesc: {
    ...typography.scale.bodySm,
    color: brand.espresso,
    marginTop: 2,
    lineHeight: 18,
  },
  immediateHelpBtn: {
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.panic,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  immediateHelpBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPanic,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  sectionSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  needsList: {
    gap: spacing.xs,
  },
  needCard: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  needCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  needIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needTextCol: {
    flex: 1,
  },
  needCategory: {
    ...typography.scale.labelCaps,
    color: brand.during,
    textTransform: 'uppercase',
  },
  needLabel: {
    ...typography.scale.bodyMd,
    color: brand.espresso,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  urgencyHigh: {
    backgroundColor: colors.panicContainer,
  },
  urgencyHighText: {
    ...typography.scale.labelCaps,
    color: colors.onPanicContainer,
    fontWeight: '800',
  },
  urgencyMedium: {
    backgroundColor: colors.secondaryContainer,
  },
  urgencyMediumText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
  },
  urgencyLow: {
    backgroundColor: colors.surfaceVariant,
  },
  urgencyLowText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  entitiesList: {
    gap: spacing.sm,
  },
  entityCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    ...typography.scale.bodySm,
    color: brand.prevention,
    fontSize: 11,
    fontWeight: '600',
  },
  entityName: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  entityDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  channelsSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    gap: spacing.xs,
  },
  channelsTitle: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    marginBottom: 2,
  },
  channelItem: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    minHeight: touchTargets.min,
  },
  channelItemInactive: {
    backgroundColor: colors.panicContainer,
    borderColor: colors.panic,
    borderWidth: 1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelTypeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelTypeBadge: {
    ...typography.scale.labelCaps,
    color: brand.espresso,
  },
  channelValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    marginLeft: spacing.xs,
  },
  channelValue: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  channelValueInactive: {
    textDecorationLine: 'line-through',
    color: colors.panic,
  },
  inactiveWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  inactiveWarning: {
    ...typography.scale.bodySm,
    color: colors.panic,
    fontWeight: '700',
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  channelReqs: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  donateBtn: {
    minHeight: 48,
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: brand.during,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  donateBtnText: {
    ...typography.scale.labelLg,
    color: brand.onPhase,
  },
});
