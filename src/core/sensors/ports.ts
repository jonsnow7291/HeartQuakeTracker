/**
 * Puertos de hardware para sensores inerciales (RF-09).
 */

export interface AccelerometerSample {
  /** Aceleración en eje X expresada en gravedades (g). */
  x: number;
  /** Aceleración en eje Y expresada en gravedades (g). */
  y: number;
  /** Aceleración en eje Z expresada en gravedades (g). */
  z: number;
  /** Marca de tiempo de la muestra en milisegundos (Date.now() / epoch). */
  timestamp: number;
}

export interface AccelerometerPort {
  /** Comprueba si el sensor inercial existe y está operativo en el dispositivo. */
  isAvailable(): Promise<boolean>;
  /** Inicia el flujo continuo de lecturas con la frecuencia solicitada en Hz. */
  start(sampleRateHz: number, onSample: (sample: AccelerometerSample) => void): Promise<void>;
  /** Detiene la adquisición de lecturas del acelerómetro. */
  stop(): void;
}
