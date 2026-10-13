import { Linking } from 'react-native';
import { buildSmsUrl, EmergencySmsOptions } from '../../core/sync/sms';

/**
 * Lanzador de SMS prellenado que abre la aplicación de mensajería del sistema (Decisión D-25).
 */
export class SmsLauncher {
  /**
   * Abre la app de SMS del dispositivo con el texto y destinatario prellenados.
   * Retorna true si se pudo abrir, o false si el esquema sms: no es soportado.
   */
  static async openEmergencySms(options: EmergencySmsOptions): Promise<boolean> {
    const url = buildSmsUrl(options);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[SmsLauncher] No se pudo abrir la aplicación de SMS:', err);
      return false;
    }
  }
}
