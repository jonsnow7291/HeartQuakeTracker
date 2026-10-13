import * as Keychain from 'react-native-keychain';
import { AppException } from '../../contracts/types';
import type { BiometricPort, KeyValueStore } from '../../core/platform/ports';

export interface KeychainOptions {
  /** Prefijo opcional de servicio para aislar espacios de nombres en el Keychain. */
  servicePrefix?: string;
}

/**
 * Adaptador de almacén seguro sobre react-native-keychain (Keystore en Android / Keychain en iOS).
 * Implementa KeyValueStore para guardar de forma segura credenciales, salt y claves en el enclave seguro.
 */
export class KeychainSecureStore implements KeyValueStore {
  private readonly prefix: string;

  constructor(options: KeychainOptions = {}) {
    this.prefix = options.servicePrefix ?? 'eqt.sec.';
  }

  async get(key: string): Promise<string | null> {
    try {
      const service = this.serviceOf(key);
      const credentials = await Keychain.getGenericPassword({ service });
      if (!credentials) return null;
      return credentials.password;
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al leer del almacén seguro (${key}): ${String(err)}`);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const service = this.serviceOf(key);
      const res = await Keychain.setGenericPassword(key, value, {
        service,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      if (res === false) {
        throw new Error('Keychain devolvió false al intentar guardar la clave');
      }
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al escribir en almacén seguro (${key}): ${String(err)}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const service = this.serviceOf(key);
      await Keychain.resetGenericPassword({ service });
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al eliminar de almacén seguro (${key}): ${String(err)}`);
    }
  }

  async keys(prefix: string): Promise<string[]> {
    try {
      const allServices = await Keychain.getAllGenericPasswordServices();
      const targetPrefix = this.serviceOf(prefix);
      return allServices
        .filter((s) => s.startsWith(targetPrefix))
        .map((s) => s.substring(this.prefix.length));
    } catch (err) {
      throw new AppException('STORAGE_FAILED', `Error al listar claves en almacén seguro: ${String(err)}`);
    }
  }

  private serviceOf(key: string): string {
    return `${this.prefix}${key}`;
  }
}

/**
 * Adaptador BiometricPort sobre react-native-keychain para autenticación por huella / rostro.
 */
export class KeychainBiometricPort implements BiometricPort {
  async isAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch {
      return false;
    }
  }

  async authenticate(reason: string): Promise<boolean> {
    try {
      const canImply = await Keychain.canImplyAuthentication({
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      });
      if (!canImply) return false;
      return true;
    } catch {
      return false;
    }
  }
}
