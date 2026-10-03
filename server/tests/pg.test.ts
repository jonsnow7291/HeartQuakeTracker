import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { seedStore } from '../src/seed.js';
import { migrate } from '../src/store/migrate.js';
import { PgStore } from '../src/store/pgStore.js';
import { ADMIN, ev, newDevice, registerDevice, signedPost } from './helpers.js';

// Solo corre si hay una BD de pruebas: TEST_DATABASE_URL=postgres://...@localhost:5432/eqt_test
const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d('PgStore (PostgreSQL real)', () => {
  let store: PgStore;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    const pool = new pg.Pool({ connectionString: url });
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.end();
    const applied = await migrate(url!);
    expect(applied).toEqual(['001_init.sql']);
    store = PgStore.connect(url!);
    await seedStore(store);
    app = buildApp({ store, config: { rateLimitPerMin: 0, adminToken: 'test-admin-token' } });
  });
  afterAll(async () => {
    await app.close();
  });

  it('migrar de nuevo no aplica nada (idempotente)', async () => {
    expect(await migrate(url!)).toEqual([]);
  });

  it('semilla: 20 POIs, filtros por tipo/bbox y delta', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/pois' })).json().items).toHaveLength(20);
    const salud = (await app.inject({ method: 'GET', url: '/v1/pois?types=SALUD,BOMBEROS' })).json().items;
    expect(salud.length).toBeGreaterThan(0);
    expect(salud.every((p: { type: string }) => ['SALUD', 'BOMBEROS'].includes(p.type))).toBe(true);
    const norte = (await app.inject({ method: 'GET', url: '/v1/pois?bbox=-74.2,4.7,-74.0,4.8' })).json().items;
    expect(norte.every((p: { lat: number }) => p.lat >= 4.7 && p.lat <= 4.8)).toBe(true);
    const mark = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 20));
    await app.inject({ method: 'PUT', url: '/admin/pois/poi-pg', headers: ADMIN, payload: { type: 'ACOPIO', name: 'PG', lat: 4.6, lon: -74.1 } });
    expect((await app.inject({ method: 'GET', url: `/v1/pois?since=${mark}` })).json().items.map((p: { id: string }) => p.id)).toEqual(['poi-pg']);
  });

  it('dispositivos + sync idempotente + eventos guardados', async () => {
    const dev = newDevice();
    const id = await registerDevice(app, dev);
    const before = await store.eventCount();
    const body = { events: [ev('pg-evt-00000001', id), ev('pg-evt-00000002', id, { geo: { lat: 4.6, lon: -74.1, acc: 5 } })] };
    expect((await signedPost(app, dev, '/v1/sync/batch', body)).json().acks.map((a: { status: string }) => a.status)).toEqual(['OK', 'OK']);
    expect((await signedPost(app, dev, '/v1/sync/batch', body)).json().acks.map((a: { status: string }) => a.status)).toEqual(['DUP', 'DUP']);
    expect(await store.eventCount()).toBe(before + 2);
    expect(await store.getDevice(id)).toMatchObject({ id, platform: 'android', revoked: false });
  });

  it('POI_PROBLEM crea reporte y SENSOR_READING crea lectura', async () => {
    const dev = newDevice();
    const id = await registerDevice(app, dev);
    const before = await store.poiReportCount();
    await signedPost(app, dev, '/v1/sync/batch', {
      events: [
        ev('pg-evt-00000010', id, { type: 'POI_PROBLEM', payload: { poiId: 'poi-pg', reason: 'NO_DISPONIBLE', note: 'cerrado' } }),
        ev('pg-evt-00000011', id, { type: 'SENSOR_READING', payload: { peakG: 0.07 }, geo: { lat: 4.6, lon: -74.1 } }),
      ],
    });
    expect(await store.poiReportCount()).toBe(before + 1);
    expect((await store.readingsSince(new Date(Date.now() - 60_000).toISOString(), 10)).some((r) => r.eventId === 'pg-evt-00000011')).toBe(true);
  });

  it('quórum sísmico con 3 dispositivos → evento confirmado persistido', async () => {
    const ts = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      const dev = newDevice();
      await registerDevice(app, dev, i % 2 ? 'ios' : 'android');
      await signedPost(app, dev, '/v1/seismic/readings', { readings: [{ ts, peakG: 0.1, lat: 4.7 + i * 0.001, lon: -74.0 }] });
    }
    const ev1 = (await app.inject({ method: 'GET', url: '/v1/seismic/events' })).json().items;
    expect(ev1).toHaveLength(1);
    expect(ev1[0]).toMatchObject({ confirmed: true, devicesCount: 3 });
  });

  it('ayudas, contenido, tiles y socorristas', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/aid/entities' })).json().items).toHaveLength(4);
    expect((await app.inject({ method: 'GET', url: '/v1/aid/needs' })).json().items).toHaveLength(8);
    const md = Buffer.from('# guía').toString('base64');
    expect((await app.inject({ method: 'POST', url: '/admin/content/publish', headers: ADMIN, payload: { version: '1.0.0', files: [{ path: 'g.md', contentBase64: md }] } })).statusCode).toBe(201);
    expect((await app.inject({ method: 'GET', url: '/v1/content/manifest' })).json().version).toBe('1.0.0');
    expect((await app.inject({ method: 'GET', url: '/v1/content/package/1.0.0' })).json().files[0].contentBase64).toBe(md);
    await app.inject({ method: 'POST', url: '/admin/tiles/regions', headers: ADMIN, payload: { id: 'bogota', name: 'Bogotá', sizeMB: 180, version: '2', url: 'https://cdn.example.com/b.mbtiles' } });
    expect((await app.inject({ method: 'GET', url: '/v1/tiles/regions/bogota/download' })).statusCode).toBe(302);
    await app.inject({ method: 'POST', url: '/admin/rescuer/codes', headers: ADMIN, payload: { code: 'bomberos-2026', organization: 'B', expiresAt: new Date(Date.now() + 86400_000).toISOString() } });
    expect((await app.inject({ method: 'POST', url: '/v1/rescuer/verify', payload: { code: 'bomberos-2026' } })).json().valid).toBe(true);
    expect((await app.inject({ method: 'GET', url: '/v1/rescuer/list' })).json().hashes).toHaveLength(1);
  });
});
