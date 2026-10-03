import type { Services } from '../contracts/container';
import { ContentServiceImpl } from './content/ContentServiceImpl';
import type { BiometricPort, BundledContent, Clock, ContentRemote, CryptoPort, FileStore, KeyValueStore } from './platform/ports';
import { ProgressRepositoryImpl } from './progress/ProgressRepositoryImpl';
import { SessionServiceImpl } from './session/SessionServiceImpl';

export interface PlatformPorts {
  /** Keychain/Keystore: cuenta, intentos, clave biométrica. */
  secureStore: KeyValueStore;
  /** Almacén cifrado (SQLCipher): progreso, y luego ficha médica. */
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
 * Arma los servicios REALES disponibles hoy (oleadas O1 parcial y O3): session, content, progress.
 * El resto del container sigue en mocks hasta que se implementen. Uso en el arranque de la app:
 *
 *   registerRealServices(createRealCoreServices(ports));
 */
export function createRealCoreServices(p: PlatformPorts): Pick<Services, 'session' | 'content' | 'progress'> & { sessionImpl: SessionServiceImpl } {
  const sessionImpl = new SessionServiceImpl({ secureStore: p.secureStore, crypto: p.crypto, biometric: p.biometric, clock: p.clock, autoLockMs: p.autoLockMs });
  const content = new ContentServiceImpl({ files: p.files, state: p.dataStore, crypto: p.crypto, bundled: p.bundledContent, remote: p.contentRemote });
  const progress = new ProgressRepositoryImpl({
    store: p.dataStore,
    clock: p.clock,
    levels: async () => (await content.getQuizBank()).levels.map((l) => ({ id: l.id, order: l.order })),
  });
  return { session: sessionImpl, content, progress, sessionImpl };
}
