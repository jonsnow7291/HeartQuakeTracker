import { fromUtf8, utf8 } from '../../src/core/util/bytes';

describe('UTF-8 propio (sin TextDecoder)', () => {
  const casos = ['hola', 'Guía de emergencia: ¡Agáchate!', 'ñandú 🇨🇴 ✓ 日本', ''];
  it.each(casos)('ida y vuelta: %s', (t) => {
    expect(fromUtf8(utf8(t))).toBe(t);
  });
  it('coincide con TextEncoder de Node', () => {
    for (const t of casos) expect(Buffer.from(utf8(t)).equals(Buffer.from(new TextEncoder().encode(t)))).toBe(true);
  });
});
