import type { Services } from '../../contracts/container';
import { createRealCoreServices } from '../../core/realServices';
import { BundledContentLoader } from './BundledContentLoader';
import { KeychainBiometricPort, KeychainSecureStore } from './KeychainSecureStore';
import { NobleCryptoPort } from './NobleCryptoPort';
import { argon2idNative } from './NativeArgon2';
import { ReactNativeFileStore } from './ReactNativeFileStore';
import { SqliteKeyValueStore } from './SqliteKeyValueStore';
import { attachChecklistPersistence } from '../../ui/features/checklists/useChecklists';

/**
 * Registra los servicios reales del paquete P1 (Datos y seguridad):
 * - session: SessionServiceImpl (Keychain + Noble Argon2id + Biometría)
 * - content: ContentServiceImpl (BundledContent + FileStore + SHA-256)
 * - progress: ProgressRepositoryImpl (SqliteKeyValueStore cifrado)
 * - medical: MedicalProfileServiceImpl (SQLCipher + AES-256-GCM / XChaCha)
 */
export async function registerCore(_current: Services): Promise<Partial<Services>> {
  const secureStore = new KeychainSecureStore();
  const biometric = new KeychainBiometricPort();
  const dataStore = new SqliteKeyValueStore({ name: 'eqt_secure_data.db' });
  const files = new ReactNativeFileStore();
  const crypto = new NobleCryptoPort({ nativeArgon2: argon2idNative });
  const bundledContent = new BundledContentLoader();

  await attachChecklistPersistence(dataStore);

  const real = createRealCoreServices({
    secureStore,
    dataStore,
    files,
    crypto,
    biometric,
    bundledContent,
  });

  return {
    session: real.session,
    content: real.content,
    progress: real.progress,
    medical: real.medical,
  };
}
