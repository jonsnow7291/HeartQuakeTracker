import type { AccelerometerSample } from './ports';
import type { SensorThresholdConfig } from './config';

/**
 * Filtro paso-alto digital IIR de 1er orden por eje.
 * Elimina la aceleración gravitacional estática (1g) y derivas lentas de inclinación.
 * Ecuación: y[k] = α * (y[k-1] + x[k] - x[k-1])
 * Donde α = 1 / (1 + 2 * π * fc * Δt)
 */
export class HighPassFilterAxis {
  private alpha: number;
  private prevRaw = 0;
  private prevFiltered = 0;
  private initialized = false;

  constructor(cutoffHz: number, sampleRateHz: number) {
    const dt = 1 / Math.max(sampleRateHz, 1);
    const rc = 1 / (2 * Math.PI * cutoffHz);
    this.alpha = rc / (rc + dt);
  }

  process(raw: number): number {
    if (!this.initialized) {
      this.prevRaw = raw;
      this.prevFiltered = 0;
      this.initialized = true;
      return 0;
    }
    const filtered = this.alpha * (this.prevFiltered + raw - this.prevRaw);
    this.prevRaw = raw;
    this.prevFiltered = filtered;
    return filtered;
  }

  reset(): void {
    this.prevRaw = 0;
    this.prevFiltered = 0;
    this.initialized = false;
  }
}

/**
 * Filtro 3D que procesa los ejes X, Y, Z y calcula la magnitud dinámica.
 */
export class HighPassFilter3D {
  private filterX: HighPassFilterAxis;
  private filterY: HighPassFilterAxis;
  private filterZ: HighPassFilterAxis;

  constructor(cutoffHz: number, sampleRateHz: number) {
    this.filterX = new HighPassFilterAxis(cutoffHz, sampleRateHz);
    this.filterY = new HighPassFilterAxis(cutoffHz, sampleRateHz);
    this.filterZ = new HighPassFilterAxis(cutoffHz, sampleRateHz);
  }

  process(sample: AccelerometerSample): { dynamicG: number; x: number; y: number; z: number } {
    const x = this.filterX.process(sample.x);
    const y = this.filterY.process(sample.y);
    const z = this.filterZ.process(sample.z);
    const dynamicG = Math.sqrt(x * x + y * y + z * z);
    return { dynamicG, x, y, z };
  }

  reset(): void {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}

export interface SeismicDetectionResult {
  /** Indica si se detectó una sacudida que supera el umbral continuo. */
  detected: boolean;
  /** Valor RMS actual de la ventana deslizante (en g). */
  currentRmsG: number;
  /** Pico de aceleración dinámica observado en la ventana activa (en g). */
  peakG: number;
  /** Duración de la sacudida continua observada en milisegundos. */
  activeDurationMs: number;
}

/**
 * Detector de sacudidas sísmicas por ventana deslizante RMS (RF-09, D-18).
 * Requiere:
 * 1. RMS dinámico ≥ rmsThresholdG (0.03 g).
 * 2. Duración de sacudida activa ≥ durationThresholdMs (1000 ms).
 * 3. Patrón oscilatorio con cruces por cero (≥ 3 en 1 s) para descartar caídas/golpes secos (< 1 s).
 */
export class SeismicSignalDetector {
  private readonly filter: HighPassFilter3D;
  private readonly windowSize: number;
  private readonly buffer: number[];
  private bufferIndex = 0;
  private bufferCount = 0;
  private sumSquares = 0;
  private peakG = 0;

  private firstActiveTime = 0;
  private lastActiveTime = 0;
  private quietSinceTime = 0;

  private prevAxisVal = 0;
  private zeroCrossingsWindow: number[];
  private zeroCrossingsIndex = 0;

  constructor(private readonly config: SensorThresholdConfig) {
    this.filter = new HighPassFilter3D(config.highPassCutoffHz, config.sampleRateHz);
    this.windowSize = Math.max(5, Math.round((config.sampleRateHz * config.durationThresholdMs) / 1000));
    this.buffer = new Array<number>(this.windowSize).fill(0);
    this.zeroCrossingsWindow = new Array<number>(this.windowSize).fill(0);
  }

  processSample(sample: AccelerometerSample): SeismicDetectionResult {
    const { dynamicG, x, y, z } = this.filter.process(sample);
    const ts = sample.timestamp || Date.now();

    // Actualizar ventana deslizante RMS
    const oldVal = this.buffer[this.bufferIndex] ?? 0;
    this.sumSquares = Math.max(0, this.sumSquares - oldVal * oldVal + dynamicG * dynamicG);
    this.buffer[this.bufferIndex] = dynamicG;

    // Detección de cruces por cero del eje dominante (oscilación sísmica)
    const primaryAxis = Math.abs(x) >= Math.abs(y) && Math.abs(x) >= Math.abs(z) ? x : Math.abs(y) >= Math.abs(z) ? y : z;
    const isZeroCrossing = (this.prevAxisVal > 0 && primaryAxis < 0) || (this.prevAxisVal < 0 && primaryAxis > 0);
    this.prevAxisVal = primaryAxis;
    this.zeroCrossingsWindow[this.bufferIndex] = isZeroCrossing ? 1 : 0;

    this.bufferIndex = (this.bufferIndex + 1) % this.windowSize;
    if (this.bufferCount < this.windowSize) {
      this.bufferCount++;
    }

    const currentRmsG = Math.sqrt(this.sumSquares / this.bufferCount);
    const totalZeroCrossings = this.zeroCrossingsWindow.reduce((acc, v) => acc + v, 0);

    if (dynamicG > this.peakG) {
      this.peakG = dynamicG;
    }

    // Monitoreo de vibración activa continua
    const isActiveVibration = dynamicG >= this.config.rmsThresholdG * 0.7;

    if (isActiveVibration) {
      if (this.firstActiveTime === 0 || ts - this.lastActiveTime > 400) {
        this.firstActiveTime = ts;
      }
      this.lastActiveTime = ts;
      this.quietSinceTime = 0;
    } else {
      if (this.lastActiveTime > 0) {
        if (this.quietSinceTime === 0) {
          this.quietSinceTime = ts;
        } else if (ts - this.quietSinceTime > 400) {
          this.firstActiveTime = 0;
          this.lastActiveTime = 0;
          this.quietSinceTime = 0;
          this.peakG = Math.max(currentRmsG, this.peakG * 0.9);
        }
      }
    }

    const activeDurationMs = this.firstActiveTime > 0 && this.lastActiveTime >= this.firstActiveTime
      ? this.lastActiveTime - this.firstActiveTime
      : 0;

    // Se confirma detección si el RMS supera 0.03g, duró ≥ durationThresholdMs y tiene oscilación periódica (≥ 3 cruces)
    const detected =
      currentRmsG >= this.config.rmsThresholdG &&
      activeDurationMs >= this.config.durationThresholdMs &&
      totalZeroCrossings >= 3;

    return {
      detected,
      currentRmsG,
      peakG: Number(this.peakG.toFixed(4)),
      activeDurationMs,
    };
  }

  reset(): void {
    this.filter.reset();
    this.buffer.fill(0);
    this.zeroCrossingsWindow.fill(0);
    this.bufferIndex = 0;
    this.bufferCount = 0;
    this.sumSquares = 0;
    this.peakG = 0;
    this.firstActiveTime = 0;
    this.lastActiveTime = 0;
    this.quietSinceTime = 0;
    this.prevAxisVal = 0;
  }
}
