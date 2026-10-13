import { generateIdentityKeyPair, signBytes, verifySignature } from '../../src/core/mesh/crypto';
import { utf8 } from '../../src/core/util/bytes';

/** Regresión: en el teléfono la firma era un sucedáneo que aceptaba cualquier firma de 64 bytes. */
describe('Ed25519 de identidad de dispositivo', () => {
  const msg = utf8('register|clave|1791827762097');

  it('firma y verifica un mensaje', () => {
    const { publicKey, privateKey } = generateIdentityKeyPair();
    expect(verifySignature(publicKey, msg, signBytes(privateKey, msg))).toBe(true);
  });

  it('rechaza un mensaje alterado', () => {
    const { publicKey, privateKey } = generateIdentityKeyPair();
    const sig = signBytes(privateKey, msg);
    expect(verifySignature(publicKey, utf8('register|otra|1'), sig)).toBe(false);
  });

  it('rechaza una firma falsa de 64 bytes', () => {
    const { publicKey } = generateIdentityKeyPair();
    expect(verifySignature(publicKey, msg, new Uint8Array(64).fill(7))).toBe(false);
  });

  it('rechaza una firma de otra identidad', () => {
    const a = generateIdentityKeyPair();
    const b = generateIdentityKeyPair();
    expect(verifySignature(b.publicKey, msg, signBytes(a.privateKey, msg))).toBe(false);
  });

  it('la clave pública no se deduce de la privada con un XOR fijo', () => {
    const { publicKey, privateKey } = generateIdentityKeyPair();
    const xored = privateKey.map((b) => b ^ 0xaa);
    expect(Buffer.from(xored).equals(Buffer.from(publicKey))).toBe(false);
  });

  it('genera claves distintas en cada llamada', () => {
    expect(Buffer.from(generateIdentityKeyPair().privateKey).equals(Buffer.from(generateIdentityKeyPair().privateKey))).toBe(false);
  });
});
