import { GeoPoint, ISODate, Severity } from '../../contracts/types';

/**
 * Puerto de señalización de rescate física (RF-06, RNF-05).
 * Controla la linterna estroboscópica (4 Hz) y el tono acústico continuo (3 kHz).
 * En el dispositivo móvil se conecta a SignalingModule nativo (Kotlin/Swift).
 */
export interface SignalingPort {
  /** Inicia señalización física inmediata (flash + tono < 300 ms). */
  start(lowPower: boolean): Promise<void>;
  /** Detiene de inmediato la linterna y el audio. */
  stop(): Promise<void>;
  /** Ajusta el ciclo de trabajo según el modo de batería (lowPower <20%). */
  updateLowPower(lowPower: boolean): Promise<void>;
  /** Consulta si el dispositivo se encuentra silenciado. */
  isMuted?(): Promise<boolean>;
}

/**
 * Puerto del servicio en primer plano (Android Foreground Service).
 * Mantiene la ejecución en segundo plano y pantalla bloqueada con notificación persistente y WakeLock.
 */
export interface ForegroundServicePort {
  start(title: string, message: string): Promise<void>;
  stop(): Promise<void>;
}

/**
 * Puerto de geolocalización para registrar la posición al momento del pánico.
 */
export interface LocationPort {
  getCurrentPosition(): Promise<GeoPoint | undefined>;
}

/**
 * Registro estructurado del evento de emergencia para almacenamiento local persistente (JD-030).
 */
export interface EmergencyEventRecord {
  id: string;
  startedAt: ISODate;
  severity: Severity;
  position?: GeoPoint;
  lowPower: boolean;
  stoppedAt?: ISODate;
}
