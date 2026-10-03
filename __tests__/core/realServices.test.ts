import { join } from 'node:path';
import { getServices, registerRealServices } from '../../src/core/container';
import { createRealCoreServices } from '../../src/core/realServices';
import { MemoryFileStore, MemoryKeyValueStore, nodeCrypto, packageFromRepoContent } from './support/nodePorts';

// Cableado completo con el contenido REAL de Santiago: container → servicios reales → persistencia.
describe('servicios reales registrados en el container', () => {
  const ports = () => ({
    secureStore: new MemoryKeyValueStore(),
    dataStore: new MemoryKeyValueStore(),
    files: new MemoryFileStore(),
    crypto: nodeCrypto,
    bundledContent: { load: async () => packageFromRepoContent(join(__dirname, '..', '..', 'content')) },
  });

  it('session, content y progress dejan de ser mocks y trabajan juntos', async () => {
    const p = ports();
    const mockSession = getServices().session;
    const s = registerRealServices(createRealCoreServices(p));
    expect(s.session).not.toBe(mockSession);
    expect(s.emergency).toBeDefined(); // el resto sigue siendo mock

    await s.session.createLocalAccount({ displayName: 'Ana', pin: '654321', acceptTerms: true });
    const guides = await s.content.listGuides();
    expect(guides.length).toBeGreaterThan(0);

    // Los niveles del progreso salen del banco de preguntas REAL de Santiago.
    const levels = await s.progress.getLevelStatus();
    const bank = await s.content.getQuizBank();
    expect(levels.map((l) => l.levelId)).toEqual(bank.levels.map((l) => l.id));
    expect(levels[0]!.unlocked).toBe(true);
    await s.progress.saveAttempt({ levelId: levels[0]!.levelId, score: 8, maxScore: 10, answers: [], partial: false });
    expect((await s.progress.getLevelStatus())[0]).toMatchObject({ completed: true, bestScore: 8 });
  });
});
