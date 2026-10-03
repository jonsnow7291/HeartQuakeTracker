export interface DevScenario {
  id: string;
  title: string;
  description: string;
}

export interface DevScenarioController {
  list(): DevScenario[];
  activate(id: string): void; // p. ej. 'sismo_detectado', 'mesh_5_nodos', 'bluetooth_apagado'
  reset(): void;
  active(): string[];
}
