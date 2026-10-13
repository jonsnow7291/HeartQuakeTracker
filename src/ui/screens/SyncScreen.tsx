import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useServices } from '../hooks/useServices';
import type { SyncStatus, OwnReportSummary } from '../../contracts/sync';
import type { AppError } from '../../contracts/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { Banner } from '../components/Banner';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

interface SyncFeedback {
  tone: 'success' | 'error';
  title: string;
  message: string;
}

function describeSyncError(err: Partial<AppError> | undefined): SyncFeedback {
  const realMessage = err?.message?.trim();
  switch (err?.code) {
    case 'NETWORK_UNAVAILABLE':
      return {
        tone: 'error',
        title: 'Sin conexión',
        message:
          realMessage ||
          'No se pudo conectar con el servidor central. Tus reportes permanecen a salvo en la memoria cifrada del teléfono.',
      };
    case 'AUTH_FAILED':
      return {
        tone: 'error',
        title: 'Autenticación fallida',
        message:
          realMessage ||
          'Tu sesión no pudo validarse con el servidor. Vuelve a iniciar sesión para sincronizar tus reportes.',
      };
    case 'SYNC_PARTIAL':
      return {
        tone: 'error',
        title: 'Sincronización parcial',
        message:
          realMessage ||
          'Algunos reportes quedaron pendientes y se reintentarán automáticamente.',
      };
    default:
      return {
        tone: 'error',
        title: 'Sincronización no completada',
        message: realMessage || 'No se pudo completar la sincronización con el servidor.',
      };
  }
}

function getReportDisplay(
  item: OwnReportSummary
): { label: string; icon: string; safe: boolean } {
  const kind = item.kind ?? '';
  const description = (item as OwnReportSummary & { description?: string }).description;
  const isSafe =
    kind.toUpperCase().includes('ESTOY_A_SALVO') ||
    description?.toUpperCase() === 'ESTOY_A_SALVO';

  if (isSafe) {
    return { label: 'Estoy a salvo', icon: 'check_circle', safe: true };
  }
  if (kind.startsWith('AYUDA:')) {
    return { label: kind, icon: 'volunteer_activism', safe: false };
  }
  if (kind.startsWith('DAÑO:')) {
    return { label: kind, icon: 'report_problem', safe: false };
  }
  return { label: kind, icon: 'receipt_long', safe: false };
}

export function SyncScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { sync, reports } = useServices();

  const [status, setStatus] = useState<SyncStatus>(() => sync.getStatus());
  const [ownReports, setOwnReports] = useState<OwnReportSummary[]>([]);
  const [manualSyncing, setManualSyncing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SyncFeedback | null>(null);

  const loadData = useCallback(async () => {
    try {
      setStatus(sync.getStatus());
      const reps = await reports.listOwnReports();
      setOwnReports(reps);
    } catch (err) {
      console.warn('[SyncScreen] Error al cargar estado de sync:', err);
    }
  }, [sync, reports]);

  useEffect(() => {
    loadData();

    const unsub = sync.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => unsub();
  }, [loadData, sync]);

  const handleSyncNow = async () => {
    try {
      setManualSyncing(true);
      setFeedback(null);
      await sync.syncNow();
      await loadData();
      setFeedback({
        tone: 'success',
        title: 'Sincronización finalizada',
        message: 'Los datos locales han sido transmitidos exitosamente.',
      });
    } catch (err: any) {
      console.warn('[SyncScreen] syncNow falló:', err?.code, err?.message);
      setFeedback(describeSyncError(err));
    } finally {
      setManualSyncing(false);
    }
  };

  const isSyncInProgress = status.syncing || manualSyncing;
  const incident = feedback ?? (status.lastError ? describeSyncError(status.lastError) : null);

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Sincronización"
        eyebrow="STORE AND FORWARD"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Un único aviso: el motivo real de la sincronización o el estado de conectividad */}
          {incident ? (
            <View style={styles.bannerMargin}>
              <Banner
                kind={incident.tone === 'success' ? 'success' : 'warning'}
                title={incident.title}
                message={incident.message}
              />
            </View>
          ) : !status.online ? (
            <View style={styles.bannerMargin}>
              <Banner
                kind="warning"
                title="Modo Desconectado"
                message="No hay señal celular ni internet. Los eventos se transmiten vía red de malla BLE y se sincronizarán al restablecerse la red."
              />
            </View>
          ) : null}

          {/* Tarjeta de métricas de sincronización */}
          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{status.pending}</Text>
                <Text style={styles.metricLabel}>Eventos en cola</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <StatusPill
                  type={status.online ? 'online' : 'offline'}
                  label={status.online ? 'En línea' : 'Sin red'}
                />
                <Text style={styles.metricLabel}>Conectividad</Text>
              </View>
            </View>

            <View style={styles.lastSyncRow}>
              <Text style={styles.lastSyncLabel}>Última sincronización:</Text>
              <Text style={styles.lastSyncValue}>
                {status.lastSyncAt
                  ? new Date(status.lastSyncAt).toLocaleString('es-CO')
                  : 'Ninguna en esta sesión'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.syncBtn, isSyncInProgress && styles.syncBtnDisabled]}
              onPress={handleSyncNow}
              disabled={isSyncInProgress}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSyncInProgress }}
              accessibilityLabel="Sincronizar ahora"
            >
              <Icon name="sync" size={20} color={colors.onPrimary} />
              <Text style={styles.syncBtnText}>
                {isSyncInProgress ? 'Sincronizando cola…' : 'Sincronizar Ahora'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Explicación de Store-and-Forward (RF-12) */}
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <Icon name="cloud_sync" size={22} color={brand.after} />
              <Text style={styles.infoTitle}>Arquitectura Store-and-Forward</Text>
            </View>
            <Text style={styles.infoBody}>
              Todos los reportes de daños, alertas sísmicas colaborativas y estados de "Estoy a salvo" se guardan con identificador único (idempotencia) en la base de datos local.
            </Text>
            <Text style={styles.infoBody}>
              Al encontrar un nodo con Wi-Fi, antena celular o nodo puente de rescate, la cola se vacía garantizando cero pérdida de información crítica.
            </Text>
          </View>

          {/* Lista de reportes en el dispositivo */}
          <Text style={styles.listHeading}>Reportes Locales ({ownReports.length})</Text>
          {ownReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="inbox" size={36} color={colors.outline} />
              <Text style={styles.emptyText}>No hay reportes en la cola de este dispositivo.</Text>
            </View>
          ) : (
            ownReports.map((item) => {
              const display = getReportDisplay(item);
              return (
                <View key={item.id} style={styles.reportCard}>
                  <View style={styles.reportRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.reportKindRow}>
                        <Icon
                          name={display.icon}
                          size={18}
                          color={display.safe ? brand.prevention : brand.espresso}
                          filled={display.safe}
                        />
                        <Text style={[styles.reportKind, display.safe && styles.reportKindSafe]}>
                          {display.label}
                        </Text>
                      </View>
                      <Text style={styles.reportTime}>
                        {new Date(item.ts).toLocaleString('es-CO')}
                      </Text>
                      <Text style={styles.reportId}>ID: {item.id}</Text>
                    </View>
                    <StatusPill
                      type={item.synced ? 'online' : 'syncing'}
                      label={item.synced ? 'Transmitido' : 'Pendiente'}
                    />
                  </View>
                </View>
              );
            })
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
  bannerMargin: {
    marginBottom: spacing.md,
  },
  metricCard: {
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.outlineVariant,
  },
  metricVal: {
    fontSize: 34,
    fontWeight: '800',
    color: brand.during,
  },
  metricLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  lastSyncLabel: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
  },
  lastSyncValue: {
    ...typography.scale.bodySm,
    fontWeight: '700',
    color: colors.onSurface,
  },
  syncBtn: {
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  syncBtnDisabled: {
    opacity: 0.7,
  },
  syncBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
  },
  infoBody: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  listHeading: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.xs,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportKind: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
    flexShrink: 1,
  },
  reportKindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reportKindSafe: {
    color: brand.prevention,
  },
  reportTime: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xxs,
  },
  reportId: {
    ...typography.scale.bodySm,
    color: colors.outline,
    fontSize: 10,
    marginTop: spacing.xxs,
  },
});
