import { SessionService } from './session';
import { PermissionsService } from './permissions';
import { MedicalProfileService } from './medical';
import { EmergencyService } from './emergency';
import { MeshService } from './mesh';
import { RescuerService } from './rescuer';
import { SensorService, AlertsService } from './sensors';
import { SyncService, ReportService } from './sync';
import { ContentService } from './content';
import { ProgressRepository } from './progress';
import { PoiService, TileService } from './map';
import { AidDirectoryService } from './aid';
import { PowerService } from './power';
import { DevScenarioController } from './dev';

export interface Services {
  session: SessionService;
  permissions: PermissionsService;
  medical: MedicalProfileService;
  emergency: EmergencyService;
  mesh: MeshService;
  rescuer: RescuerService;
  sensors: SensorService;
  alerts: AlertsService;
  sync: SyncService;
  reports: ReportService;
  content: ContentService;
  progress: ProgressRepository;
  poi: PoiService;
  tiles: TileService;
  aid: AidDirectoryService;
  power: PowerService;
  dev?: DevScenarioController;
}
