import { RescuerCodeAuthority, type RescuerTrust, type SignedRescuerList } from '../../core/rescuer/RescuerCodeAuthority';
import { ReactNativeFileStore } from '../core/ReactNativeFileStore';
import { utf8, fromUtf8 } from '../../core/util/bytes';
import trust from '../../core/rescuer/trust.json';

const STORED = 'rescuer/list.json';
const DEFAULT_SERVER_URL = 'http://localhost:3000';

/**
 * Autoridad de códigos de socorrista de la app (D-06): lista firmada incluida en la compilación + la última
 * lista descargada del servidor (si es más nueva y su firma es válida). Valida SIN conexión.
 * Los códigos en claro de desarrollo solo existen en compilaciones __DEV__.
 */
export async function createRescuerAuthority(serverUrl: string = DEFAULT_SERVER_URL): Promise<RescuerCodeAuthority> {
  const devCodes = __DEV__ ? ['RESCUER-OFFLINE-TEST'] : [];
  const authority = new RescuerCodeAuthority(trust as RescuerTrust, undefined, devCodes);
  const files = new ReactNativeFileStore();

  // 1) Lista incluida en la app.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundled = require('../../../assets/bundle/rescuer/list.json') as SignedRescuerList;
    const why = authority.load(bundled);
    if (why) console.warn('[Rescuer] la lista incluida en la app no es válida:', why);
  } catch (e) {
    console.warn('[Rescuer] sin lista incluida:', e);
  }

  // 2) Última lista descargada (se acepta solo si su firma y antigüedad son correctas).
  try {
    const raw = await files.read(STORED);
    if (raw) authority.load(JSON.parse(fromUtf8(raw)) as SignedRescuerList);
  } catch {
    // sin lista guardada o ilegible: se queda con la incluida
  }

  // 3) Actualización en segundo plano cuando hay red; nunca bloquea ni rompe el arranque.
  void (async () => {
    try {
      const res = await fetch(`${serverUrl}/v1/rescuer/list`);
      if (!res.ok) return;
      const list = (await res.json()) as SignedRescuerList;
      if (authority.load(list) === null) await files.write(STORED, utf8(JSON.stringify(list)));
    } catch {
      // sin red: se conserva la lista actual
    }
  })();

  return authority;
}
