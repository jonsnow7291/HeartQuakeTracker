import { RescuerService, ReceivedMedicalCard } from '../../contracts/rescuer';
import { Unsubscribe } from '../../contracts/types';
import { AppException } from '../../contracts/types';
import { ApiClient } from '../api/client';
import { MockRescuerService } from '../mocks/mockRescuer';
import { MockDevScenarioController } from '../mocks/mockDevScenarios';

export class HttpRescuerService implements RescuerService {
  private client: ApiClient;
  private fallback: MockRescuerService;
  private devController?: MockDevScenarioController;
  private authorized: boolean = false;
  private activeHashes: string[] = [];

  constructor(client: ApiClient, fallback?: MockRescuerService, devController?: MockDevScenarioController) {
    this.client = client;
    this.fallback = fallback || new MockRescuerService(devController);
    this.devController = devController;
  }

  public isRescuerModeAvailable(): boolean {
    return this.authorized || this.fallback.isRescuerModeAvailable();
  }

  public async enable(credential: { code: string }): Promise<void> {
    if (!credential || !credential.code) {
      throw new AppException('RECEIVER_NOT_AUTHORIZED', 'Código de socorrista requerido', false);
    }

    // Try online validation with Fastify backend
    try {
      const res = await this.client.verifyRescuer(credential.code);
      if (res.valid) {
        this.authorized = true;
        return;
      } else {
        throw new AppException('RECEIVER_NOT_AUTHORIZED', 'Código de socorrista inválido o expirado', false);
      }
    } catch (err: any) {
      if (err instanceof AppException && err.code === 'RECEIVER_NOT_AUTHORIZED') {
        throw err;
      }
      // If network is offline, attempt local/mock validation
      return this.fallback.enable(credential);
    }
  }

  public disable(): void {
    this.authorized = false;
    this.fallback.disable();
  }

  public subscribeReceived(cb: (c: ReceivedMedicalCard) => void): Unsubscribe {
    return this.fallback.subscribeReceived(cb);
  }

  public async listReceived(): Promise<ReceivedMedicalCard[]> {
    return this.fallback.listReceived();
  }
}
