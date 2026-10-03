import { createPrivateKey, createPublicKey, generateKeyPairSync, sign as cryptoSign, type KeyObject } from 'node:crypto';
import { sha256Hex } from '../security/deviceAuth.js';

export const hashRescuerCode = (code: string, pepper: string): string => sha256Hex(`${pepper}:${code.trim().toUpperCase()}`);

export interface ServerSigner {
  publicKeyB64: string;
  sign(message: string): string;
}

const rawPublic = (pub: KeyObject): string => pub.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');

/** Firmante del servidor (Ed25519). Con SERVER_SIGNING_KEY (PKCS8 DER en base64) es estable; si no, efímero (solo desarrollo). */
export function createSigner(privateKeyPkcs8B64?: string): ServerSigner {
  let privateKey: KeyObject;
  let publicKeyB64: string;
  if (privateKeyPkcs8B64) {
    privateKey = createPrivateKey({ key: Buffer.from(privateKeyPkcs8B64, 'base64'), format: 'der', type: 'pkcs8' });
    publicKeyB64 = rawPublic(createPublicKey(privateKey));
  } else {
    const kp = generateKeyPairSync('ed25519');
    privateKey = kp.privateKey;
    publicKeyB64 = rawPublic(kp.publicKey);
  }
  return { publicKeyB64, sign: (m) => cryptoSign(null, Buffer.from(m), privateKey).toString('base64') };
}

/** Mensaje canónico firmado de la lista de socorristas (hashes ordenados). */
export const rescuerListMessage = (issuedAt: string, hashes: string[]): string => `${issuedAt}|${[...hashes].sort().join(',')}`;
