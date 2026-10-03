import { FREE_ATTEMPTS, SessionServiceImpl } from '../../src/core/session/SessionServiceImpl';
import { FakeBiometric, FakeClock, MemoryKeyValueStore, nodeCrypto } from './support/nodePorts';

const make = (over: Partial<ConstructorParameters<typeof SessionServiceImpl>[0]> = {}) => {
  const store = new MemoryKeyValueStore();
  const clock = new FakeClock();
  const bio = new FakeBiometric();
  const s = new SessionServiceImpl({ secureStore: store, crypto: nodeCrypto, clock, biometric: bio, ...over });
  return { s, store, clock, bio };
};
const NEW = { displayName: 'Juan', email: 'j@x.co', pin: '123456', acceptTerms: true as const };

describe('SessionService real – cuenta y PIN (ADR 0001)', () => {
  it('crea la cuenta, queda desbloqueada y notifica', async () => {
    const { s } = make();
    const events: boolean[] = [];
    s.subscribe((u) => events.push(u));
    expect(await s.hasAccount()).toBe(false);
    await s.createLocalAccount(NEW);
    expect(await s.hasAccount()).toBe(true);
    expect(s.isUnlocked()).toBe(true);
    expect(events).toEqual([true]);
    expect(await s.getUser()).toMatchObject({ displayName: 'Juan', email: 'j@x.co' });
  });

  it.each([
    [{ ...NEW, pin: '12345' }, 'PIN corto'],
    [{ ...NEW, pin: '12a456' }, 'PIN no numérico'],
    [{ ...NEW, displayName: '  ' }, 'nombre vacío'],
    [{ ...NEW, email: 'no-es-correo' }, 'correo inválido'],
    [{ ...NEW, acceptTerms: false as unknown as true }, 'términos no aceptados'],
  ])('rechaza %#: %s', async (input) => {
    await expect(make().s.createLocalAccount(input)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('no permite una segunda cuenta', async () => {
    const { s } = make();
    await s.createLocalAccount(NEW);
    await expect(s.createLocalAccount(NEW)).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('lock/unlock: PIN correcto desbloquea, incorrecto → AUTH_FAILED', async () => {
    const { s } = make();
    await s.createLocalAccount(NEW);
    s.lock();
    expect(s.isUnlocked()).toBe(false);
    await expect(s.unlock({ pin: '000000' })).rejects.toMatchObject({ code: 'AUTH_FAILED' });
    expect(s.isUnlocked()).toBe(false);
    await s.unlock({ pin: '123456' });
    expect(s.isUnlocked()).toBe(true);
  });

  it('unlock sin cuenta → AUTH_REQUIRED', async () => {
    await expect(make().s.unlock({ pin: '123456' })).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  });

  it('persistencia: otra instancia sobre el mismo almacén reconoce la cuenta y el PIN', async () => {
    const a = make();
    await a.s.createLocalAccount(NEW);
    const b = new SessionServiceImpl({ secureStore: a.store, crypto: nodeCrypto });
    expect(await b.hasAccount()).toBe(true);
    expect(b.isUnlocked()).toBe(false);
    await b.unlock({ pin: '123456' });
    expect(Buffer.from(b.getDataKey()).equals(Buffer.from(a.s.getDataKey()))).toBe(true);
  });
});

describe('SessionService real – clave de datos y secretos', () => {
  it('getDataKey exige sesión desbloqueada y la clave se borra de memoria al bloquear', async () => {
    const { s } = make();
    await s.createLocalAccount(NEW);
    const key = s.getDataKey();
    expect(key.length).toBe(32);
    expect(key.some((b) => b !== 0)).toBe(true);
    s.lock();
    expect(Array.from(key).every((b) => b === 0)).toBe(true); // zeroizada
    expect(() => s.getDataKey()).toThrow(expect.objectContaining({ code: 'AUTH_REQUIRED' }));
  });

  it('el almacén seguro NO contiene el PIN ni la clave de datos', async () => {
    const { s, store } = make();
    await s.createLocalAccount(NEW);
    const key = Buffer.from(s.getDataKey());
    const dump = JSON.stringify([...store.data.entries()]);
    expect(dump).not.toContain('123456');
    expect(dump).not.toContain(key.toString('base64'));
    expect(dump).not.toContain(key.toString('hex'));
  });

  it('dos cuentas con el mismo PIN tienen claves distintas (salt aleatorio)', async () => {
    const a = make();
    const b = make();
    await a.s.createLocalAccount(NEW);
    await b.s.createLocalAccount(NEW);
    expect(Buffer.from(a.s.getDataKey()).equals(Buffer.from(b.s.getDataKey()))).toBe(false);
  });
});

describe('SessionService real – anti fuerza bruta', () => {
  it(`tras ${FREE_ATTEMPTS} fallos bloquea; escala 30 s × 2ⁿ; el PIN correcto también espera`, async () => {
    const { s, clock } = make();
    await s.createLocalAccount(NEW);
    s.lock();
    for (let i = 0; i < FREE_ATTEMPTS; i++) await expect(s.unlock({ pin: '000000' })).rejects.toMatchObject({ code: 'AUTH_FAILED', message: 'PIN incorrecto' });
    // 5.º fallo ya bloqueó 30 s
    await expect(s.unlock({ pin: '123456' })).rejects.toMatchObject({ code: 'AUTH_FAILED', message: expect.stringContaining('Espera') });
    clock.advance(29_000);
    await expect(s.unlock({ pin: '123456' })).rejects.toThrow(/Espera/);
    clock.advance(2_000);
    await expect(s.unlock({ pin: '000000' })).rejects.toThrow('PIN incorrecto'); // 6.º: ahora 60 s
    clock.advance(59_000);
    await expect(s.unlock({ pin: '123456' })).rejects.toThrow(/Espera/);
    clock.advance(2_000);
    await s.unlock({ pin: '123456' });
    expect(s.isUnlocked()).toBe(true);
  });

  it('un acierto reinicia el contador', async () => {
    const { s, clock } = make();
    await s.createLocalAccount(NEW);
    s.lock();
    for (let i = 0; i < FREE_ATTEMPTS - 1; i++) await expect(s.unlock({ pin: '000000' })).rejects.toThrow('PIN incorrecto');
    await s.unlock({ pin: '123456' });
    s.lock();
    for (let i = 0; i < FREE_ATTEMPTS - 1; i++) await expect(s.unlock({ pin: '000000' })).rejects.toThrow('PIN incorrecto'); // no se bloquea: contador reiniciado
    clock.advance(0);
    await s.unlock({ pin: '123456' });
  });

  it('el bloqueo sobrevive a reiniciar la app (persistido)', async () => {
    const a = make();
    await a.s.createLocalAccount(NEW);
    a.s.lock();
    for (let i = 0; i < FREE_ATTEMPTS; i++) await a.s.unlock({ pin: '000000' }).catch(() => undefined);
    const b = new SessionServiceImpl({ secureStore: a.store, crypto: nodeCrypto, clock: a.clock });
    await expect(b.unlock({ pin: '123456' })).rejects.toThrow(/Espera/);
  });
});

describe('SessionService real – biometría y autobloqueo', () => {
  it('habilitar, desbloquear y deshabilitar', async () => {
    const { s, bio } = make();
    await s.createLocalAccount(NEW);
    await s.enableBiometric();
    expect(await s.isBiometricEnabled()).toBe(true);
    s.lock();
    await s.unlock({ biometric: true });
    expect(s.isUnlocked()).toBe(true);
    s.lock();
    bio.accept = false;
    await expect(s.unlock({ biometric: true })).rejects.toMatchObject({ code: 'AUTH_FAILED' });
    await s.unlock({ pin: '123456' });
    await s.disableBiometric();
    s.lock();
    bio.accept = true;
    await expect(s.unlock({ biometric: true })).rejects.toMatchObject({ code: 'AUTH_FAILED' });
  });

  it('sin biometría disponible no se puede habilitar', async () => {
    const { s, bio } = make();
    await s.createLocalAccount(NEW);
    bio.available = false;
    await expect(s.enableBiometric()).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('autobloqueo por inactividad y touch() lo reinicia', async () => {
    jest.useFakeTimers();
    try {
      const { s } = make({ autoLockMs: 1000 });
      await s.createLocalAccount(NEW);
      jest.advanceTimersByTime(800);
      s.touch();
      jest.advanceTimersByTime(800);
      expect(s.isUnlocked()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(s.isUnlocked()).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('deleteAccount borra cuenta, intentos y clave biométrica', async () => {
    const { s, store } = make();
    await s.createLocalAccount(NEW);
    await s.enableBiometric();
    await s.deleteAccount();
    expect(await s.hasAccount()).toBe(false);
    expect([...store.data.keys()]).toEqual([]);
    expect(s.isUnlocked()).toBe(false);
  });
});
