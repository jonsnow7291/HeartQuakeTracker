import { ed25519 } from '@noble/curves/ed25519.js';
import { RescuerCodeAuthority, hashRescuerCode } from '../../src/core/rescuer/RescuerCodeAuthority';
import { RealRescuerService } from '../../src/core/mesh/rescuerService';
import { AHORA, CODIGO_OTRO, CODIGO_VALIDO, crearEmisor } from './support/rescuerList';

describe('Autoridad de códigos de socorrista (D-06): lista firmada de hashes', () => {
  it('acepta un código incluido y rechaza uno que no está', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    expect(a.load(emitir([CODIGO_VALIDO]))).toBeNull();
    expect(a.isAuthorized(CODIGO_VALIDO)).toBe(true);
    expect(a.isAuthorized(CODIGO_OTRO)).toBe(false);
  });

  it('normaliza mayúsculas y espacios', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    a.load(emitir([CODIGO_VALIDO]));
    expect(a.isAuthorized('  def-abcd-efgh-jkmn ')).toBe(true);
  });

  it('sin lista cargada no autoriza nada', () => {
    const { trust } = crearEmisor();
    expect(new RescuerCodeAuthority(trust, () => AHORA).isAuthorized(CODIGO_VALIDO)).toBe(false);
  });

  it('rechaza una lista firmada con otra clave (suplantación)', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    const intruso = ed25519.utils.randomSecretKey();
    expect(a.load(emitir([CODIGO_VALIDO], undefined, intruso))).toBe('FIRMA_INVALIDA');
    expect(a.isAuthorized(CODIGO_VALIDO)).toBe(false);
  });

  it('rechaza una lista cuyo contenido fue alterado después de firmarse', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    const lista = emitir([CODIGO_VALIDO]);
    lista.hashes.push(hashRescuerCode('ATA-QUEA-AGRE-GADO', trust.pepper));
    expect(a.load(lista)).toBe('FIRMA_INVALIDA');
    expect(a.isAuthorized('ATA-QUEA-AGRE-GADO')).toBe(false);
  });

  it('ignora la clave pública que trae la lista: solo vale la fijada en la app', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    const otra = crearEmisor();
    const falsa = { ...otra.emitir([CODIGO_VALIDO]), publicKey: otra.trust.publicKey };
    expect(a.load(falsa)).toBe('FIRMA_INVALIDA');
    expect(emitir).toBeDefined();
  });

  it('rechaza una lista vencida (no refleja revocaciones)', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA + 91 * 86_400_000);
    expect(a.load(emitir([CODIGO_VALIDO]))).toBe('LISTA_VENCIDA');
  });

  it('no permite volver a una lista anterior (rollback tras una revocación)', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    const vieja = emitir([CODIGO_VALIDO, CODIGO_OTRO], new Date(AHORA - 1000).toISOString());
    const nueva = emitir([CODIGO_VALIDO], new Date(AHORA).toISOString()); // se revocó CODIGO_OTRO
    expect(a.load(nueva)).toBeNull();
    a.load(vieja);
    expect(a.isAuthorized(CODIGO_OTRO)).toBe(false);
  });

  it('rechaza códigos demasiado cortos aunque su hash estuviera en la lista', () => {
    const { trust, emitir } = crearEmisor();
    const a = new RescuerCodeAuthority(trust, () => AHORA);
    a.load(emitir(['1234']));
    expect(a.isAuthorized('1234')).toBe(false);
  });

  it('los códigos de desarrollo solo existen si se inyectan', () => {
    const { trust } = crearEmisor();
    expect(new RescuerCodeAuthority(trust, () => AHORA).isAuthorized('RESCUER-OFFLINE-TEST')).toBe(false);
    expect(new RescuerCodeAuthority(trust, () => AHORA, ['RESCUER-OFFLINE-TEST']).isAuthorized('RESCUER-OFFLINE-TEST')).toBe(true);
  });

  it('el servicio de socorrista no acepta ningún código sin autoridad configurada', async () => {
    await expect(new RealRescuerService({}).enable({ code: CODIGO_VALIDO })).rejects.toThrow();
  });

  it('el APK ya no contiene ningún código en claro', () => {
    const fs = require('fs');
    const src = fs.readFileSync(`${__dirname}/../../src/core/mesh/rescuerService.ts`, 'utf8');
    for (const viejo of ['DEFENSA-CIVIL-2026', 'BOMBEROS-BOG-2026', 'CRUZ-ROJA-BOG-2026', 'UNGRD-2026', 'RESCUER-OFFLINE-TEST']) {
      expect(src).not.toContain(viejo);
    }
  });
});

describe('Lista de socorristas que viaja en la app', () => {
  it('está firmada con la clave fijada en trust.json y contiene hashes, no códigos', () => {
    const fs = require('fs');
    const trust = require('../../src/core/rescuer/trust.json');
    const list = JSON.parse(fs.readFileSync(`${__dirname}/../../assets/bundle/rescuer/list.json`, 'utf8'));
    const a = new RescuerCodeAuthority(trust, () => Date.parse(list.issuedAt) + 1000);
    expect(a.load(list)).toBeNull();
    expect(a.size).toBeGreaterThan(0);
    for (const h of list.hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(a.isAuthorized('XXX-XXXX-XXXX-XXXX')).toBe(false);
  });
});
