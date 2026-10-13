import {
  PoiServiceImpl,
  TileServiceImpl,
  SEED_POIS,
  haversineDistanceMeters,
  calculateBearing,
  bearingToCardinal,
  estimateWalkingMinutes,
  formatDistance,
  isPointInBounds,
} from '../../src/core/poi';
import { MockDevScenarioController } from '../../src/core/mocks/mockDevScenarios';
import { AppException } from '../../src/contracts/types';

describe('geoUtils', () => {
  // Coordenadas conocidas en Bogotá
  // Plaza de Bolívar: 4.5981, -74.0760
  // Parque Simón Bolívar: 4.6582, -74.0935
  const plazaBolivar = { lat: 4.5981, lon: -74.076 };
  const simonBolivar = { lat: 4.6582, lon: -74.0935 };

  it('calcula distancia de Haversine de manera precisa', () => {
    const dist = haversineDistanceMeters(
      plazaBolivar.lat,
      plazaBolivar.lon,
      simonBolivar.lat,
      simonBolivar.lon
    );
    // La distancia entre Plaza de Bolívar y Parque Simón Bolívar es ≈ 6.9 - 7.0 km
    expect(dist).toBeGreaterThan(6500);
    expect(dist).toBeLessThan(7500);
  });

  it('distancia entre el mismo punto es 0', () => {
    const dist = haversineDistanceMeters(4.6, -74.0, 4.6, -74.0);
    expect(dist).toBe(0);
  });

  it('calcula rumbo y direcciones cardinales', () => {
    // Directo hacia el norte
    const rumboNorte = calculateBearing(4.0, -74.0, 5.0, -74.0);
    expect(rumboNorte).toBe(0);
    expect(bearingToCardinal(rumboNorte)).toBe('N');

    // Directo hacia el este
    const rumboEste = calculateBearing(4.0, -74.0, 4.0, -73.0);
    expect(rumboEste).toBe(90);
    expect(bearingToCardinal(rumboEste)).toBe('E');

    // Directo hacia el sur
    const rumboSur = calculateBearing(5.0, -74.0, 4.0, -74.0);
    expect(rumboSur).toBe(180);
    expect(bearingToCardinal(rumboSur)).toBe('S');

    // Directo hacia el oeste
    const rumboOeste = calculateBearing(4.0, -73.0, 4.0, -74.0);
    expect(rumboOeste).toBe(270);
    expect(bearingToCardinal(rumboOeste)).toBe('O');
  });

  it('estima tiempo de caminata a 75 m/min', () => {
    expect(estimateWalkingMinutes(0)).toBe(0);
    expect(estimateWalkingMinutes(150)).toBe(2);
    expect(estimateWalkingMinutes(750)).toBe(10);
    expect(estimateWalkingMinutes(50)).toBe(1); // Mínimo 1 minuto
  });

  it('formatea distancias en metros y kilómetros', () => {
    expect(formatDistance(350)).toBe('350 m');
    expect(formatDistance(1200)).toBe('1.2 km');
    expect(formatDistance(10000)).toBe('10.0 km');
  });

  it('verifica si un punto está dentro de los límites (isPointInBounds)', () => {
    const bounds = {
      minLat: 4.5,
      minLon: -74.2,
      maxLat: 4.8,
      maxLon: -74.0,
    };
    expect(isPointInBounds({ lat: 4.6, lon: -74.1 }, bounds)).toBe(true);
    expect(isPointInBounds({ lat: 4.9, lon: -74.1 }, bounds)).toBe(false);
    expect(isPointInBounds({ lat: 4.6, lon: -73.9 }, bounds)).toBe(false);
  });
});

describe('PoiServiceImpl', () => {
  it('inicializa con los puntos de semilla oficiales (SEED_POIS)', async () => {
    const service = new PoiServiceImpl();
    const all = await service.getAllPois();
    expect(all.length).toBe(SEED_POIS.length);
    expect(all.length).toBeGreaterThanOrEqual(15);
  });

  it('listInBounds filtra por coordenadas y tipo', async () => {
    const service = new PoiServiceImpl();
    const bounds = {
      minLat: 4.55,
      minLon: -74.15,
      maxLat: 4.75,
      maxLon: -74.02,
    };

    const inBounds = await service.listInBounds(bounds);
    expect(inBounds.length).toBeGreaterThan(0);

    const soloBomberos = await service.listInBounds(bounds, ['BOMBEROS']);
    expect(soloBomberos.length).toBeGreaterThan(0);
    for (const poi of soloBomberos) {
      expect(poi.type).toBe('BOMBEROS');
    }
  });

  it('nearest calcula puntos más cercanos y los ordena por distancia ascendente', async () => {
    const service = new PoiServiceImpl();
    // Ubicación cercana al Parque Simón Bolívar: 4.658, -74.093
    const userPos = { lat: 4.658, lon: -74.093, ts: new Date().toISOString() };
    const nearest = await service.nearest(userPos, undefined, 3);

    expect(nearest.length).toBe(3);
    expect(nearest[0]!.distanceM).toBeLessThanOrEqual(nearest[1]!.distanceM);
    expect(nearest[1]!.distanceM).toBeLessThanOrEqual(nearest[2]!.distanceM);
    // El Parque Simón Bolívar o Coliseo El Salitre deben estar a menos de 500 m
    expect(nearest[0]!.distanceM).toBeLessThan(500);
  });

  it('nearest filtra por tipo cuando se especifica', async () => {
    const service = new PoiServiceImpl();
    const userPos = { lat: 4.62, lon: -74.07, ts: new Date().toISOString() };
    const saludNearest = await service.nearest(userPos, ['SALUD'], 2);

    expect(saludNearest.length).toBe(2);
    expect(saludNearest[0]!.type).toBe('SALUD');
    expect(saludNearest[1]!.type).toBe('SALUD');
  });

  it('reportProblem con NO_DISPONIBLE desactiva el POI localmente', async () => {
    const service = new PoiServiceImpl();
    const poiId = 'poi-salud-001';

    const before = await service.getPoiById(poiId);
    expect(before?.active).toBe(true);

    await service.reportProblem(poiId, 'NO_DISPONIBLE', 'Acceso colapsado por escombros');

    const after = await service.getPoiById(poiId);
    expect(after?.active).toBe(false);

    const reports = service.getProblemReports();
    expect(reports.length).toBe(1);
    expect(reports[0]!.poiId).toBe(poiId);
    expect(reports[0]!.reason).toBe('NO_DISPONIBLE');
    expect(reports[0]!.note).toBe('Acceso colapsado por escombros');
  });
});

describe('TileServiceImpl', () => {
  it('lista regiones incluyendo Bogotá D.C. descargada por defecto', async () => {
    const service = new TileServiceImpl();
    const regions = await service.listRegions();
    expect(regions.length).toBeGreaterThanOrEqual(1);

    const bogota = regions.find((r) => r.id === 'region-bogota-dc');
    expect(bogota).toBeDefined();
    expect(bogota?.downloaded).toBe(true);
    expect(bogota?.sizeMB).toBe(19);
  });

  it('getLocalTilesPath devuelve ruta local cuando está descargado', async () => {
    const service = new TileServiceImpl();
    const path = await service.getLocalTilesPath('region-bogota-dc');
    expect(path).toContain('region-bogota-dc.mbtiles');
  });

  it('devuelve null en getLocalTilesPath si el escenario sin_mapa_cacheado está activo', async () => {
    const dev = new MockDevScenarioController();
    dev.activate('sin_mapa_cacheado');

    const service = new TileServiceImpl(dev);
    const path = await service.getLocalTilesPath('region-bogota-dc');
    expect(path).toBeNull();

    const regions = await service.listRegions();
    const bogota = regions.find((r) => r.id === 'region-bogota-dc');
    expect(bogota?.downloaded).toBe(false);
  });

  it('remove desinstala la región y getLocalTilesPath pasa a null', async () => {
    const service = new TileServiceImpl();
    await service.remove('region-bogota-dc');

    const path = await service.getLocalTilesPath('region-bogota-dc');
    expect(path).toBeNull();

    const regions = await service.listRegions();
    const bogota = regions.find((r) => r.id === 'region-bogota-dc');
    expect(bogota?.downloaded).toBe(false);
  });

  it('download descarga con progreso y vuelve a habilitar la región', async () => {
    const service = new TileServiceImpl();
    await service.remove('region-bogota-dc');

    const progressValues: number[] = [];
    await service.download('region-bogota-dc', (pct) => {
      progressValues.push(pct);
    });

    expect(progressValues).toContain(100);
    const path = await service.getLocalTilesPath('region-bogota-dc');
    expect(path).toContain('region-bogota-dc.mbtiles');
  });

  it('download lanza NETWORK_UNAVAILABLE si el escenario offline_total está activo', async () => {
    const dev = new MockDevScenarioController();
    dev.activate('offline_total');

    const service = new TileServiceImpl(dev);
    await expect(
      service.download('region-bogota-dc', () => {})
    ).rejects.toThrow(AppException);

    try {
      await service.download('region-bogota-dc', () => {});
    } catch (e: unknown) {
      expect((e as AppException).code).toBe('NETWORK_UNAVAILABLE');
    }
  });
});
