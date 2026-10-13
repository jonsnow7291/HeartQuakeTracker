import { Share } from 'react-native';
import type { GeoPoint } from '../../../contracts/types';
import { buildStatusMessage } from '../../../core/util/statusMessage';

/** Compartir el estado con la hoja nativa (WhatsApp, SMS, correo…). El mensaje se arma en core/util/statusMessage. */
/** Abre la hoja de compartir. Devuelve false si el usuario la cerró sin compartir o si falló. */
export async function shareStatus(kind: 'SAFE' | 'HELP', position?: GeoPoint): Promise<boolean> {
  try {
    const result = await Share.share({ message: buildStatusMessage(kind, position) });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
