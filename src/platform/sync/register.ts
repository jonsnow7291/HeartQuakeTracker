import type { Services } from '../../contracts/container';
import { SyncServiceImpl } from '../../core/sync/SyncServiceImpl';
import { ReportServiceImpl } from '../../core/sync/ReportServiceImpl';
import { ReactNativeNetworkPort } from './ReactNativeNetworkPort';
import { FetchHttpClientPort } from './FetchHttpClientPort';
import { SqliteKeyValueStore } from '../core/SqliteKeyValueStore';

/**
 * Registra los servicios reales del área de Sincronización y Reportes (RF-12, D-25).
 * - sync: SyncServiceImpl con cola persistente SQLite, detección de red y firma Ed25519.
 * - reports: ReportServiceImpl para reportes de daños y solicitudes de ayuda.
 */
export async function registerSync(_current: Services): Promise<Partial<Services>> {
  const store = new SqliteKeyValueStore({ name: 'eqt_sync_reports.db' });
  const network = new ReactNativeNetworkPort();
  const http = new FetchHttpClientPort();
  const sync = new SyncServiceImpl({ store, network, http });
  const reports = new ReportServiceImpl({ syncService: sync, store });

  return {
    sync,
    reports,
  };
}
