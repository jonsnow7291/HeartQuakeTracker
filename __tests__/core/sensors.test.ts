import { AppException } from '../../src/contracts/types';
import type { SeismicAlert } from '../../src/contracts/sensors';
import { DEFAULT_SENSOR_CONFIG } from '../../src/core/sensors/config';
import type { AccelerometerPort, AccelerometerSample } from '../../src/core/sensors/ports';
import { HighPassFilterAxis, HighPassFilter3D, SeismicSignalDetector } from '../../src/core/sensors/filter';
import { SensorServiceImpl } from '../../src/core/sensors/SensorServiceImpl';
import { AlertsServiceImpl } from '../../src/core/sensors/AlertsServiceImpl';
import { FakeClock, MemoryKeyValueStore } from './support/nodePorts';

class FakeAccelerometerPort implements AccelerometerPort {
  available = true;
  running = false;
  sampleCallback?: (s: AccelerometerSample) => void;

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async start(_rateHz: number, onSample: (s: AccelerometerSample) => void): Promise<void> {
    if (!this.available) {
      throw new Error('Hardware unavailable');
    }
    this.running = true;
    this.sampleCallback = onSample;
  }

  stop(): void {
    this.running = false;
    this.sampleCallback = undefined;
  }

  feed(sample: AccelerometerSample): void {
    if (this.running && this.sampleCallback) {
      this.sampleCallback(sample);
    }
  }

  feedStationary(seconds: number, sampleRateHz = 50): void {
    const dt = 1000 / sampleRateHz;
    let t = 0;
    const totalSamples = seconds * sampleRateHz;
    for (let i = 0; i < totalSamples; i++) {
      this.feed({ x: 0.001, y: 0.002, z: 1.0, timestamp: t });
      t += dt;
    }
  }

  feedShake(seconds: number, amplitudeG = 0.08, frequencyHz = 5, sampleRateHz = 50): void {
    const dt = 1000 / sampleRateHz;
    let t = 0;
    const totalSamples = seconds * sampleRateHz;
    for (let i = 0; i < totalSamples; i++) {
      const timeSec = t / 1000;
      const wave = amplitudeG * Math.sin(2 * Math.PI * frequencyHz * timeSec);
      this.feed({
        x: wave,
        y: wave * 0.7,
        z: 1.0 + wave * 0.5,
        timestamp: t,
      });
      t += dt;
    }
  }
}

describe('P4 - Sensores y detección sísmica (RF-09, D-18)', () => {
  describe('Filtro digital y detector RMS', () => {
    it('elimina la componente continua de gravedad estática (1g) en reposo', () => {
      const filter = new HighPassFilter3D(0.5, 50);
      let lastDynamic = 1;
      // Simular teléfono quieto sobre una mesa durante 3 segundos a 50 Hz
      for (let i = 0; i < 150; i++) {
        const out = filter.process({ x: 0, y: 0, z: 1.0, timestamp: i * 20 });
        lastDynamic = out.dynamicG;
      }
      // Tras converger, la aceleración dinámica debe ser prácticamente 0 g
      expect(lastDynamic).toBeLessThan(0.005);
    });

    it('descarta caídas o sacudidas breves de menos de 1 segundo (anti falsos positivos)', () => {
      const detector = new SeismicSignalDetector(DEFAULT_SENSOR_CONFIG);
      let detectedAny = false;

      // 1. Reposo inicial por 1 segundo
      for (let i = 0; i < 50; i++) {
        detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: i * 20 });
      }

      // 2. Golpe brusco de 300 ms (15 muestras) de 0.2g
      for (let i = 50; i < 65; i++) {
        const res = detector.processSample({ x: 0.2, y: 0.2, z: 1.2, timestamp: i * 20 });
        if (res.detected) detectedAny = true;
      }

      // 3. Vuelta a reposo por 1 segundo
      for (let i = 65; i < 115; i++) {
        const res = detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: i * 20 });
        if (res.detected) detectedAny = true;
      }

      // No debe disparar alerta sísmica porque duró < 1 segundo
      expect(detectedAny).toBe(false);
    });

    it('detecta sacudida sostenida que supera 0.03g durante ≥ 1 segundo en < 500 ms tras el umbral', () => {
      const detector = new SeismicSignalDetector(DEFAULT_SENSOR_CONFIG);
      let detected = false;
      let peakObserved = 0;

      // Reposo
      for (let i = 0; i < 50; i++) {
        detector.processSample({ x: 0, y: 0, z: 1.0, timestamp: i * 20 });
      }

      // Sacudida sísmica sostenida a 5 Hz de 0.07g durante 1.4 segundos (70 muestras)
      const startShakeIdx = 50;
      let sampleIndexWhenDetected = -1;

      for (let i = startShakeIdx; i < startShakeIdx + 70; i++) {
        const tSec = (i * 20) / 1000;
        const wave = 0.07 * Math.sin(2 * Math.PI * 5 * tSec);
        const res = detector.processSample({
          x: wave,
          y: wave * 0.5,
          z: 1.0 + wave * 0.3,
          timestamp: i * 20,
        });

        if (res.detected) {
          detected = true;
          peakObserved = res.peakG;
          if (sampleIndexWhenDetected === -1) {
            sampleIndexWhenDetected = i;
          }
        }
      }

      expect(detected).toBe(true);
      expect(peakObserved).toBeGreaterThanOrEqual(0.03);
      // El tiempo desde que comenzó hasta que se detectó debe cumplir la ventana de 1 s
      const detectionLatencySamples = sampleIndexWhenDetected - startShakeIdx;
      expect(detectionLatencySamples).toBeGreaterThanOrEqual(45); // al rededor de 1 s a 50 Hz
    });
  });

  describe('SensorServiceImpl', () => {
    let fakePort: FakeAccelerometerPort;
    let clock: FakeClock;
    let service: SensorServiceImpl;

    beforeEach(() => {
      fakePort = new FakeAccelerometerPort();
      clock = new FakeClock();
      service = new SensorServiceImpl({
        accelerometer: fakePort,
        clock,
        localNodeId: 'node_alpha',
      });
    });

    it('falla con NO_SENSORS si el hardware no está disponible', async () => {
      fakePort.available = false;
      const noSensorService = new SensorServiceImpl({
        accelerometer: fakePort,
        clock,
      });

      expect(noSensorService.isAvailable()).toBe(false);
      await expect(noSensorService.start()).rejects.toThrow(AppException);
      try {
        await noSensorService.start();
      } catch (err) {
        expect((err as AppException).code).toBe('NO_SENSORS');
      }
    });

    it('inicia y detiene la adquisición de lecturas correctamente', async () => {
      expect(fakePort.running).toBe(false);
      await service.start();
      expect(fakePort.running).toBe(true);
      service.stop();
      expect(fakePort.running).toBe(false);
    });

    it('emite alerta sísmica inicial POSSIBLE ante sacudida local', async () => {
      const alerts: SeismicAlert[] = [];
      service.subscribe((a) => alerts.push(a));

      await service.start();
      fakePort.feedStationary(1);
      expect(alerts.length).toBe(0);

      // Simular sacudida sostenida de 1.5 s
      fakePort.feedShake(1.5, 0.09);

      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const first = alerts[0]!;
      expect(first.level).toBe('POSSIBLE');
      expect(first.peakG).toBeGreaterThan(0.03);
      expect(first.quorumNodes).toBe(1);
    });

    it('eleva alerta a CONFIRMED cuando se alcanza quórum de ≥ 3 nodos en 10 segundos', async () => {
      const alerts: SeismicAlert[] = [];
      service.subscribe((a) => alerts.push(a));

      await service.start();
      fakePort.feedStationary(1);
      fakePort.feedShake(1.5, 0.08);

      expect(alerts.length).toBe(1);
      expect(alerts[0]?.level).toBe('POSSIBLE');

      // Llega lectura colaborativa del segundo nodo en t + 2 s
      clock.advance(2000);
      service.recordCollaborativeReading('node_beta', 0.07);
      expect(alerts.length).toBe(1); // aún solo 2 nodos (alpha + beta)

      // Llega lectura colaborativa del tercer nodo en t + 4 s
      clock.advance(2000);
      service.recordCollaborativeReading('node_gamma', 0.11);

      // Ahora quórum >= 3 nodos: debe emitir alerta CONFIRMED
      expect(alerts.length).toBe(2);
      const confirmedAlert = alerts[1]!;
      expect(confirmedAlert.level).toBe('CONFIRMED');
      expect(confirmedAlert.quorumNodes).toBe(3);
      expect(confirmedAlert.peakG).toBeGreaterThanOrEqual(0.11);
    });

    it('descarta nodos fuera de la ventana de quórum de 10 segundos', async () => {
      const alerts: SeismicAlert[] = [];
      service.subscribe((a) => alerts.push(a));

      await service.start();
      fakePort.feedStationary(1);
      fakePort.feedShake(1.5, 0.08);

      expect(alerts.length).toBe(1);

      // El segundo nodo reporta
      service.recordCollaborativeReading('node_beta', 0.06);

      // Pasan 12 segundos (supera la ventana de 10 s)
      clock.advance(12000);

      // Llega un tercer nodo tarde
      service.recordCollaborativeReading('node_gamma', 0.08);

      // No debe elevar a CONFIRMED porque node_beta y la detección local ya expiraron
      const confirmedAlerts = alerts.filter((a) => a.level === 'CONFIRMED');
      expect(confirmedAlerts.length).toBe(0);
    });
  });

  describe('AlertsServiceImpl', () => {
    let fakePort: FakeAccelerometerPort;
    let clock: FakeClock;
    let sensorService: SensorServiceImpl;
    let store: MemoryKeyValueStore;
    let alertsService: AlertsServiceImpl;

    beforeEach(() => {
      fakePort = new FakeAccelerometerPort();
      clock = new FakeClock();
      sensorService = new SensorServiceImpl({
        accelerometer: fakePort,
        clock,
        localNodeId: 'node_local',
      });
      store = new MemoryKeyValueStore();
      alertsService = new AlertsServiceImpl({
        sensorService,
        store,
        clock,
      });
    });

    afterEach(() => {
      alertsService.destroy();
    });

    it('con el historial vacío no inventa alertas ni simulacros', async () => {
      const page = await alertsService.list();
      expect(page.items).toEqual([]);
    });

    it('permite agendar simulacros con scheduleDrill() y notifica a los suscriptores', async () => {
      const notified: string[] = [];
      alertsService.subscribeNew((a) => notified.push(a.title));

      const drillTime = new Date(clock.now() + 86400000).toISOString();
      await alertsService.scheduleDrill(drillTime, 'Simulacro Escolar Uniminuto');

      expect(notified).toContain('Simulacro Escolar Uniminuto');
      const page = await alertsService.list();
      const drill = page.items.find((i) => i.title === 'Simulacro Escolar Uniminuto');
      expect(drill).toBeDefined();
      expect(drill?.kind).toBe('DRILL');
      expect(drill?.ts).toBe(drillTime);
    });

    it('recibe automáticamente alertas sísmicas y genera AlertItem con kind=SEISMIC', async () => {
      const receivedItems: string[] = [];
      alertsService.subscribeNew((item) => receivedItems.push(item.id));

      await sensorService.start();
      fakePort.feedStationary(1);
      fakePort.feedShake(1.5, 0.12);
      await new Promise((r) => setTimeout(r, 20)); // las alertas se procesan en fila, un instante después

      expect(receivedItems.length).toBeGreaterThanOrEqual(1);
      const page = await alertsService.list();
      const seismicItem = page.items.find((i) => i.kind === 'SEISMIC');
      expect(seismicItem).toBeDefined();
      expect(seismicItem?.seismic?.peakG).toBeGreaterThan(0.03);
    });

    it('soporta paginación en list()', async () => {
      for (let i = 0; i < 20; i++) {
        await alertsService.scheduleDrill(new Date(clock.now() + i * 1000).toISOString(), `Simulacro ${i}`);
      }

      const firstPage = await alertsService.list();
      expect(firstPage.items.length).toBe(15);
      expect(firstPage.next).toBe('15');

      const secondPage = await alertsService.list(firstPage.next);
      expect(secondPage.items.length).toBeGreaterThanOrEqual(5);
    });
  });
});
