import { MedicalProfileServiceImpl } from '../../src/core/medical/MedicalProfileServiceImpl';
import { SessionServiceImpl } from '../../src/core/session/SessionServiceImpl';
import { FakeClock, MemoryKeyValueStore, nodeCrypto } from './support/nodePorts';

describe('MedicalProfileServiceImpl (RF-04, RNF-04)', () => {
  const setup = () => {
    const secureStore = new MemoryKeyValueStore();
    const dataStore = new MemoryKeyValueStore();
    const clock = new FakeClock(1_700_000_000_000);
    const session = new SessionServiceImpl({ secureStore, crypto: nodeCrypto, clock });
    const medical = new MedicalProfileServiceImpl({
      store: dataStore,
      session,
      crypto: nodeCrypto,
      clock,
    });
    return { secureStore, dataStore, clock, session, medical };
  };

  const sampleProfile = {
    bloodType: 'O+' as const,
    allergies: ['Penicilina', 'Polen'],
    conditions: ['Hipertensión arterial'],
    medications: ['Enalapril 20mg'],
    contacts: [
      { name: 'María Gómez', phone: '+57 310 1234567', relation: 'Hermana' },
      { name: 'Carlos Gómez', phone: '+57 320 7654321', relation: 'Padre' },
    ],
    notes: 'Alergia severa a penicilina, requiere brazalete médico',
  };

  it('no permite leer ni guardar si la sesión está bloqueada o sin cuenta', async () => {
    const { medical } = setup();

    expect(await medical.exists()).toBe(false);
    await expect(medical.get()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    await expect(medical.save(sampleProfile)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  });

  it('valida campos obligatorios en save() y lanza VALIDATION', async () => {
    const { session, medical } = setup();
    await session.createLocalAccount({ displayName: 'Laura', pin: '123456', acceptTerms: true });

    // Sin tipo de sangre
    await expect(
      medical.save({ ...sampleProfile, bloodType: undefined as any }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    // Tipo de sangre inválido
    await expect(
      medical.save({ ...sampleProfile, bloodType: 'Z+' as any }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    // Sin contactos
    await expect(
      medical.save({ ...sampleProfile, contacts: [] }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });

    // Contacto con teléfono vacío
    await expect(
      medical.save({
        ...sampleProfile,
        contacts: [{ name: 'Juan', phone: '   ' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('guarda cifrada la ficha médica con AES-256 en reposo (RNF-04) y la recupera intacta', async () => {
    const { session, medical, dataStore, clock } = setup();
    await session.createLocalAccount({ displayName: 'Laura', pin: '123456', acceptTerms: true });

    await medical.save(sampleProfile);
    expect(await medical.exists()).toBe(true);

    // Verificamos que en el store NO está en texto plano
    const rawStored = await dataStore.get('medical.profile.v1');
    expect(rawStored).toBeTruthy();
    expect(rawStored).not.toContain('Penicilina');
    expect(rawStored).not.toContain('María Gómez');
    expect(rawStored).not.toContain('Hipertensión');

    // Al recuperar con la sesión desbloqueada, devuelve el perfil completo descifrado
    const profile = await medical.get();
    expect(profile).not.toBeNull();
    expect(profile!.bloodType).toBe('O+');
    expect(profile!.allergies).toEqual(['Penicilina', 'Polen']);
    expect(profile!.contacts).toHaveLength(2);
    expect(profile!.updatedAt).toBe(new Date(clock.now()).toISOString());

    // Al bloquear la sesión, no permite acceder a la ficha
    session.lock();
    await expect(medical.get()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });

    // Al desbloquear con el PIN correcto, vuelve a permitir el acceso
    await session.unlock({ pin: '123456' });
    const profileAfterUnlock = await medical.get();
    expect(profileAfterUnlock!.bloodType).toBe('O+');
  });

  it('permite actualizar y eliminar la ficha médica', async () => {
    const { session, medical, clock } = setup();
    await session.createLocalAccount({ displayName: 'Laura', pin: '123456', acceptTerms: true });

    await medical.save(sampleProfile);

    clock.advance(60_000);
    await medical.save({
      ...sampleProfile,
      bloodType: 'A+',
      notes: 'Notas actualizadas',
    });

    const updated = await medical.get();
    expect(updated!.bloodType).toBe('A+');
    expect(updated!.notes).toBe('Notas actualizadas');
    expect(updated!.updatedAt).toBe(new Date(clock.now()).toISOString());

    // Eliminar
    await medical.remove();
    expect(await medical.exists()).toBe(false);
    expect(await medical.get()).toBeNull();
  });

  it('falla con AUTH_FAILED si los datos cifrados han sido manipulados o corruptos', async () => {
    const { session, medical, dataStore } = setup();
    await session.createLocalAccount({ displayName: 'Laura', pin: '123456', acceptTerms: true });

    await medical.save(sampleProfile);

    // Corrompemos el contenido cifrado
    const rawStored = await dataStore.get('medical.profile.v1');
    const corrupted = 'AAAA' + rawStored!.substring(4);
    await dataStore.set('medical.profile.v1', corrupted);

    await expect(medical.get()).rejects.toMatchObject({ code: 'AUTH_FAILED' });
  });

  it('requiredFields devuelve los campos obligatorios del contrato', () => {
    const { medical } = setup();
    const req = medical.requiredFields();
    expect(req).toContain('bloodType');
    expect(req).toContain('allergies');
    expect(req).toContain('conditions');
    expect(req).toContain('contacts');
  });
});
