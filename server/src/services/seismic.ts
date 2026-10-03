import type { ReadingRecord, Store } from '../store/types.js';

const WINDOW_MS = 10_000; // ventana de quórum (ADR 0006)
const RADIUS_M = 5_000;
export const QUORUM = 3;

function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Guarda la lectura y, si ≥3 dispositivos distintos coinciden en 10 s y 5 km, registra/actualiza un evento sísmico confirmado. */
export async function ingestReading(store: Store, r: ReadingRecord): Promise<{ confirmed: boolean; devices: number }> {
  await store.insertReading(r);
  if (r.lat === undefined || r.lon === undefined) return { confirmed: false, devices: 1 };
  const from = new Date(Date.parse(r.ts) - WINDOW_MS).toISOString();
  const nearby = (await store.readingsSince(from, 500)).filter(
    (x) =>
      x.lat !== undefined &&
      x.lon !== undefined &&
      Math.abs(Date.parse(x.ts) - Date.parse(r.ts)) <= WINDOW_MS &&
      haversineM(r.lat!, r.lon!, x.lat, x.lon) <= RADIUS_M,
  );
  const devices = new Set(nearby.map((x) => x.deviceId));
  if (devices.size < QUORUM) return { confirmed: false, devices: devices.size };
  const bucket = Math.floor(Date.parse(r.ts) / WINDOW_MS);
  await store.upsertSeismicEvent({
    id: `sev_${bucket}_${r.lat.toFixed(2)}_${r.lon.toFixed(2)}`,
    startedAt: new Date(Math.min(...nearby.map((x) => Date.parse(x.ts)))).toISOString(),
    lat: r.lat,
    lon: r.lon,
    confidence: Math.min(1, devices.size / 5),
    devicesCount: devices.size,
    confirmed: true,
  });
  return { confirmed: true, devices: devices.size };
}
