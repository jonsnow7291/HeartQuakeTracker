import {
  generateEphemeralId,
  generateIdentityKeyPair,
  signBytes,
  verifySignature,
} from '../../../src/core/mesh/crypto';

describe('Mesh Criptografía e ID Efímero (ADR 0005)', () => {
  const secret = new Uint8Array(32).fill(0x42);

  it('genera un ID efímero de exactamente 12 caracteres hex (6 bytes)', () => {
    const id = generateEphemeralId(secret, 1776000000);
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });

  it('mantiene el mismo ID efímero dentro de la misma ventana de 15 minutos', () => {
    const windowStart = Math.floor(1776000000 / 900) * 900;
    const id1 = generateEphemeralId(secret, windowStart);
    const id2 = generateEphemeralId(secret, windowStart + 60); // +1 min
    const id3 = generateEphemeralId(secret, windowStart + 899); // +14m59s
    expect(id1).toBe(id2);
    expect(id1).toBe(id3);
  });

  it('rota el ID efímero al pasar a la siguiente ventana de 15 minutos', () => {
    const windowStart = Math.floor(1776000000 / 900) * 900;
    const id1 = generateEphemeralId(secret, windowStart);
    const id2 = generateEphemeralId(secret, windowStart + 901); // +15m01s
    expect(id1).not.toBe(id2);
  });

  it('firma y verifica con Ed25519', () => {
    const pair = generateIdentityKeyPair();
    const data = new TextEncoder().encode('Test EarthQuakeTracker payload');
    const signature = signBytes(pair.privateKey, data);

    expect(signature.length).toBe(64);
    const isValid = verifySignature(pair.publicKey, data, signature);
    expect(isValid).toBe(true);

    // Firma inválida ante datos alterados
    const corruptedData = new TextEncoder().encode('Tampered payload');
    expect(verifySignature(pair.publicKey, corruptedData, signature)).toBe(false);
  });
});
