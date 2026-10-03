import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { ev, newDevice, registerDevice, signedPost } from './helpers.js';

const setup = async () => {
  const app = buildApp({ config: { rateLimitPerMin: 0 } });
  const d = newDevice();
  const id = await registerDevice(app, d);
  return { app, d, id };
};
const statuses = (r: { json(): { acks: { status: string }[] } }) => r.json().acks.map((a) => a.status);

describe('GET /v1/health', () => {
  it('responde ok', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });
});

describe('POST /v1/sync/batch (RF-12)', () => {
  it('ACK OK por ítem y DUP al reintentar (idempotente)', async () => {
    const { app, d, id } = await setup();
    const body = { events: [ev('evt-00000001', id), ev('evt-00000002', id)] };
    expect(statuses(await signedPost(app, d, '/v1/sync/batch', body))).toEqual(['OK', 'OK']);
    expect(statuses(await signedPost(app, d, '/v1/sync/batch', body))).toEqual(['DUP', 'DUP']);
  });

  it('rechaza ts futuro y acepta el resto', async () => {
    const { app, d, id } = await setup();
    const future = new Date(Date.now() + 3600_000).toISOString();
    const res = await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-00000003', id), ev('evt-00000004', id, { ts: future })] });
    expect(res.json().acks).toEqual([
      { eventId: 'evt-00000003', status: 'OK' },
      { eventId: 'evt-00000004', status: 'REJECTED', reason: 'ts en el futuro' },
    ]);
  });

  it('rechaza eventos de otro dispositivo (suplantación)', async () => {
    const { app, d } = await setup();
    const res = await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-00000005', 'dev_ajeno')] });
    expect(res.json().acks[0]).toMatchObject({ status: 'REJECTED', reason: 'device no coincide con la firma' });
  });

  it('400 si el lote es inválido, supera 500 o tiene coordenadas fuera de rango', async () => {
    const { app, d, id } = await setup();
    expect((await signedPost(app, d, '/v1/sync/batch', { events: [{ eventId: 'x' }] })).statusCode).toBe(400);
    const big = { events: Array.from({ length: 501 }, (_, i) => ev(`evt-${String(i).padStart(8, '0')}`, id)) };
    expect((await signedPost(app, d, '/v1/sync/batch', big)).statusCode).toBe(400);
    expect((await signedPost(app, d, '/v1/sync/batch', { events: [ev('evt-00000006', id, { geo: { lat: 200, lon: 0 } })] })).statusCode).toBe(400);
  });

  it('procesa SENSOR_READING y POI_PROBLEM dentro del lote', async () => {
    const { app, d, id } = await setup();
    const res = await signedPost(app, d, '/v1/sync/batch', {
      events: [
        ev('evt-00000007', id, { type: 'SENSOR_READING', payload: { peakG: 0.08 }, geo: { lat: 4.65, lon: -74.06 } }),
        ev('evt-00000008', id, { type: 'POI_PROBLEM', payload: { poiId: 'p1', reason: 'NO_DISPONIBLE' } }),
      ],
    });
    expect(statuses(res)).toEqual(['OK', 'OK']);
  });
});
