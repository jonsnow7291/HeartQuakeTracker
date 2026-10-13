import type { Services } from '../../contracts/container';
import { SensorServiceImpl } from '../../core/sensors/SensorServiceImpl';
import { AlertsServiceImpl } from '../../core/sensors/AlertsServiceImpl';
import { ReactNativeAccelerometerPort } from './ReactNativeAccelerometerPort';
import { SqliteKeyValueStore } from '../core/SqliteKeyValueStore';

/**
 * Registra los servicios reales del área de Sensores y Alertas (RF-09, D-18).
 * - sensors: SensorServiceImpl con acelerómetro nativo a 50 Hz y quórum de 3 nodos.
 * - alerts: AlertsServiceImpl con almacenamiento local persistente en SQLite.
 */
export async function registerSensors(_current: Services): Promise<Partial<Services>> {
  const store = new SqliteKeyValueStore({ name: 'eqt_sensors_alerts.db' });
  const accelerometer = new ReactNativeAccelerometerPort();
  const sensors = new SensorServiceImpl({ accelerometer });
  const alerts = new AlertsServiceImpl({ sensorService: sensors, store });

  // La detección debe correr desde el arranque (RF-09): sin esto el acelerómetro nunca se activaba.
  sensors.start().catch((err) => {
    console.warn('[Sensors] no se pudo iniciar la lectura del acelerómetro:', err);
  });

  return {
    sensors,
    alerts,
  };
}
