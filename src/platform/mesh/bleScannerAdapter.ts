import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import { BleScannerPort, BluetoothStatePort, RawPacketHandler } from '../../core/mesh/ports';
import { Unsubscribe } from '../../contracts/types';
import { base64ToBytes } from './base64';
import { EQTR_MANUFACTURER_ID } from './bleAdvertiserAdapter';

export class BlePlxScannerAdapter implements BleScannerPort, BluetoothStatePort {
  private bleManager: BleManager | null = null;
  private scanning = false;
  private onPacketCallback: RawPacketHandler | null = null;
  private stateSub: Subscription | null = null;

  constructor() {
    try {
      this.bleManager = new BleManager();
    } catch {
      this.bleManager = null;
    }
  }

  public async startScan(onPacket: RawPacketHandler): Promise<void> {
    this.onPacketCallback = onPacket;
    this.scanning = true;

    if (!this.bleManager) return;

    try {
      this.bleManager.startDeviceScan(
        null, // Escanear todos los UUIDs
        { allowDuplicates: true },
        (error, device) => {
          if (error || !device) return;
          this.handleScannedDevice(device);
        },
      );
    } catch (err) {
      this.scanning = false;
      throw err;
    }
  }

  public async stopScan(): Promise<void> {
    this.scanning = false;
    this.onPacketCallback = null;

    if (this.bleManager) {
      try {
        this.bleManager.stopDeviceScan();
      } catch {}
    }
  }

  public isScanning(): boolean {
    return this.scanning;
  }

  public async isBluetoothEnabled(): Promise<boolean> {
    if (!this.bleManager) return false;
    try {
      const state = await this.bleManager.state();
      return state === State.PoweredOn;
    } catch {
      return false;
    }
  }

  public subscribeBluetoothState(cb: (enabled: boolean) => void): Unsubscribe {
    if (!this.bleManager) {
      cb(false);
      return () => {};
    }

    try {
      this.stateSub = this.bleManager.onStateChange((state) => {
        cb(state === State.PoweredOn);
      }, true);
    } catch {
      cb(false);
    }

    return () => {
      if (this.stateSub) {
        this.stateSub.remove();
        this.stateSub = null;
      }
    };
  }

  private handleScannedDevice(device: Device): void {
    if (!this.onPacketCallback) return;

    const rssi = device.rssi ?? -70;

    // 1. Probar datos de fabricante (Manufacturer Data)
    if (device.manufacturerData) {
      const bytes = base64ToBytes(device.manufacturerData);
      if (bytes.length >= 28) {
        // Los primeros 2 bytes son el Company ID en Little-Endian
        const b0 = bytes[0] ?? 0;
        const b1 = bytes[1] ?? 0;
        const companyId = b0 | (b1 << 8);
        if (companyId === EQTR_MANUFACTURER_ID) {
          this.onPacketCallback(bytes.subarray(2), rssi, device.id);
          return;
        }
      } else if (bytes.length >= 26) {
        // Paquete crudo sin cabecera de compañía
        this.onPacketCallback(bytes, rssi, device.id);
        return;
      }
    }

    // 2. Probar datos de servicio (Service Data)
    if (device.serviceData) {
      for (const serviceUuid in device.serviceData) {
        const b64Data = device.serviceData[serviceUuid];
        if (b64Data) {
          const bytes = base64ToBytes(b64Data);
          if (bytes.length >= 26) {
            this.onPacketCallback(bytes, rssi, device.id);
            return;
          }
        }
      }
    }
  }
}
