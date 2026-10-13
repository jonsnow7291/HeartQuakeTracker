import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { StatusPill } from '../components/StatusPill';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles, useThemePreference, type ThemePreference } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { SessionUser } from '../../contracts/session';
import type { Badge } from '../../contracts/progress';
import type { MedicalProfile, EmergencyContact } from '../../contracts/medical';

interface DisplayContact {
  name: string;
  phone: string;
  relation: string;
  priority: number;
  icon: string;
}


const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export function ProfileScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { preference, setPreference } = useThemePreference();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, medical, progress } = useServices();

  const isUnlocked = useSubscribe(
    session ? (cb) => session.subscribe(cb) : undefined,
    session?.isUnlocked() ?? false
  );

  const [user, setUser] = useState<SessionUser | null>(null);
  const [hasMedicalProfile, setHasMedicalProfile] = useState<boolean>(false);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const loadData = async () => {
    try {
      if (session) {
        const u = await session.getUser();
        setUser(u);
      }
      if (medical) {
        const mExists = await medical.exists();
        setHasMedicalProfile(mExists);
        if (isUnlocked) {
          const p = await medical.get();
          setMedicalProfile(p);
        } else {
          setMedicalProfile(null);
        }
      }
      if (progress) {
        const b = await progress.listBadges();
        setBadges(b);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Error al cargar perfil:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [session, medical, progress, isUnlocked]);

  const handleLockToggle = () => {
    if (isUnlocked) {
      session.lock();
    } else {
      navigation.navigate('Unlock');
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
      console.warn('No se pudo abrir marcador telefónico:', err)
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Restablecer y borrar datos locales',
      '¿Estás seguro de que deseas eliminar tu ficha médica y tu progreso en quizzes e insignias? Esta acción cumple con la política de Habeas Data (ISO A.8.10) y es irreversible en este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              if (medical) await medical.remove();
              if (progress) await progress.resetAll();
              setResetSuccess(true);
              await loadData();
              setTimeout(() => setResetSuccess(false), 4000);
            } catch (err) {
              console.warn('[ProfileScreen] Error al resetear datos:', err);
            }
          },
        },
      ]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'Acerca de EarthQuakeTracker',
      'Versión 0.1.0 (desarrollo)\nApp comunitaria de preparación y respuesta ante sismos.\nDiseñada para operar sin conexión en Colombia.'
    );
  };

  const handleTermsPrivacy = () => {
    Alert.alert(
      'Términos y Privacidad (Habeas Data)',
      'Conforme a la Ley Estatutaria 1581 de 2012 y el estándar ISO A.8.10, tus datos de salud y localización permanecen cifrados localmente en tu teléfono con AES-256. Solo se transmiten por Bluetooth a brigadistas acreditados al activar una señal de pánico.'
    );
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  // Solo datos reales: la ficha está cifrada y, bloqueada o inexistente, no se inventan valores de relleno.
  const displayContacts: DisplayContact[] =
    medicalProfile?.contacts && medicalProfile.contacts.length > 0
      ? medicalProfile.contacts.map((c, idx) => ({
          name: c.name,
          phone: c.phone,
          relation: c.relation || 'Contacto',
          priority: idx + 1,
          icon: idx === 0 ? 'family_restroom' : idx === 1 ? 'person' : 'favorite',
        }))
      : [];

  const hasProfile = Boolean(medicalProfile);
  const bloodTypeDisplay = medicalProfile?.bloodType ?? (hasProfile ? 'Sin dato' : '—');

  const allergiesDisplay =
    medicalProfile?.allergies && medicalProfile.allergies.length > 0
      ? medicalProfile.allergies.join(' • ')
      : hasProfile
        ? 'Ninguna registrada'
        : '—';

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Alertas y Perfil"
        eyebrow="SISMOS TRACKER"
        tone="espresso"
        right={
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ver alertas sísmicas"
          >
            <Icon name="notifications" size={22} color={colors.onPrimary} />
          </TouchableOpacity>
        }
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {resetSuccess ? (
            <Banner
              kind="success"
              title="Datos restablecidos"
              message="Tu ficha médica y registros de progreso han sido eliminados del dispositivo según la política de Habeas Data."
            />
          ) : null}

          {/* Tarjeta de Referencia Rápida / Hero Médico de Usuario */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.avatarStatusBadge} accessibilityLabel="Modo Mesh Activo">
                  <Icon name="sensors" size={13} color={colors.tertiaryContainer} />
                </View>
              </View>

              <View style={styles.heroUserInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.displayName || 'Usuario'}
                  </Text>
                  <Icon name="verified_user" size={18} color={brand.during} />
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || 'Sin correo registrado'}
                </Text>
                <Text style={styles.userIdTag}>
                  {user?.id ? `ID: ${user.id.toUpperCase()}` : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={handleLockToggle}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isUnlocked ? 'Bloquear sesión médica' : 'Desbloquear sesión médica'}
              >
                <Icon name={isUnlocked ? 'lock_open' : 'lock'} size={22} color={brand.espresso} />
              </TouchableOpacity>
            </View>

            {/* Tira de Información Médica Crítica para Rescatistas */}
            <View style={styles.medicalStrip}>
              <View style={styles.medicalStripHeader}>
                <View style={styles.medicalStripTitleGroup}>
                  <Icon name="medical_services" size={18} color={colors.panic} />
                  <Text style={styles.medicalStripTitle}>Ficha de Rescate Rápido</Text>
                </View>
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>
                    {isUnlocked ? 'Sesión Desbloqueada' : 'Visible Bloqueado'}
                  </Text>
                </View>
              </View>

              <View style={styles.medicalGrid}>
                <View style={styles.medicalGridCol}>
                  <Text style={styles.medicalLabel}>Tipo de Sangre</Text>
                  <Text style={styles.bloodTypeValue}>{bloodTypeDisplay}</Text>
                </View>
                <View style={styles.medicalGridCol}>
                  <Text style={styles.medicalLabel}>Alergias Conocidas</Text>
                  <Text style={styles.allergiesValue} numberOfLines={1}>
                    {allergiesDisplay}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de acción para editar datos médicos */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('Medical')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Editar ficha médica y personal"
            >
              <Icon name="edit_note" size={20} color={brand.espresso} />
              <Text style={styles.editProfileBtnText}>Editar ficha médica y personal</Text>
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Contexto y Red Comunitaria (100% offline, sin imágenes remotas) */}
          <View style={styles.meshCard}>
            <View style={styles.meshCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.meshCardEyebrow}>RED COMUNITARIA</Text>
                <Text style={styles.meshCardTitle}>Red comunitaria por Bluetooth</Text>
                <Text style={styles.meshCardDesc}>
                  Se activa con el botón de pánico y retransmite sin cobertura celular.
                </Text>
              </View>
              <View style={styles.meshIconBadge}>
                <Icon name="hub" size={28} color={colors.tertiary} />
              </View>
            </View>
          </View>

          {/* Sección Contactos de Emergencia */}
          <View style={styles.contactsSection}>
            <View style={styles.contactsHeaderRow}>
              <View style={styles.contactsTitleGroup}>
                <Icon name="contact_emergency" size={22} color={brand.during} />
                <Text style={styles.contactsSectionTitle}>Contactos de Emergencia</Text>
                <View style={styles.contactsCountBadge}>
                  <Text style={styles.contactsCountText}>{displayContacts.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={() => navigation.navigate('Medical')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Añadir contacto de emergencia"
              >
                <Icon name="person_add" size={18} color={brand.during} />
                <Text style={styles.addContactBtnText}>Añadir</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer / Banner informativo de activación rápida */}
            <View style={styles.disclaimerBanner}>
              <Icon name="satellite_alt" size={20} color={brand.during} style={{ marginTop: 2 }} />
              <Text style={styles.disclaimerText}>
                Estos contactos recibirán una alerta por <Text style={styles.boldText}>SMS y red Mesh offline</Text> con tu ubicación si activas el botón de pánico.
              </Text>
            </View>

            {/* Tarjetas de Contactos */}
            <View style={styles.contactsList}>
              {displayContacts.length === 0 ? (
                <View style={styles.contactCard}>
                  <View style={styles.contactAvatar}>
                    <Icon name={isUnlocked ? 'person_add' : 'lock'} size={24} color={brand.espresso} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{isUnlocked ? 'Aún no tienes contactos' : 'Contactos protegidos'}</Text>
                    <Text style={styles.contactPhone}>
                      {isUnlocked ? 'Añádelos en tu ficha médica.' : 'Desbloquea tu sesión para verlos.'}
                    </Text>
                  </View>
                </View>
              ) : null}
              {displayContacts.map((contact, idx) => (
                <View key={idx} style={styles.contactCard}>
                  <View style={styles.contactAvatar}>
                    <Icon name={contact.icon} size={24} color={brand.espresso} />
                  </View>
                  <View style={styles.contactDetails}>
                    <View style={styles.contactNameRow}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <View style={styles.priorityPill}>
                        <Text style={styles.priorityPillText}>Prioridad {contact.priority}</Text>
                      </View>
                    </View>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    <View style={styles.contactSosActiveRow}>
                      <Icon name="task_alt" size={14} color={brand.prevention} />
                      <Text style={styles.contactSosActiveText}>SOS Automático Activo</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callCircleBtn}
                    onPress={() => handleCall(contact.phone)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${contact.name}`}
                  >
                    <Icon name="call" size={20} color={colors.onTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Apariencia: sistema / claro / oscuro */}
          <View style={styles.themeCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="contrast" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.settingsSectionTitle}>Apariencia</Text>
            </View>
            <View style={styles.themeRow} accessibilityRole="radiogroup">
              {THEME_OPTIONS.map((o) => {
                const selected = preference === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.themeOption, selected && styles.themeOptionSelected]}
                    onPress={() => setPreference(o.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Tema ${o.label}`}
                  >
                    <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sección de Ajustes y Funciones Críticas */}
          <View style={styles.settingsSection}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="tune" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.settingsSectionTitle}>Configuración Crítica</Text>
            </View>

            <View style={styles.menuGroupCard}>
              {/* Item: Alertas y Umbral Sísmico */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Umbrales de alerta sísmica"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.secondaryContainer }]}>
                    <Icon name="crisis_alert" size={22} color={brand.during} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Detección de sacudidas</Text>
                    <Text style={styles.menuItemSub}>Acelerómetro local · umbral de 0,03 g</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Ficha Médica de Emergencia */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Medical')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ficha médica de emergencia"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="badge" size={22} color={colors.panic} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Ficha Médica de Emergencia</Text>
                    <Text style={styles.menuItemSub}>Datos para rescatistas en pantalla bloqueada</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Red Mesh & Modo Offline */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Sync')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Red mesh y modo offline"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="wifi_tethering" size={22} color={brand.prevention} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <View style={styles.menuTitleRow}>
                      <Text style={styles.menuItemTitle}>Red Mesh & Modo Offline</Text>
                      <View style={styles.activePillSmall}>
                        <Text style={styles.activePillSmallText}>Activo</Text>
                      </View>
                    </View>
                    <Text style={styles.menuItemSub}>Puente Bluetooth P2P sin cobertura móvil</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Modo Socorrista (GATT BLE) */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Rescuer')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Modo socorrista institucional"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="health_and_safety" size={22} color={brand.after} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Modo Socorrista Institucional</Text>
                    <Text style={styles.menuItemSub}>Recepción de fichas médicas en proximidad (RF-13)</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Permisos del Sistema */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Permissions')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Permisos del sistema"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="security" size={22} color={brand.espresso} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Permisos y Sensores Críticos</Text>
                    <Text style={styles.menuItemSub}>GPS, Bluetooth, Acelerómetro y Notificaciones</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Mochila 72h y Plan Familiar */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Kit')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Mochila 72h y plan familiar"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="backpack" size={22} color={brand.during} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Mochila 72h y Plan Familiar</Text>
                    <Text style={styles.menuItemSub}>Listas de verificación de prevención del hogar</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Insignias y Logros */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Achievements')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ver todas las insignias"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="military_tech" size={22} color={brand.during} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <View style={styles.menuTitleRow}>
                      <Text style={styles.menuItemTitle}>Ver todas las insignias</Text>
                      <Text style={styles.badgeCountBadge}>{badges.length} Ganadas</Text>
                    </View>
                    <Text style={styles.menuItemSub}>Trivias y simulacros comunitarios completados</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Panel DevScenarios */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Dev')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Panel de escenarios de desarrollo"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="terminal" size={22} color={colors.onSurfaceVariant} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Panel DevScenarios (Simulación)</Text>
                    <Text style={styles.menuItemSub}>Pruebas de sismos, sensores y estados en memoria</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Términos y Privacidad de Seguridad */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleTermsPrivacy}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Términos y privacidad de seguridad"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="policy" size={22} color={colors.onSurfaceVariant} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Términos y Privacidad de Seguridad</Text>
                    <Text style={styles.menuItemSub}>Cifrado local • Ley Estatutaria 1581 de 2012</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item: Acerca de la App */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAboutApp}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Acerca de Earthquake Tracker"
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconDisc, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="info" size={22} color={colors.onSurfaceVariant} />
                  </View>
                  <View style={styles.menuItemTextCol}>
                    <Text style={styles.menuItemTitle}>Acerca de Earthquake Tracker</Text>
                    <Text style={styles.menuItemSub}>v0.1.0 (desarrollo)</Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color={colors.outline} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de Cierre de Sesión / Salida Segura y Habeas Data */}
          <View style={styles.dangerZoneSection}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetData}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Restablecer y borrar datos locales"
            >
              <Icon name="delete_forever" size={20} color={colors.panic} />
              <Text style={styles.resetButtonText}>Restablecer y borrar datos locales</Text>
            </TouchableOpacity>

            <Text style={styles.deviceSyncFooter}>
              Almacén local cifrado con AES-256 • Habeas Data ISO A.8.10 • Colombia
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.space3xl + spacing.bottomNavHeight,
    gap: spacing.lg,
  },
  headerIconButton: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero médico
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    elevation: 2,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.scale.headlineMd,
    color: colors.onSecondaryContainer,
    fontWeight: '800',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  heroUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  userName: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  userEmail: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  userIdTag: {
    ...typography.scale.labelCaps,
    color: brand.during,
    marginTop: 4,
  },
  settingsBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  medicalStrip: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  medicalStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicalStripTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  medicalStripTitle: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  lockBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onSecondaryContainer,
    fontSize: 10,
  },
  medicalGrid: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    gap: spacing.sm,
  },
  medicalGridCol: {
    flex: 1,
  },
  medicalLabel: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  bloodTypeValue: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '800',
    marginTop: 2,
  },
  allergiesValue: {
    ...typography.scale.bodySm,
    color: colors.panic,
    fontWeight: '600',
    marginTop: 2,
  },
  editProfileBtn: {
    marginTop: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  editProfileBtnText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  // Mesh Card
  meshCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: brand.fill,
    padding: spacing.md,
  },
  meshCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meshCardEyebrow: {
    ...typography.scale.labelCaps,
    color: colors.secondaryContainer,
    letterSpacing: 1,
  },
  meshCardTitle: {
    ...typography.scale.headlineSm,
    color: colors.onPrimary,
    marginTop: 2,
  },
  meshCardDesc: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 16,
  },
  meshIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Contactos
  contactsSection: {
    gap: spacing.sm,
  },
  contactsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  contactsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactsSectionTitle: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  contactsCountBadge: {
    backgroundColor: brand.fill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  contactsCountText: {
    ...typography.scale.labelCaps,
    color: colors.onPrimary,
    fontSize: 10,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.default,
  },
  addContactBtnText: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
  disclaimerBanner: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  disclaimerText: {
    ...typography.scale.bodySm,
    color: colors.onSecondaryContainer,
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  contactsList: {
    gap: spacing.xs,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
    elevation: 1,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
    minWidth: 0,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactName: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  priorityPill: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  priorityPillText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    fontSize: 9,
  },
  contactPhone: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  contactSosActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  contactSosActiveText: {
    ...typography.scale.labelCaps,
    color: brand.prevention,
    fontWeight: '700',
    fontSize: 10,
  },
  callCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Configuración Crítica
  settingsSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
    marginBottom: spacing.xxs,
  },
  settingsSectionTitle: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  themeCard: { marginTop: spacing.spaceMd, gap: spacing.spaceSm },
  themeRow: { flexDirection: 'row', gap: spacing.spaceSm },
  themeOption: {
    flex: 1,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: colors.surface,
  },
  themeOptionSelected: { backgroundColor: brand.fill, borderColor: brand.fill },
  themeOptionText: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  themeOptionTextSelected: { color: brand.onFill },
  menuGroupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  menuIconDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  menuItemTitle: {
    ...typography.scale.labelLg,
    color: colors.onSurface,
    flexShrink: 1,
  },
  menuItemSub: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  activePillSmall: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  activePillSmallText: {
    ...typography.scale.labelCaps,
    color: colors.onTertiaryContainer,
    fontWeight: '800',
    fontSize: 9,
  },
  badgeCountBadge: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '700',
    fontSize: 10,
    flexShrink: 0,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginLeft: 70,
  },
  // Zona de Salida
  dangerZoneSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  resetButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.panicContainer,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resetButtonText: {
    ...typography.scale.labelLg,
    color: colors.panic,
  },
  deviceSyncFooter: {
    ...typography.scale.bodySm,
    color: colors.outline,
    textAlign: 'center',
    fontSize: 11,
  },
});
