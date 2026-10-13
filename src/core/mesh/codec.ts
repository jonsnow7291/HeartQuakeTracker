import { GeoPoint, Severity } from '../../contracts/types';
import {
  MeshMessageType,
  MeshPacket,
  MESH_MESSAGE_TYPE_CODES,
  MESH_SEVERITY_CODES,
} from './types';

const LAT_FACTOR = 8388607 / 90;
const LON_FACTOR = 8388607 / 180;

const TYPE_BY_CODE: Record<number, MeshMessageType> = {
  0x01: 'SOS',
  0x02: 'ACK',
  0x03: 'SEISMIC_READING',
  0x04: 'RESCUER_HELLO',
};

const SEVERITY_BY_CODE: Record<number, Severity> = {
  0x00: 'ILESO',
  0x01: 'CON_LESIONES',
  0x02: 'ATRAPADO',
};

function writeInt24BE(buf: Uint8Array, offset: number, value: number): void {
  let v = Math.round(value);
  if (v < -8388608) v = -8388608;
  if (v > 8388607) v = 8388607;
  if (v < 0) {
    v = (1 << 24) + v;
  }
  buf[offset] = (v >> 16) & 0xff;
  buf[offset + 1] = (v >> 8) & 0xff;
  buf[offset + 2] = v & 0xff;
}

function readInt24BE(buf: Uint8Array, offset: number): number {
  const b0 = buf[offset] ?? 0;
  const b1 = buf[offset + 1] ?? 0;
  const b2 = buf[offset + 2] ?? 0;
  let v = (b0 << 16) | (b1 << 8) | b2;
  if (v & 0x800000) {
    v -= 1 << 24;
  }
  return v;
}

function hexToBytes(hex: string, length = 6): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase().padStart(length * 2, '0');
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array, offset = 0, length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    const b = bytes[offset + i] ?? 0;
    out += b.toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Codifica un paquete de malla al formato binario compacto (≤ 31 B, base 26 B).
 */
export function encodeMeshPacket(packet: MeshPacket): Uint8Array {
  const isExtended = packet.authTag.length > 4;
  const totalLength = 22 + (isExtended ? packet.authTag.length : 4);
  const buf = new Uint8Array(totalLength);

  // Byte 0: version(3) | relayed(1) | lowPower(1) | medicalAvailable(1) | extendedSig(1) | hasLocation(1)
  const versionBits = (packet.version & 0x07) << 5;
  const relayedBit = packet.relayed ? 1 << 4 : 0;
  const lowPowerBit = packet.lowPower ? 1 << 3 : 0;
  const medicalBit = packet.medicalAvailable ? 1 << 2 : 0;
  const extendedBit = isExtended ? 1 << 1 : 0;
  const locationBit = packet.hasLocation && packet.location ? 1 : 0;
  buf[0] = versionBits | relayedBit | lowPowerBit | medicalBit | extendedBit | locationBit;

  // Byte 1: tipo de mensaje
  buf[1] = MESH_MESSAGE_TYPE_CODES[packet.type] ?? 0x01;

  // Bytes 2..7: ID efímero (6 B)
  const idBytes = hexToBytes(packet.idEphemeral, 6);
  buf.set(idBytes, 2);

  // Bytes 8..9: secuencia uint16 BE
  const seq = packet.seq & 0xffff;
  buf[8] = (seq >> 8) & 0xff;
  buf[9] = seq & 0xff;

  // Byte 10: gravedad
  if (packet.severity && packet.severity in MESH_SEVERITY_CODES) {
    buf[10] = MESH_SEVERITY_CODES[packet.severity]!;
  } else {
    buf[10] = 0xff;
  }

  // Bytes 11..13 y 14..16: latitud y longitud cuantizadas
  if (locationBit && packet.location) {
    const latQ = Math.round(packet.location.lat * LAT_FACTOR);
    const lonQ = Math.round(packet.location.lon * LON_FACTOR);
    writeInt24BE(buf, 11, latQ);
    writeInt24BE(buf, 14, lonQ);
  } else {
    writeInt24BE(buf, 11, 0);
    writeInt24BE(buf, 14, 0);
  }

  // Bytes 17..20: timestamp epoch seconds UTC uint32 BE
  const ts = Math.floor(packet.timestamp) >>> 0;
  buf[17] = (ts >> 24) & 0xff;
  buf[18] = (ts >> 16) & 0xff;
  buf[19] = (ts >> 8) & 0xff;
  buf[20] = ts & 0xff;

  // Byte 21: TTL (uint8)
  buf[21] = packet.ttl & 0xff;

  // Bytes 22..: firma truncada (4 B en legacy) o extendida
  if (isExtended) {
    buf.set(packet.authTag, 22);
  } else {
    const tag = new Uint8Array(4);
    tag.set(packet.authTag.subarray(0, 4));
    buf.set(tag, 22);
  }

  return buf;
}

/**
 * Decodifica un paquete binario al objeto MeshPacket.
 * Retorna null si la longitud o los datos no son válidos.
 */
export function decodeMeshPacket(bytes: Uint8Array): MeshPacket | null {
  if (bytes.length < 26) {
    return null;
  }

  const b0 = bytes[0] ?? 0;
  const version = (b0 >> 5) & 0x07;
  const relayed = (b0 & (1 << 4)) !== 0;
  const lowPower = (b0 & (1 << 3)) !== 0;
  const medicalAvailable = (b0 & (1 << 2)) !== 0;
  const isExtended = (b0 & (1 << 1)) !== 0;
  const hasLocation = (b0 & 1) !== 0;

  const typeCode = bytes[1] ?? 0;
  const type = TYPE_BY_CODE[typeCode];
  if (!type) {
    return null;
  }

  const idEphemeral = bytesToHex(bytes, 2, 6);
  const seq = ((bytes[8] ?? 0) << 8) | (bytes[9] ?? 0);

  const sevCode = bytes[10] ?? 0xff;
  const severity = SEVERITY_BY_CODE[sevCode];

  const rawLatQ = readInt24BE(bytes, 11);
  const rawLonQ = readInt24BE(bytes, 14);

  const b17 = bytes[17] ?? 0;
  const b18 = bytes[18] ?? 0;
  const b19 = bytes[19] ?? 0;
  const b20 = bytes[20] ?? 0;
  const timestamp = ((b17 << 24) | (b18 << 16) | (b19 << 8) | b20) >>> 0;

  const ttl = bytes[21] ?? 0;

  const authTagLength = isExtended ? bytes.length - 22 : 4;
  if (bytes.length < 22 + authTagLength) {
    return null;
  }
  const authTag = new Uint8Array(bytes.subarray(22, 22 + authTagLength));

  let location: GeoPoint | undefined;
  if (hasLocation) {
    const lat = Math.round((rawLatQ / LAT_FACTOR) * 1e5) / 1e5;
    const lon = Math.round((rawLonQ / LON_FACTOR) * 1e5) / 1e5;
    location = {
      lat,
      lon,
      ts: new Date(timestamp * 1000).toISOString(),
    };
  }

  return {
    version,
    relayed,
    lowPower,
    medicalAvailable,
    hasLocation,
    type,
    idEphemeral,
    seq,
    severity,
    location,
    timestamp,
    ttl,
    authTag,
  };
}
