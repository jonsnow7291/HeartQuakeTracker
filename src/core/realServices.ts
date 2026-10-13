import type { Services } from '../contracts/container';
import { ContentServiceImpl } from './content/ContentServiceImpl';
import { MedicalProfileServiceImpl } from './medical/MedicalProfileServiceImpl';
import type { BiometricPort, BundledContent, Clock, ContentRemote, CryptoPort, FileStore, KeyValueStore } from './platform/ports';
import { ProgressRepositoryImpl } from './progress/ProgressRepositoryImpl';
import { SessionServiceImpl } from './session/SessionServiceImpl';

export interface PlatformPorts {
  /** Keychain/Keystore: cuenta, intentos, clave biométrica. */
  secureStore: KeyValueStore;
  /** Almacén cifrado (SQLCipher): progreso, y ficha médica. */
  dataStore: KeyValueStore;
  files: FileStore;
  crypto: CryptoPort;
  biometric?: BiometricPort;
  bundledContent?: BundledContent;
  contentRemote?: ContentRemote;
  clock?: Clock;
  autoLockMs?: number;
}

/**
 * Arma los servicios REALES del núcleo: session, content, progress, medical.
 * El resto del container sigue en mocks hasta que se implementen sus respectivos paquetes.
 */
export function createRealCoreServices(p: PlatformPorts): Pick<Services, 'session' | 'content' | 'progress' | 'medical'> & { sessionImpl: SessionServiceImpl } {
  const sessionImpl = new SessionServiceImpl({ secureStore: p.secureStore, crypto: p.crypto, biometric: p.biometric, clock: p.clock, autoLockMs: p.autoLockMs });
  const content = new ContentServiceImpl({ files: p.files, state: p.dataStore, crypto: p.crypto, bundled: p.bundledContent, remote: p.contentRemote });
  const progress = new ProgressRepositoryImpl({
    store: p.dataStore,
    clock: p.clock,
    levels: async () => (await content.getQuizBank()).levels.map((l) => ({ id: l.id, order: l.order })),
  });
  const medical = new MedicalProfileServiceImpl({
    store: p.dataStore,
    session: sessionImpl,
    crypto: p.crypto,
    clock: p.clock,
  });
  return { session: sessionImpl, content, progress, medical, sessionImpl };
}
