import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MemoryStore } from '../src/store/memoryStore.js';
import { seedStore } from '../src/seed.js';
import { ADMIN } from './helpers.js';

const setup = async () => {
  const store = new MemoryStore();
  await seedStore(store);
  const app = buildApp({ store, config: { rateLimitPerMin: 0, adminToken: 'test-admin-token' } });
  return { app, store };
};

describe('POIs (RF-10)', () => {
  it('lista los POIs de la semilla y filtra por bbox y tipo', async () => {
    const { app } = await setup();
    const all = (await app.inject({ method: 'GET', url: '/v1/pois' })).json();
    expect(all.items.length).toBe(20);
    const salud = (await app.inject({ method: 'GET', url: '/v1/pois?types=SALUD' })).json();
    expect(salud.items.every((p: { type: string }) => p.type === 'SALUD')).toBe(true);
    const norte = (await app.inject({ method: 'GET', url: '/v1/pois?bbox=-74.2,4.7,-74.0,4.8' })).json();
    expect(norte.items.length).toBeGreaterThan(0);
    expect(norte.items.every((p: { lat: number }) => p.lat >= 4.7)).toBe(true);
  });

  it('delta con since: solo lo modificado después', async () => {
    const { app } = await setup();
    const before = new Date(Date.now() + 5).toISOString();
    await new Promise((r) => setTimeout(r, 15));
    expect((await app.inject({ method: 'GET', url: `/v1/pois?since=${before}` })).json().items).toHaveLength(0);
    await app.inject({ method: 'PUT', url: '/admin/pois/poi-nuevo', headers: ADMIN, payload: { type: 'ALBERGUE', name: 'Nuevo', lat: 4.6, lon: -74.1 } });
    expect((await app.inject({ method: 'GET', url: `/v1/pois?since=${before}` })).json().items).toHaveLength(1);
  });

  it('400 con parámetros inválidos', async () => {
    const { app } = await setup();
    for (const q of ['bbox=1,2,3', 'types=NOPE', 'since=ayer']) expect((await app.inject({ method: 'GET', url: `/v1/pois?${q}` })).statusCode).toBe(400);
  });
});

describe('Ayudas (RF-11), tiles y sismos', () => {
  it('entidades solo activas y necesidades', async () => {
    const { app } = await setup();
    expect((await app.inject({ method: 'GET', url: '/v1/aid/entities' })).json().items.length).toBe(4);
    expect((await app.inject({ method: 'GET', url: '/v1/aid/needs' })).json().items.length).toBe(8);
  });

  it('tiles: lista regiones; descarga 404 NOT_PUBLISHED sin URL y 302 con URL', async () => {
    const { app } = await setup();
    expect((await app.inject({ method: 'GET', url: '/v1/tiles/regions' })).json().items[0].id).toBe('bogota');
    expect((await app.inject({ method: 'GET', url: '/v1/tiles/regions/bogota/download' })).json().error).toBe('NOT_PUBLISHED');
    expect((await app.inject({ method: 'GET', url: '/v1/tiles/regions/zzz/download' })).statusCode).toBe(404);
    await app.inject({ method: 'POST', url: '/admin/tiles/regions', headers: ADMIN, payload: { id: 'bogota', name: 'Bogotá', sizeMB: 180, version: '2', url: 'https://cdn.example.com/bogota.mbtiles' } });
    const r = await app.inject({ method: 'GET', url: '/v1/tiles/regions/bogota/download' });
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toBe('https://cdn.example.com/bogota.mbtiles');
  });

  it('eventos sísmicos: ≥3 dispositivos coinciden → confirmado', async () => {
    const { app } = await setup();
    const { newDevice, registerDevice, signedPost } = await import('./helpers.js');
    const ts = new Date().toISOString();
    let confirmed = 0;
    for (let i = 0; i < 3; i++) {
      const d = newDevice();
      await registerDevice(app, d);
      const res = await signedPost(app, d, '/v1/seismic/readings', { readings: [{ ts, peakG: 0.09, lat: 4.65 + i * 0.001, lon: -74.06 }] });
      expect(res.statusCode).toBe(200);
      confirmed += res.json().confirmedEvents;
    }
    expect(confirmed).toBe(1); // solo la 3.ª lectura alcanza el quórum
    const events = (await app.inject({ method: 'GET', url: '/v1/seismic/events' })).json().items;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ confirmed: true, devicesCount: 3 });
  });

  it('2 dispositivos no confirman', async () => {
    const { app } = await setup();
    const { newDevice, registerDevice, signedPost } = await import('./helpers.js');
    for (let i = 0; i < 2; i++) {
      const d = newDevice();
      await registerDevice(app, d);
      await signedPost(app, d, '/v1/seismic/readings', { readings: [{ ts: new Date().toISOString(), peakG: 0.09, lat: 4.65, lon: -74.06 }] });
    }
    expect((await app.inject({ method: 'GET', url: '/v1/seismic/events' })).json().items).toHaveLength(0);
  });
});
