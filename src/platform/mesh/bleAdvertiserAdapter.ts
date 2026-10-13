import { NativeModules } from 'react-native';
import { BleAdvertiserPort } from '../../core/mesh/ports';
import { bytesToBase64 } from './base64';

export const EQTR_MANUFACTURER_ID = 0xea74; // Identificador de fabricante asignado al protocolo

interface NativeAdvertiserModule {
  startAdvertising(manufacturerId: number, payloadBase64: string): Promise<boolean>;
  stopAdvertising(): Promise<boolean>;
  isAdvertising(): Promise<boolean>;
}

export class NativeBleAdvertiserAdapter implements BleAdvertiserPort {
  private advertising = false;
  private readonly nativeModule: NativeAdvertiserModule | null;

  constructor() {
    this.nativeModule = (NativeModules.BleAdvertiser as NativeAdvertiserModule) || null;
  }

  public async startAdvertising(data: Uint8Array): Promise<void> {
    const b64 = bytesToBase64(data);
    this.advertising = true;

    if (this.nativeModule?.startAdvertising) {
      try {
        await this.nativeModule.startAdvertising(EQTR_MANUFACTURER_ID, b64);
      } catch (err) {
        this.advertising = false;
        throw err;
      }
    }
  }

  public async stopAdvertising(): Promise<void> {
    this.advertising = false;

    if (this.nativeModule?.stopAdvertising) {
      try {
        await this.nativeModule.stopAdvertising();
      } catch {}
    }
  }

  public isAdvertising(): boolean {
    return this.advertising;
  }
}
