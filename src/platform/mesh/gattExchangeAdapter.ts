import { GattExchangePort } from '../../core/mesh/ports';
import { MedicalCardWirePayload } from '../../core/mesh/types';

/**
 * Adaptador de canal GATT de proximidad para intercambio de fichas médicas (RF-13).
 */
export class PlatformGattExchangeAdapter implements GattExchangePort {
  private localCardProvider: (() => MedicalCardWirePayload | null) | null = null;
  // Caché de fichas servidas por dispositivos descubiertos
  private readonly deviceCardMap = new Map<string, MedicalCardWirePayload>();

  public async serveMedicalCard(provider: () => MedicalCardWirePayload | null): Promise<void> {
    this.localCardProvider = provider;
  }

  public async requestMedicalCard(deviceId: string): Promise<MedicalCardWirePayload | null> {
    // Si el dispositivo tiene una ficha registrada en la sesión de proximidad
    if (this.deviceCardMap.has(deviceId)) {
      return this.deviceCardMap.get(deviceId) ?? null;
    }

    // Si coincide con el proveedor local (p. ej. pruebas o loopback local)
    if (this.localCardProvider) {
      return this.localCardProvider();
    }

    return null;
  }

  /**
   * Registra una ficha médica recibida de un dispositivo por canal de proximidad.
   */
  public registerDeviceCard(deviceId: string, payload: MedicalCardWirePayload): void {
    this.deviceCardMap.set(deviceId, payload);
  }
}
