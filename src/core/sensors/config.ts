/**
 * Configuración y umbrales de detección sísmica inercial (RF-09, D-18).
 * Calibrable y desacoplado del algoritmo de filtrado.
 */

export interface SensorThresholdConfig {
  /** Frecuencia de muestreo del acelerómetro en Hertz (50 Hz según D-18). */
  sampleRateHz: number;
  /** Frecuencia de corte del filtro paso-alto en Hertz (elimina gravedad continua de 1g). */
  highPassCutoffHz: number;
  /** Umbral de aceleración RMS en gravedades (0.03 g según D-18). */
  rmsThresholdG: number;
  /** Duración mínima continua sobre el umbral para disparar POSSIBLE (≥ 1000 ms según D-18). */
  durationThresholdMs: number;
  /** Mínimo de nodos independientes para elevar a CONFIRMED (≥ 3 según D-18 y RF-09). */
  quorumNodesNeeded: number;
  /** Ventana de tiempo para acumular quórum de nodos en milisegundos (10 s según D-18). */
  quorumWindowMs: number;
  /** Período refractario mínimo entre alertas locales para evitar saturación (ms). */
  minAlertCooldownMs: number;
}

export const DEFAULT_SENSOR_CONFIG: SensorThresholdConfig = {
  sampleRateHz: 50,
  highPassCutoffHz: 0.5,
  rmsThresholdG: 0.03,
  durationThresholdMs: 1000,
  quorumNodesNeeded: 3,
  quorumWindowMs: 10000,
  minAlertCooldownMs: 15000,
};
