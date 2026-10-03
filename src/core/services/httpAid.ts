import { AidDirectoryService, AidEntity, AidNeed } from '../../contracts/aid';
import { ApiClient } from '../api/client';
import { MockAidDirectoryService } from '../mocks/mockAid';
import { MockDevScenarioController } from '../mocks/mockDevScenarios';

export class HttpAidDirectoryService implements AidDirectoryService {
  private client: ApiClient;
  private fallback: MockAidDirectoryService;
  private devController?: MockDevScenarioController;

  private entitiesCache: AidEntity[] | null = null;
  private needsCache: AidNeed[] | null = null;

  constructor(client: ApiClient, fallback?: MockAidDirectoryService, devController?: MockDevScenarioController) {
    this.client = client;
    this.fallback = fallback || new MockAidDirectoryService();
    this.devController = devController;
  }

  public async listEntities(): Promise<AidEntity[]> {
    if (this.devController?.isScenarioActive('offline_total')) {
      return this.fallback.listEntities();
    }

    try {
      const res = await this.client.listAidEntities();
      if (res.items && res.items.length > 0) {
        this.entitiesCache = res.items;
        return this.entitiesCache;
      }
    } catch {
      // offline fallback
    }

    if (this.entitiesCache) return this.entitiesCache;
    return this.fallback.listEntities();
  }

  public async listNeeds(): Promise<AidNeed[]> {
    if (this.devController?.isScenarioActive('offline_total')) {
      return this.fallback.listNeeds();
    }

    try {
      const res = await this.client.listAidNeeds();
      if (res.items && res.items.length > 0) {
        this.needsCache = res.items;
        return this.needsCache;
      }
    } catch {
      // offline fallback
    }

    if (this.needsCache) return this.needsCache;
    return this.fallback.listNeeds();
  }
}
