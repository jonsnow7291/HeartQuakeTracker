import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useServices } from '../hooks/useServices';
import type { PermissionKind, PermissionStatus } from '../../contracts/permissions';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, touchTargets, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

interface PermissionItemDef {
  kind: PermissionKind;
  name: string;
  desc: string;
  icon: string;
  critical: boolean;
}

const PERMISSION_DEFS: PermissionItemDef[] = [
  {
    kind: 'location',
    name: 'Ubicación GPS',
    desc: 'Necesaria para posicionar tu baliza de auxilio y mostrar puntos de socorro cercanos.',
    icon: 'location_on',
    critical: true,
  },
  {
    kind: 'bluetooth',
    name: 'Bluetooth / BLE',
    desc: 'Indispensable para emitir la baliza de rescate y formar la red de malla ciudadana.',
    icon: 'bluetooth',
    critical: true,
  },
  {
    kind: 'notifications',
    name: 'Notificaciones Críticas',
    desc: 'Permite alertarte sobre sismos detectados y simulacros comunitarios.',
    icon: 'notifications',
    critical: false,
  },
  {
    kind: 'motion',
    name: 'Sensores de Movimiento',
    desc: 'Permite al acelerómetro registrar sacudidas sísmicas locales.',
    icon: 'vibration',
    critical: false,
  },
  {
    kind: 'camera_flash',
    name: 'Linterna / Flash LED',
    desc: 'Emite pulsos estroboscópicos a 4 Hz para visibilidad en rescates nocturnos.',
    icon: 'flashlight_on',
    critical: false,
  },
  {
    kind: 'background_location',
    name: 'Ubicación en Segundo Plano',
    desc: 'Actualiza tus coordenadas en la baliza incluso si la pantalla se apaga.',
    icon: 'public',
    critical: false,
  },
];

export function PermissionsScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { permissions } = useServices();

  const [statuses, setStatuses] = useState<Record<PermissionKind, PermissionStatus>>({
    location: 'undetermined',
    bluetooth: 'undetermined',
    notifications: 'undetermined',
    motion: 'undetermined',
    camera_flash: 'undetermined',
    background_location: 'undetermined',
  });

  const [missingEmergency, setMissingEmergency] = useState<PermissionKind[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadStatuses = useCallback(async () => {
    try {
      const result: Partial<Record<PermissionKind, PermissionStatus>> = {};
      for (const def of PERMISSION_DEFS) {
        result[def.kind] = await permissions.status(def.kind);
      }
      setStatuses(result as Record<PermissionKind, PermissionStatus>);

      const missing = await permissions.missingForEmergency();
      setMissingEmergency(missing);
    } catch (err) {
      console.warn('[PermissionsScreen] Error consultando permisos:', err);
    }
  }, [permissions]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleRequestSingle = async (kind: PermissionKind) => {
    try {
      const newStatus = await permissions.request(kind);
      setStatuses((prev) => ({ ...prev, [kind]: newStatus }));
      const missing = await permissions.missingForEmergency();
      setMissingEmergency(missing);
    } catch {
      Alert.alert('Error', 'No se pudo solicitar el permiso.');
    }
  };

  const handleRequestAllEmergency = async () => {
    try {
      setLoading(true);
      for (const kind of missingEmergency) {
        await permissions.request(kind);
      }
      await loadStatuses();
    } catch {
      Alert.alert('Error', 'No se pudieron completar todas las solicitudes de permiso.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await permissions.openSettings();
    } catch {
      Alert.alert('Aviso', 'Abre la configuración del sistema para gestionar permisos.');
    }
  };

  const getStatusLabel = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return 'Concedido';
      case 'denied':
        return 'Denegado';
      case 'blocked':
        return 'Bloqueado';
      case 'undetermined':
      default:
        return 'Sin solicitar';
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Permisos del Sistema"
        eyebrow="ACCESOS DE EMERGENCIA"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Gestión de Accesos de Emergencia</Text>
          <Text style={styles.subtitle}>
            EarthQuakeTracker requiere estos permisos exclusivamente para salvar vidas en caso de terremoto.
          </Text>

          {missingEmergency.length > 0 ? (
            <View style={styles.emergencyWarningCard}>
              <View style={styles.warningTitleRow}>
                <Icon name="warning" size={22} color={colors.panic} />
                <Text style={styles.warningTitle}>Faltan Permisos Críticos para Pánico</Text>
              </View>
              <Text style={styles.warningBody}>
                Faltan {missingEmergency.length} permisos fundamentales para que el Botón de Pánico y la Baliza BLE funcionen correctamente.
              </Text>
              <Button
                title="Otorgar Permisos de Emergencia"
                variant="danger"
                loading={loading}
                onPress={handleRequestAllEmergency}
                style={styles.emergencyBtn}
              />
            </View>
          ) : (
            <View style={styles.bannerMargin}>
              <Banner
                kind="success"
                title="Permisos Completos"
                message="Todos los permisos críticos de rescate están concedidos y operativos."
              />
            </View>
          )}

          <View style={styles.list}>
            {PERMISSION_DEFS.map((def) => {
              const autoGranted = def.kind === 'motion' && Platform.OS === 'android';
              const status: PermissionStatus = autoGranted
                ? 'granted'
                : statuses[def.kind] ?? 'undetermined';
              const isGranted = status === 'granted';

              return (
                <View key={def.kind} style={styles.permCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.permIconBadge, def.critical && styles.permIconBadgeCritical]}>
                      <Icon
                        name={def.icon}
                        size={24}
                        color={def.critical ? brand.during : brand.espresso}
                      />
                    </View>
                    <View style={styles.permTextCol}>
                      <Text style={styles.permName}>{def.name}</Text>
                      {def.critical ? (
                        <Text style={styles.criticalTag}>CRÍTICO PARA PÁNICO</Text>
                      ) : null}
                    </View>
                    <StatusPill
                      type={isGranted ? 'online' : 'offline'}
                      label={getStatusLabel(status)}
                    />
                  </View>

                  <Text style={styles.permDesc}>{def.desc}</Text>

                  {!isGranted ? (
                    <View style={styles.cardActions}>
                      <Button
                        title="Solicitar Permiso"
                        variant="primary"
                        onPress={() => handleRequestSingle(def.kind)}
                        style={styles.requestBtn}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={handleOpenSettings}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir configuración del sistema"
          >
            <Icon name="settings" size={20} color={brand.espresso} />
            <Text style={styles.settingsBtnText}>Abrir Configuración del Teléfono</Text>
          </TouchableOpacity>
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
  emergencyWarningCard: {
    backgroundColor: colors.panicContainer,
    borderColor: colors.panic,
    borderWidth: 1.5,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningTitle: {
    ...typography.scale.headlineSm,
    color: colors.panic,
    flex: 1,
  },
  warningBody: {
    ...typography.scale.bodySm,
    color: colors.onSurface,
    marginVertical: spacing.xs,
    lineHeight: 18,
  },
  emergencyBtn: {
    marginTop: spacing.xs,
    minHeight: 52,
  },
  bannerMargin: {
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  permCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  permIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIconBadgeCritical: {
    backgroundColor: colors.secondaryContainer,
  },
  permTextCol: {
    flex: 1,
  },
  permName: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  criticalTag: {
    ...typography.scale.labelCaps,
    color: colors.panic,
    fontSize: 10,
    marginTop: 2,
  },
  permDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  cardActions: {
    marginTop: spacing.sm,
  },
  requestBtn: {
    minHeight: 48,
  },
  settingsBtn: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: brand.espresso,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  settingsBtnText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
});
