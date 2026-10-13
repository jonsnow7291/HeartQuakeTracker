import { decodeMeshPacket, encodeMeshPacket } from '../../../src/core/mesh/codec';
import { MeshPacket } from '../../../src/core/mesh/types';

describe('Mesh Codec (Paquete compacto <= 31 B)', () => {
  const samplePacket: MeshPacket = {
    version: 1,
    relayed: false,
    lowPower: false,
    medicalAvailable: true,
    hasLocation: true,
    type: 'SOS',
    idEphemeral: 'a1b2c3d4e5f6',
    seq: 42,
    severity: 'ATRAPADO',
    location: {
      lat: 4.60971,
      lon: -74.08175,
      ts: '2026-10-12T12:00:00.000Z',
    },
    timestamp: 1776000000,
    ttl: 4,
    authTag: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
  };

  it('codifica a exactamente 26 bytes (<= 31 B) en formato legacy', () => {
    const raw = encodeMeshPacket(samplePacket);
    expect(raw.length).toBe(26);
    expect(raw.length).toBeLessThanOrEqual(31);
  });

  it('decodifica fielmente todos los campos del paquete SOS', () => {
    const raw = encodeMeshPacket(samplePacket);
    const decoded = decodeMeshPacket(raw);

    expect(decoded).not.toBeNull();
    expect(decoded?.version).toBe(1);
    expect(decoded?.relayed).toBe(false);
    expect(decoded?.lowPower).toBe(false);
    expect(decoded?.medicalAvailable).toBe(true);
    expect(decoded?.hasLocation).toBe(true);
    expect(decoded?.type).toBe('SOS');
    expect(decoded?.idEphemeral).toBe('a1b2c3d4e5f6');
    expect(decoded?.seq).toBe(42);
    expect(decoded?.severity).toBe('ATRAPADO');
    expect(decoded?.timestamp).toBe(1776000000);
    expect(decoded?.ttl).toBe(4);
    expect(decoded?.authTag).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));

    // Precisión de coordenadas cuantizadas (~1.2 m de tolerancia)
    expect(decoded?.location).toBeDefined();
    expect(decoded?.location?.lat).toBeCloseTo(4.60971, 4);
    expect(decoded?.location?.lon).toBeCloseTo(-74.08175, 4);
  });

  it('soporta paquete sin ubicación GPS (hasLocation = false)', () => {
    const packetWithoutGps: MeshPacket = {
      ...samplePacket,
      hasLocation: false,
      location: undefined,
      severity: 'CON_LESIONES',
    };
    const raw = encodeMeshPacket(packetWithoutGps);
    expect(raw.length).toBe(26);

    const decoded = decodeMeshPacket(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.hasLocation).toBe(false);
    expect(decoded?.location).toBeUndefined();
    expect(decoded?.severity).toBe('CON_LESIONES');
  });

  it('soporta los diferentes tipos de mensaje y flags de relé y lowPower', () => {
    const relayPacket: MeshPacket = {
      ...samplePacket,
      relayed: true,
      lowPower: true,
      type: 'ACK',
      ttl: 3,
    };
    const raw = encodeMeshPacket(relayPacket);
    const decoded = decodeMeshPacket(raw);

    expect(decoded).not.toBeNull();
    expect(decoded?.relayed).toBe(true);
    expect(decoded?.lowPower).toBe(true);
    expect(decoded?.type).toBe('ACK');
    expect(decoded?.ttl).toBe(3);
  });

  it('rechaza buffers corruptos o de longitud insuficiente (<26 bytes)', () => {
    expect(decodeMeshPacket(new Uint8Array(10))).toBeNull();
    expect(decodeMeshPacket(new Uint8Array(0))).toBeNull();

    // Tipo de mensaje inválido
    const invalidTypeBytes = new Uint8Array(26);
    invalidTypeBytes[1] = 0x99; // Tipo no existente
    expect(decodeMeshPacket(invalidTypeBytes)).toBeNull();
  });
});
