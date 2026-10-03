import { ContentService, GuideMeta, QuizBank } from '../../contracts/content';
import { ApiClient } from '../api/client';
import { MockContentService } from '../mocks/mockContent';
import { MockDevScenarioController } from '../mocks/mockDevScenarios';

export class HttpContentService implements ContentService {
  private client: ApiClient;
  private fallback: MockContentService;
  private devController?: MockDevScenarioController;

  constructor(client: ApiClient, fallback?: MockContentService, devController?: MockDevScenarioController) {
    this.client = client;
    this.fallback = fallback || new MockContentService(devController);
    this.devController = devController;
  }

  public async listGuides(): Promise<GuideMeta[]> {
    return this.fallback.listGuides();
  }

  public async getGuideMarkdown(id: string): Promise<string> {
    return this.fallback.getGuideMarkdown(id);
  }

  public async checkUpdates(): Promise<{ available: boolean; applied: boolean }> {
    if (this.devController?.isScenarioActive('offline_total')) {
      return { available: false, applied: false };
    }

    try {
      const manifest = await this.client.getContentManifest();
      if (manifest && manifest.version) {
        // Can check against local version
        return { available: false, applied: false };
      }
    } catch {
      // offline
    }
    return { available: false, applied: false };
  }

  public async getQuizBank(): Promise<QuizBank> {
    return this.fallback.getQuizBank();
  }
}
