import { NobleCryptoPort } from '../../src/platform/core/NobleCryptoPort';

describe('KDF del PIN: Argon2id nativo con respaldo en JavaScript (A-14)', () => {
  const sal = new Uint8Array(16).fill(7);
  const barato = { t: 1, m: 64, p: 1 };

  it('sin implementación nativa usa Argon2id en JavaScript', async () => {
    const k = await new NobleCryptoPort({ argon2Cost: barato }).deriveKey('135790', sal);
    expect(k.length).toBe(32);
  });

  it('usa la ruta nativa cuando está disponible y no toca la de JavaScript', async () => {
    const esperado = new Uint8Array(32).fill(9);
    const nativa = jest.fn(async () => esperado);
    const k = await new NobleCryptoPort({ argon2Cost: barato, nativeArgon2: nativa }).deriveKey('135790', sal);
    expect(k).toEqual(esperado);
    expect(nativa).toHaveBeenCalledWith('135790', sal, barato);
  });

  it('si la ruta nativa falla, cae a JavaScript y da la clave correcta', async () => {
    const js = await new NobleCryptoPort({ argon2Cost: barato }).deriveKey('135790', sal);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const k = await new NobleCryptoPort({ argon2Cost: barato, nativeArgon2: async () => { throw new Error('sin módulo'); } }).deriveKey('135790', sal);
    expect(k).toEqual(js);
  });

  it('PIN distinto o sal distinta dan claves distintas', async () => {
    const c = new NobleCryptoPort({ argon2Cost: barato });
    const a = await c.deriveKey('135790', sal);
    expect(await c.deriveKey('135791', sal)).not.toEqual(a);
    expect(await c.deriveKey('135790', new Uint8Array(16).fill(8))).not.toEqual(a);
  });
});
