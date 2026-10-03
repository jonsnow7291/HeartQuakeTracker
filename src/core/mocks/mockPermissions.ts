import { PermissionsService, PermissionKind, PermissionStatus } from '../../contracts/permissions';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockPermissionsService implements PermissionsService {
  private devController?: MockDevScenarioController;

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;
  }

  public async status(kind: PermissionKind): Promise<PermissionStatus> {
    if (this.devController?.isScenarioActive('permisos_denegados')) {
      if (kind === 'location' || kind === 'notifications') return 'denied';
    }
    if (this.devController?.isScenarioActive('bluetooth_apagado')) {
      if (kind === 'bluetooth') return 'denied';
    }
    return 'granted';
  }

  public async request(kind: PermissionKind): Promise<PermissionStatus> {
    return this.status(kind);
  }

  public async missingForEmergency(): Promise<PermissionKind[]> {
    const missing: PermissionKind[] = [];
    const bStatus = await this.status('bluetooth');
    if (bStatus !== 'granted') missing.push('bluetooth');

    const lStatus = await this.status('location');
    if (lStatus !== 'granted') missing.push('location');

    return missing;
  }

  public async openSettings(): Promise<void> {
    console.log('[MockPermissionsService] openSettings invoked');
  }
}
