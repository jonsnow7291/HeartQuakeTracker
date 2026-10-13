import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { useSubscribe } from '../hooks/useSubscribe';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { MedicalProfile, EmergencyContact } from '../../contracts/medical';

const BLOOD_TYPES: Array<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'> = [
  'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
];

export function MedicalScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, medical } = useServices();

  const isUnlocked = useSubscribe(
    session ? (cb) => session.subscribe(cb) : undefined,
    session?.isUnlocked() ?? false
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [bloodType, setBloodType] = useState<MedicalProfile['bloodType']>('O+');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '', relation: '' },
  ]);

  const loadProfile = async () => {
    if (!isUnlocked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (medical) {
        const p = await medical.get();
        setProfile(p);
        if (p) {
          setBloodType(p.bloodType || 'O+');
          setAllergies(p.allergies || []);
          setConditions(p.conditions || []);
          setMedications(p.medications || []);
          setNotes(p.notes || '');
          setContacts(
            p.contacts && p.contacts.length > 0
              ? p.contacts
              : [{ name: '', phone: '', relation: '' }]
          );
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      }
    } catch (err: unknown) {
      console.warn('[MedicalScreen] Error al cargar ficha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [isUnlocked, medical]);

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim()) {
      setConditions([...conditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setMedications([...medications, medicationInput.trim()]);
      setMedicationInput('');
    }
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value };
      setContacts(updated);
    }
  };

  const handleAddContact = () => {
    if (contacts.length < 3) {
      setContacts([...contacts, { name: '', phone: '', relation: '' }]);
    }
  };

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setValidationError(null);

    if (!bloodType) {
      setValidationError('Por favor selecciona tu grupo sanguíneo.');
      return;
    }

    const validContacts = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      setValidationError('Debes ingresar al menos un contacto de emergencia con nombre y teléfono.');
      return;
    }

    setSaving(true);
    try {
      if (medical) {
        await medical.save({
          bloodType,
          allergies,
          conditions,
          medications,
          contacts: validContacts,
          notes: notes.trim() ? notes.trim() : undefined,
        });

        await loadProfile();
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err: unknown) {
      console.warn('[MedicalScreen] Error al guardar ficha médica:', err);
      setValidationError('Error de almacenamiento seguro al guardar la ficha.');
    } finally {
      setSaving(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
      console.warn('No se pudo abrir marcador telefónico:', err)
    );
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenHeader
        title="Ficha Médica Protegida"
        eyebrow="CREDENCIAL DE RESCATE"
        tone="espresso"
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {!isUnlocked ? (
          <View style={styles.lockedContainer}>
            <ErrorState
              code="AUTH_REQUIRED"
              customMessage="Tu ficha médica se encuentra cifrada localmente con AES-256. Desbloquea tu sesión con tu PIN de 6 dígitos o huella para ver o editar."
              onRetry={() => navigation.navigate('Unlock')}
            />
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brand.espresso} />
            <Text style={styles.loadingText}>Descifrando ficha médica con AES-256...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {saveSuccess ? (
              <Banner
                kind="success"
                title="Ficha Guardada"
                message="Tu información médica ha sido cifrada y almacenada localmente con éxito."
              />
            ) : null}

            {validationError ? (
              <Banner kind="critical" title="Validación Requerida" message={validationError} />
            ) : null}

            {/* Banner de protección legal y confidencialidad */}
            <View style={styles.privacyPill}>
              <Icon name="lock" size={18} color={brand.espresso} />
              <Text style={styles.privacyText}>
                Cifrado AES-256 local • Solo transmitido a socorristas acreditados en emergencia (RF-13)
              </Text>
            </View>

            {/* MODO LECTURA / CREDENCIAL MÉDICA */}
            {!isEditing && profile ? (
              <View style={styles.credentialContainer}>
                <View style={styles.credentialCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.credLabel}>CREDENCIAL MÉDICA DE RESCATE</Text>
                      <Text style={styles.credTitle}>Perfil Vital</Text>
                    </View>
                    <View style={styles.bloodTypeBadge}>
                      <Icon name="bloodtype" size={18} color={colors.onPrimary} />
                      <Text style={styles.bloodTypeBadgeText}>{profile.bloodType || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Alergias */}
                  <View style={styles.credSection}>
                    <View style={styles.credSectionTitleRow}>
                      <Icon name="warning" size={16} color={colors.panic} />
                      <Text style={styles.credSectionTitle}>Alergias Conocidas</Text>
                    </View>
                    {profile.allergies && profile.allergies.length > 0 ? (
                      <View style={styles.chipsRow}>
                        {profile.allergies.map((al, idx) => (
                          <View key={idx} style={styles.allergyChip}>
                            <Text style={styles.allergyChipText}>{al}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.credEmptyText}>Ninguna registrada</Text>
                    )}
                  </View>

                  {/* Condiciones preexistentes */}
                  <View style={styles.credSection}>
                    <View style={styles.credSectionTitleRow}>
                      <Icon name="medical_services" size={16} color={brand.after} />
                      <Text style={styles.credSectionTitle}>Condiciones Preexistentes</Text>
                    </View>
                    {profile.conditions && profile.conditions.length > 0 ? (
                      <View style={styles.chipsRow}>
                        {profile.conditions.map((co, idx) => (
                          <View key={idx} style={styles.conditionChip}>
                            <Text style={styles.conditionChipText}>{co}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.credEmptyText}>Ninguna reportada</Text>
                    )}
                  </View>

                  {/* Medicamentos */}
                  <View style={styles.credSection}>
                    <View style={styles.credSectionTitleRow}>
                      <Icon name="medication" size={16} color={brand.during} />
                      <Text style={styles.credSectionTitle}>Medicamentos Actuales</Text>
                    </View>
                    {profile.medications && profile.medications.length > 0 ? (
                      <View style={styles.chipsRow}>
                        {profile.medications.map((m, idx) => (
                          <View key={idx} style={styles.medChip}>
                            <Text style={styles.medChipText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.credEmptyText}>No toma medicamentos continuos</Text>
                    )}
                  </View>

                  {/* Notas */}
                  {profile.notes ? (
                    <View style={styles.credSection}>
                      <View style={styles.credSectionTitleRow}>
                        <Icon name="note" size={16} color={brand.espresso} />
                        <Text style={styles.credSectionTitle}>Notas para Socorristas</Text>
                      </View>
                      <Text style={styles.credNotesText}>{profile.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Contactos de Emergencia */}
                <View style={styles.contactsHeaderRow}>
                  <Icon name="contact_emergency" size={20} color={brand.during} />
                  <Text style={styles.contactsSectionTitle}>Contactos de Emergencia (SOS)</Text>
                </View>

                {profile.contacts && profile.contacts.length > 0 ? (
                  profile.contacts.map((c, idx) => (
                    <View key={idx} style={styles.contactCard}>
                      <View style={styles.contactAvatar}>
                        <Icon name="call" size={20} color={brand.espresso} />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{c.name}</Text>
                        <Text style={styles.contactRelation}>{c.relation || 'Contacto'}</Text>
                        <Text style={styles.contactPhone}>{c.phone}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.callCircleBtn}
                        onPress={() => handleCall(c.phone)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Llamar a ${c.name} al ${c.phone}`}
                      >
                        <Icon name="call" size={18} color={colors.onTertiary} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : null}

                <Button
                  title="Editar Ficha Médica"
                  variant="secondary"
                  onPress={() => setIsEditing(true)}
                  style={styles.editBtn}
                />
              </View>
            ) : (
              /* MODO EDICIÓN / FORMULARIO */
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={styles.formHeaderTitle}>
                    {profile ? 'Actualizar Ficha Médica' : 'Registrar Ficha Médica de Emergencia'}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    Esta información será transmitida de manera confidencial vía BLE GATT a personal médico y socorristas si activas el botón de pánico.
                  </Text>
                </View>

                {/* Selector de Grupo Sanguíneo */}
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Grupo Sanguíneo y Factor Rh *</Text>
                  <View style={styles.bloodTypeGrid}>
                    {BLOOD_TYPES.map((type) => {
                      const isSelected = bloodType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.bloodTypeOption,
                            isSelected && styles.bloodTypeOptionSelected,
                          ]}
                          onPress={() => setBloodType(type)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Grupo sanguíneo ${type}`}
                        >
                          <Text
                            style={[
                              styles.bloodTypeText,
                              isSelected && styles.bloodTypeTextSelected,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Alergias */}
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Alergias Conocidas</Text>
                  <View style={styles.inputWithAddRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={allergyInput}
                      onChangeText={setAllergyInput}
                      placeholder="Ej. Penicilina, AINEs, Polen"
                      placeholderTextColor={colors.outline}
                    />
                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={handleAddAllergy}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Añadir alergia"
                    >
                      <Icon name="add" size={18} color={colors.onPrimary} />
                      <Text style={styles.smallAddBtnText}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                  {allergies.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {allergies.map((al, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.tagRemovable}
                          onPress={() => handleRemoveAllergy(idx)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar alergia ${al}`}
                        >
                          <Text style={styles.tagText}>{al}</Text>
                          <Icon name="close" size={14} color={colors.panic} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Condiciones preexistentes */}
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Condiciones Médicas Preexistentes</Text>
                  <View style={styles.inputWithAddRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={conditionInput}
                      onChangeText={setConditionInput}
                      placeholder="Ej. Diabetes, Asma, Hipertensión"
                      placeholderTextColor={colors.outline}
                    />
                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={handleAddCondition}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Añadir condición médica"
                    >
                      <Icon name="add" size={18} color={colors.onPrimary} />
                      <Text style={styles.smallAddBtnText}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                  {conditions.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {conditions.map((co, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.tagRemovable}
                          onPress={() => handleRemoveCondition(idx)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar condición ${co}`}
                        >
                          <Text style={styles.tagText}>{co}</Text>
                          <Icon name="close" size={14} color={colors.panic} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Medicamentos */}
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Medicamentos Actuales</Text>
                  <View style={styles.inputWithAddRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={medicationInput}
                      onChangeText={setMedicationInput}
                      placeholder="Ej. Insulina, Losartán 50mg"
                      placeholderTextColor={colors.outline}
                    />
                    <TouchableOpacity
                      style={styles.smallAddBtn}
                      onPress={handleAddMedication}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Añadir medicamento"
                    >
                      <Icon name="add" size={18} color={colors.onPrimary} />
                      <Text style={styles.smallAddBtnText}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                  {medications.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {medications.map((m, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.tagRemovable}
                          onPress={() => handleRemoveMedication(idx)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar medicamento ${m}`}
                        >
                          <Text style={styles.tagText}>{m}</Text>
                          <Icon name="close" size={14} color={colors.panic} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Contactos de Emergencia */}
                <View style={styles.formCard}>
                  <View style={styles.contactLabelRow}>
                    <Text style={styles.fieldLabel}>Contactos de Emergencia (Máx. 3) *</Text>
                    {contacts.length < 3 ? (
                      <TouchableOpacity
                        style={styles.addContactLinkRow}
                        onPress={handleAddContact}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Añadir otro contacto de emergencia"
                      >
                        <Icon name="person_add" size={16} color={brand.during} />
                        <Text style={styles.addContactLink}>+ Añadir otro</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {contacts.map((c, idx) => (
                    <View key={idx} style={styles.contactEditCard}>
                      <View style={styles.contactEditHeader}>
                        <Text style={styles.contactIndexText}>Contacto #{idx + 1}</Text>
                        {contacts.length > 1 ? (
                          <TouchableOpacity
                            onPress={() => handleRemoveContact(idx)}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar contacto ${idx + 1}`}
                          >
                            <Text style={styles.removeContactText}>Eliminar</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <TextInput
                        style={[styles.input, styles.compactInput]}
                        value={c.name}
                        onChangeText={(val) => handleContactChange(idx, 'name', val)}
                        placeholder="Nombre completo *"
                        placeholderTextColor={colors.outline}
                      />
                      <TextInput
                        style={[styles.input, styles.compactInput]}
                        value={c.phone}
                        onChangeText={(val) => handleContactChange(idx, 'phone', val)}
                        placeholder="Teléfono móvil (+57 ...) *"
                        placeholderTextColor={colors.outline}
                        keyboardType="phone-pad"
                      />
                      <TextInput
                        style={[styles.input, styles.compactInput]}
                        value={c.relation}
                        onChangeText={(val) => handleContactChange(idx, 'relation', val)}
                        placeholder="Parentesco (Ej. Madre, Esposo, Hermano)"
                        placeholderTextColor={colors.outline}
                      />
                    </View>
                  ))}
                </View>

                {/* Notas para Rescatistas */}
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Notas Adicionales de Rescate</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ej. Uso lentes de contacto, prótesis en pierna derecha, marcapasos."
                    placeholderTextColor={colors.outline}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Botones de acción del formulario */}
                <View style={styles.formButtonsRow}>
                  {profile ? (
                    <Button
                      title="Cancelar"
                      variant="outline"
                      onPress={() => setIsEditing(false)}
                      style={styles.cancelBtn}
                      disabled={saving}
                    />
                  ) : null}
                  <Button
                    title="Guardar Ficha Cifrada"
                    variant="primary"
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveBtn}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        )}
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
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.scale.bodyMd,
    color: colors.outline,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.space3xl,
    gap: spacing.md,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  privacyText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  credentialContainer: {
    gap: spacing.md,
  },
  credentialCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  credLabel: {
    ...typography.scale.labelCaps,
    color: brand.during,
    letterSpacing: 0.8,
  },
  credTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
    marginTop: 2,
  },
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.fill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  bloodTypeBadgeText: {
    ...typography.scale.headlineSm,
    color: colors.onPrimary,
    fontWeight: '800',
  },
  credSection: {
    marginTop: spacing.sm,
  },
  credSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
    marginBottom: spacing.xxs,
  },
  credSectionTitle: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  allergyChip: {
    backgroundColor: colors.panicContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  allergyChipText: {
    ...typography.scale.bodySm,
    color: colors.panic,
    fontWeight: '600',
  },
  conditionChip: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  conditionChipText: {
    ...typography.scale.bodySm,
    color: brand.after,
    fontWeight: '600',
  },
  medChip: {
    backgroundColor: colors.secondaryContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  medChipText: {
    ...typography.scale.bodySm,
    color: brand.during,
    fontWeight: '600',
  },
  credEmptyText: {
    ...typography.scale.bodySm,
    color: colors.outline,
    fontStyle: 'italic',
  },
  credNotesText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  contactsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  contactsSectionTitle: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.scale.headlineSm,
    color: colors.onSurface,
  },
  contactRelation: {
    ...typography.scale.labelCaps,
    color: brand.during,
    marginTop: 2,
  },
  contactPhone: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  callCircleBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    borderRadius: 22,
    backgroundColor: brand.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    marginTop: spacing.xs,
  },
  // Formulario
  formContainer: {
    gap: spacing.md,
  },
  formHeader: {
    marginBottom: spacing.xxs,
  },
  formHeaderTitle: {
    ...typography.scale.headlineMd,
    color: brand.espresso,
  },
  formSubtitle: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  bloodTypeOption: {
    width: '22%',
    minHeight: touchTargets.min,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.border,
  },
  bloodTypeOptionSelected: {
    backgroundColor: brand.fill,
    borderColor: brand.espresso,
  },
  bloodTypeText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  bloodTypeTextSelected: {
    color: colors.onPrimary,
  },
  inputWithAddRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.scale.bodyMd,
    color: colors.onSurface,
  },
  smallAddBtn: {
    backgroundColor: brand.fill,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallAddBtnText: {
    ...typography.scale.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  tagRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.panicContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.scale.bodySm,
    color: colors.panic,
    fontWeight: '600',
  },
  contactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addContactLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addContactLink: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
  contactEditCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  contactEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactIndexText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
  },
  removeContactText: {
    ...typography.scale.labelMd,
    color: colors.panic,
    fontWeight: '700',
  },
  compactInput: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
