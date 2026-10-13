const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Convierte Uint8Array a cadena Base64 sin dependencias externas.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
    const b2 = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;
    result += B64_CHARS[b0 >> 2];
    result += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? B64_CHARS[b2 & 63] : '=';
  }
  return result;
}

/**
 * Convierte cadena Base64 a Uint8Array sin dependencias externas.
 */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  if (len === 0) return new Uint8Array(0);

  const placeHolders = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  const bytesLen = Math.max(0, Math.floor((len * 3) / 4) - placeHolders);
  const bytes = new Uint8Array(bytesLen);

  let cur = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = clean[i];
    const c1 = clean[i + 1];
    const c2 = clean[i + 2];
    const c3 = clean[i + 3];

    const n0 = c0 ? B64_CHARS.indexOf(c0) : 0;
    const n1 = c1 ? B64_CHARS.indexOf(c1) : 0;
    const n2 = c2 ? B64_CHARS.indexOf(c2) : 0;
    const n3 = c3 ? B64_CHARS.indexOf(c3) : 0;

    if (cur < bytesLen) bytes[cur++] = (n0 << 2) | (n1 >> 4);
    if (cur < bytesLen) bytes[cur++] = ((n1 & 15) << 4) | (n2 >> 2);
    if (cur < bytesLen) bytes[cur++] = ((n2 & 3) << 6) | n3;
  }
  return bytes;
}
