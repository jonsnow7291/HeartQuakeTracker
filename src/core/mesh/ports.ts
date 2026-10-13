import { Unsubscribe } from '../../contracts/types';
import { MedicalCardWirePayload } from './types';

/** Callback cuando se recibe un paquete crudo escaneado por BLE. */
export type RawPacketHandler = (bytes: Uint8Array, rssi: number, deviceId: string) => void;

/** Puerto para emisión de baliza por Bluetooth Low Energy. */
export interface BleAdvertiserPort {
  startAdvertising(data: Uint8Array): Promise<void>;
  stopAdvertising(): Promise<void>;
  isAdvertising(): boolean;
}

/** Puerto para escaneo de dispositivos y paquetes de malla por Bluetooth Low Energy. */
export interface BleScannerPort {
  startScan(onPacket: RawPacketHandler): Promise<void>;
  stopScan(): Promise<void>;
  isScanning(): boolean;
}

/** Puerto para monitoreo del estado de la radio Bluetooth. */
export interface BluetoothStatePort {
  isBluetoothEnabled(): Promise<boolean>;
  subscribeBluetoothState(cb: (enabled: boolean) => void): Unsubscribe;
}

/** Puerto de intercambio de ficha médica por canal GATT de proximidad (RF-13). */
export interface GattExchangePort {
  serveMedicalCard(provider: () => MedicalCardWirePayload | null): Promise<void>;
  requestMedicalCard(deviceId: string): Promise<MedicalCardWirePayload | null>;
}

/** Reloj para temporización y pruebas deterministas. */
export interface MeshClock {
  now(): number;
}

export const defaultMeshClock: MeshClock = {
  now: () => Date.now(),
};
