import { ed25519 } from '@noble/curves/ed25519.js';
import { toBase64, utf8 } from '../../../src/core/util/bytes';
import { hashRescuerCode, rescuerListMessage, RescuerCodeAuthority, type RescuerTrust, type SignedRescuerList } from '../../../src/core/rescuer/RescuerCodeAuthority';

export const CODIGO_VALIDO = 'DEF-ABCD-EFGH-JKMN';
export const CODIGO_OTRO = 'CRU-2345-6789-PQRS';
export const AHORA = 1_790_000_000_000;

export function crearEmisor() {
  const priv = ed25519.utils.randomSecretKey();
  const trust: RescuerTrust = { publicKey: toBase64(ed25519.getPublicKey(priv)), pepper: 'pimienta-de-prueba', maxAgeDays: 90 };
  const emitir = (codes: string[], issuedAt = new Date(AHORA).toISOString(), clave = priv): SignedRescuerList => {
    const hashes = codes.map((c) => hashRescuerCode(c, trust.pepper));
    return { issuedAt, hashes, signature: toBase64(ed25519.sign(utf8(rescuerListMessage(issuedAt, hashes)), clave)) };
  };
  return { trust, emitir };
}

/** Autoridad con una lista firmada válida que contiene los códigos indicados. */
export function autoridadCon(codes: string[]) {
  const { trust, emitir } = crearEmisor();
  const authority = new RescuerCodeAuthority(trust, () => AHORA);
  expect(authority.load(emitir(codes))).toBeNull();
  return authority;
}
