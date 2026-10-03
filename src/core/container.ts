import { Services } from '../contracts/container';
import { ApiClient, ApiClientConfig } from './api/client';
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

// HTTP services integrated with Fastify backend
import { HttpPoiService, HttpTileService } from './services/httpMap';
import { HttpAidDirectoryService } from './services/httpAid';
import { HttpSyncService } from './services/httpSync';
import { HttpContentService } from './services/httpContent';
import { HttpRescuerService } from './services/httpRescuer';

export interface ContainerOptions {
  backendUrl?: string;
  useMocksOnly?: boolean;
  devController?: MockDevScenarioController;
}

export function createContainer(options: ContainerOptions = {}): Services {
  const dev = options.devController || new MockDevScenarioController();
  const session = new MockSessionService(dev);
  const permissions = new MockPermissionsService(dev);
  const medical = new MockMedicalProfileService(session);
  const emergency = new MockEmergencyService(permissions, dev);
  const mesh = new MockMeshService(dev);
  const sensors = new MockSensorService(dev);
  const alerts = new MockAlertsService(sensors, dev);
  const progress = new MockProgressRepository();
  const power = new MockPowerService(dev);

  // If pure mocks requested:
  if (options.useMocksOnly) {
    const rescuer = new MockRescuerService(dev);
    const sync = new MockSyncService(dev);
    const reports = new MockReportService(sync);
    const content = new MockContentService(dev);
    const poi = new MockPoiService();
    const tiles = new MockTileService(dev);
    const aid = new MockAidDirectoryService();

    return {
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

  // Connected to Fastify backend (with resilient offline fallbacks)
  const clientConfig: ApiClientConfig = {
    baseUrl: options.backendUrl || process.env.API_BASE_URL || 'http://localhost:3000',
  };
  const apiClient = new ApiClient(clientConfig);

  const mockPoi = new MockPoiService();
  const mockTile = new MockTileService(dev);
  const mockAid = new MockAidDirectoryService();
  const mockContent = new MockContentService(dev);
  const mockRescuer = new MockRescuerService(dev);

  const poi = new HttpPoiService(apiClient, mockPoi, dev);
  const tiles = new HttpTileService(apiClient, mockTile);
  const aid = new HttpAidDirectoryService(apiClient, mockAid, dev);
  const content = new HttpContentService(apiClient, mockContent, dev);
  const rescuer = new HttpRescuerService(apiClient, mockRescuer, dev);

  const syncService = new HttpSyncService(apiClient, dev);
  const sync = syncService;
  const reports = syncService;

  return {
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

class ServiceContainer {
  private static instance: Services | null = null;

  public static getServices(): Services {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = createContainer();
    }
    return ServiceContainer.instance;
  }
}

export function getServices(): Services {
  return ServiceContainer.getServices();
}
