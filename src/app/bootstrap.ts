import type { Services } from '../contracts/container';
import { getServices, registerRealServices } from '../core/container';

/**
 * Composición de la app: parte de los mocks del container y sustituye cada servicio por su
 * implementación real a medida que existe. Cada paquete de trabajo añade UNA entrada en `REGISTRARS`
 * (import + línea). Un registrar nunca debe tumbar la app: si falla se registra el error y queda el mock.
 *
 * Convención: `src/platform/<area>/register.ts` exporta `register<Area>(current: Services): Promise<Partial<Services>>`.
 */
type Registrar = { name: string; run: (current: Services) => Promise<Partial<Services>> };

// --- imports de registrars (uno por área; añadir debajo) ---
import { registerCore } from '../platform/core/register';
import { registerPoi } from '../platform/poi/register';
import { registerMesh } from '../platform/mesh/register';
import { registerSensors } from '../platform/sensors/register';
import { registerSync } from '../platform/sync/register';
import { registerEmergency } from '../platform/emergency/register';

// El orden importa: 'core', 'sync' y 'sensors' no dependen de nadie; 'emergency' va antes que 'mesh' porque la
// malla se suscribe a la emergencia real (y la emergencia usa malla/reportes/ficha por referencia perezosa).
const REGISTRARS: Registrar[] = [
  { name: 'core', run: registerCore },
  { name: 'sync', run: registerSync },
  { name: 'sensors', run: registerSensors },
  { name: 'poi', run: registerPoi },
  { name: 'emergency', run: registerEmergency },
  { name: 'mesh', run: registerMesh },
];

export async function initServices(): Promise<Services> {
  const services = getServices();
  for (const r of REGISTRARS) {
    try {
      registerRealServices(await r.run(services));
    } catch (err) {
      console.warn(`[bootstrap] ${r.name} no disponible, se mantiene el mock:`, err);
    }
  }
  return services;
}
