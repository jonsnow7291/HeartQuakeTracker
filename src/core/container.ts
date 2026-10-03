import { Services } from '../contracts/container';
import { MockDevScenarioController } from './mocks/mockDevScenarios';
import { MockSessionService } from './mocks/mockSession';
import { MockPermissionsService } from './mocks/mockPermissions';
import { MockMedicalProfileService } from './mocks/mockMedical';
import { MockEmergencyService } from './mocks/mockEmergency';
import { MockMeshService } from './mocks/mockMesh';
import { MockRescuerService } from './mocks/mockRescuer';
import { MockSensorService, MockAlertsService } from './mocks/mockSensors';
import { MockSyncService, MockReportService } from './mocks/mockSync';
import { MockContentService } from './mocks/mockContent';
import { MockProgressRepository } from './mocks/mockProgress';
import { MockPoiService, MockTileService } from './mocks/mockMap';
import { MockAidDirectoryService } from './mocks/mockAid';
import { MockPowerService } from './mocks/mockPower';

class ServiceContainer {
  private static instance: Services | null = null;

  public static getServices(): Services {
    if (!ServiceContainer.instance) {
      const dev = new MockDevScenarioController();
      const session = new MockSessionService(dev);
      const permissions = new MockPermissionsService(dev);
      const medical = new MockMedicalProfileService(session);
      const emergency = new MockEmergencyService(permissions, dev);
      const mesh = new MockMeshService(dev);
      const rescuer = new MockRescuerService(dev);
      const sensors = new MockSensorService(dev);
      const alerts = new MockAlertsService(sensors, dev);
      const sync = new MockSyncService(dev);
      const reports = new MockReportService(sync);
      const content = new MockContentService(dev);
      const progress = new MockProgressRepository();
      const poi = new MockPoiService();
      const tiles = new MockTileService(dev);
      const aid = new MockAidDirectoryService();
      const power = new MockPowerService(dev);

      ServiceContainer.instance = {
        session,
        permissions,
        medical,
        emergency,
        mesh,
        rescuer,
        sensors,
        alerts,
        sync,
        reports,
        content,
        progress,
        poi,
        tiles,
        aid,
        power,
        dev,
      };
    }

    return ServiceContainer.instance;
  }
}

export function getServices(): Services {
  return ServiceContainer.getServices();
}
