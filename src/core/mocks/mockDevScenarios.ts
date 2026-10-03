import { DevScenario, DevScenarioController } from '../../contracts/dev';

export type ScenarioCallback = (activeScenarios: string[]) => void;

export class MockDevScenarioController implements DevScenarioController {
  private scenarios: DevScenario[] = [
    { id: 'sismo_detectado', title: 'Sismo Detectado', description: 'Simula sacudida de acelerómetro > 0.03g activando alerta sísmica inmediata' },
    { id: 'mesh_5_nodos', title: 'Malla con 5 Nodos', description: 'Simula 5 dispositivos cercanos con distintas gravedades y distancias' },
    { id: 'bluetooth_apagado', title: 'Bluetooth Apagado', description: 'Simula fallo BLUETOOTH_OFF al intentar escanear o emitir baliza' },
    { id: 'permisos_denegados', title: 'Permisos Denegados', description: 'Simula PERMISSION_DENIED en ubicación y notificaciones' },
    { id: 'contenido_corrupto', title: 'Contenido Corrupto', description: 'Simula fallo CONTENT_CORRUPT en paquete de guías educativas' },
    { id: 'sync_parcial', title: 'Sync Parcial', description: 'Simula timeout de red dejando reportes en cola de sincronización' },
    { id: 'socorrista_recibe_ficha', title: 'Socorrista Recibe Ficha', description: 'Emula llegada de ficha médica completa vía GATT de rescate' },
    { id: 'bateria_15', title: 'Batería 15% (Ahorro)', description: 'Fuerza modo lowPower con ráfagas espaciadas de baliza y flash' },
    { id: 'sin_sensores', title: 'Sin Acelerómetro', description: 'Simula hardware sin soporte de sensores de movimiento (NO_SENSORS)' },
    { id: 'sin_mapa_cacheado', title: 'Sin Mapa Cacheado', description: 'Simula ausencia de MBTiles locales activando estado MAP_NOT_CACHED' },
    { id: 'offline_total', title: 'Modo Avión / Offline Total', description: 'Desconecta toda interfaz de red simulando zona de catástrofe' },
  ];

  private activeIds: Set<string> = new Set();
  private listeners: ScenarioCallback[] = [];

  public list(): DevScenario[] {
    return [...this.scenarios];
  }

  public activate(id: string): void {
    if (this.activeIds.has(id)) {
      this.activeIds.delete(id);
    } else {
      this.activeIds.add(id);
    }
    this.notify();
  }

  public reset(): void {
    this.activeIds.clear();
    this.notify();
  }

  public active(): string[] {
    return Array.from(this.activeIds);
  }

  public isScenarioActive(id: string): boolean {
    return this.activeIds.has(id);
  }

  public subscribe(cb: ScenarioCallback): () => void {
    this.listeners.push(cb);
    cb(this.active());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    const list = this.active();
    this.listeners.forEach((l) => l(list));
  }
}
