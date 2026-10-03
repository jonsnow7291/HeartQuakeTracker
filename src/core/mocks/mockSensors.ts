import {
  SensorService,
  AlertsService,
  SeismicAlert,
  AlertItem,
} from '../../contracts/sensors';
import { Unsubscribe, Page } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockSensorService implements SensorService {
  private devController?: MockDevScenarioController;
  private listeners: ((a: SeismicAlert) => void)[] = [];
  private active: boolean = false;

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;

    if (this.devController) {
      this.devController.subscribe((scenarios) => {
        if (scenarios.includes('sismo_detectado')) {
          this.triggerAlert({
            id: `seis_${Date.now()}`,
            ts: new Date().toISOString(),
            level: 'CONFIRMED',
            peakG: 0.12,
            quorumNodes: 4,
            note: 'Detección por acelerómetro + quórum de 4 nodos en Bogotá.',
          });
        }
      });
    }
  }

  public isAvailable(): boolean {
    if (this.devController?.isScenarioActive('sin_sensores')) return false;
    return true;
  }

  public async start(): Promise<void> {
    this.active = true;
  }

  public stop(): void {
    this.active = false;
  }

  public subscribe(cb: (a: SeismicAlert) => void): Unsubscribe {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public triggerAlert(alert: SeismicAlert): void {
    this.listeners.forEach((l) => l(alert));
  }
}

export class MockAlertsService implements AlertsService {
  private devController?: MockDevScenarioController;
  private sensorService: MockSensorService;
  private alerts: AlertItem[] = [
    {
      id: 'alt_001',
      kind: 'DRILL',
      title: 'Simulacro Distrital de Evacuación',
      body: 'Programado por IDIGER para el jueves a las 10:00 AM.',
      ts: new Date().toISOString(),
    },
  ];
  private listeners: ((a: AlertItem) => void)[] = [];

  constructor(sensorService: MockSensorService, devController?: MockDevScenarioController) {
    this.sensorService = sensorService;
    this.devController = devController;

    this.sensorService.subscribe((seismic) => {
      const item: AlertItem = {
        id: `alt_${Date.now()}`,
        kind: 'SEISMIC',
        title: '¡ALERTA SÍSMICA CONFIRMADA!',
        body: `Aceleración detectada: ${seismic.peakG}g. Validador por quórum de ${seismic.quorumNodes} teléfonos.`,
        ts: seismic.ts,
        seismic,
      };
      this.alerts.unshift(item);
      this.listeners.forEach((l) => l(item));
    });
  }

  public async list(): Promise<Page<AlertItem>> {
    return { items: [...this.alerts] };
  }

  public subscribeNew(cb: (a: AlertItem) => void): Unsubscribe {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async scheduleDrill(at: string, title: string): Promise<void> {
    const item: AlertItem = {
      id: `drill_${Date.now()}`,
      kind: 'DRILL',
      title,
      body: `Simulacro familiar agendado para ${at}`,
      ts: at,
    };
    this.alerts.unshift(item);
    this.listeners.forEach((l) => l(item));
  }
}
