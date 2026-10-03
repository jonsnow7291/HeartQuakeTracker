import { ProgressRepositoryImpl, UNLOCK_RATIO } from '../../src/core/progress/ProgressRepositoryImpl';
import type { QuizAttempt } from '../../src/contracts/progress';
import { FakeClock, MemoryKeyValueStore } from './support/nodePorts';

const LEVELS = [
  { id: 'n1', order: 1 },
  { id: 'n2', order: 2 },
  { id: 'n3', order: 3 },
];
const mk = (store = new MemoryKeyValueStore()) => ({ store, repo: new ProgressRepositoryImpl({ store, levels: async () => LEVELS, clock: new FakeClock() }) });
const attempt = (levelId: string, score: number, maxScore = 10, partial = false): QuizAttempt => ({ levelId, score, maxScore, answers: [], partial });

describe('ProgressRepository real (RF-02/03)', () => {
  it('estado inicial: solo el nivel 1 desbloqueado, nada completado', async () => {
    expect(await mk().repo.getLevelStatus()).toEqual([
      { levelId: 'n1', unlocked: true, bestScore: 0, completed: false },
      { levelId: 'n2', unlocked: false, bestScore: 0, completed: false },
      { levelId: 'n3', unlocked: false, bestScore: 0, completed: false },
    ]);
  });

  it(`desbloquea el siguiente nivel con ≥ ${UNLOCK_RATIO * 100} % (borde incluido)`, async () => {
    const { repo } = mk();
    await repo.saveAttempt(attempt('n1', 6)); // 60 %
    expect((await repo.getLevelStatus())[1]!.unlocked).toBe(false);
    await repo.saveAttempt(attempt('n1', 7)); // 70 % exacto
    const st = await repo.getLevelStatus();
    expect(st[0]).toMatchObject({ completed: true, bestScore: 7 });
    expect(st[1]!.unlocked).toBe(true);
    expect(st[2]!.unlocked).toBe(false);
  });

  it('conserva el mejor puntaje y no lo baja con un intento peor', async () => {
    const { repo } = mk();
    await repo.saveAttempt(attempt('n1', 9));
    await repo.saveAttempt(attempt('n1', 4));
    expect((await repo.getLevelStatus())[0]!.bestScore).toBe(9);
  });

  it('quiz parcial: se guarda, se reanuda y se descarta al terminar (RF-02 A1)', async () => {
    const { repo } = mk();
    expect(await repo.getPartial('n1')).toBeNull();
    await repo.saveAttempt({ ...attempt('n1', 3, 10, true), answers: [{ questionId: 'q1', chosen: 1, correct: true }] });
    const p = await repo.getPartial('n1');
    expect(p).toMatchObject({ partial: true, score: 3 });
    expect(p!.answers).toHaveLength(1);
    expect((await repo.getLevelStatus())[0]!.completed).toBe(false); // un parcial no completa el nivel
    await repo.saveAttempt(attempt('n1', 8));
    expect(await repo.getPartial('n1')).toBeNull();
  });

  it('PERSISTENCIA: otra instancia sobre el mismo almacén ve el 100 % del progreso (RF-03)', async () => {
    const a = mk();
    await a.repo.saveAttempt(attempt('n1', 8));
    await a.repo.saveAttempt({ ...attempt('n2', 2, 10, true) });
    await a.repo.awardBadge('NIVEL_1');
    const b = mk(a.store).repo; // "reabrir la app"
    expect((await b.getLevelStatus())[0]).toMatchObject({ completed: true, bestScore: 8 });
    expect(await b.getPartial('n2')).toMatchObject({ score: 2 });
    expect((await b.listBadges()).map((x) => x.code)).toEqual(['NIVEL_1']);
  });

  it('insignias: idempotentes, con fecha, y código desconocido → VALIDATION', async () => {
    const { repo } = mk();
    await repo.awardBadge('PRIMERA_GUIA');
    await repo.awardBadge('PRIMERA_GUIA');
    const b = await repo.listBadges();
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ code: 'PRIMERA_GUIA', title: 'Primera Guía Leída' });
    expect(b[0]!.awardedAt).toBeDefined();
    await expect(repo.awardBadge('INVENTADA')).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('valida los puntajes', async () => {
    const { repo } = mk();
    for (const a of [attempt('n1', -1), attempt('n1', 11), attempt('n1', 1, 0), attempt('', 1)]) {
      await expect(repo.saveAttempt(a)).rejects.toMatchObject({ code: 'VALIDATION' });
    }
  });

  it('resetAll borra todo el progreso (A.8.10) y no toca otras claves', async () => {
    const { repo, store } = mk();
    await repo.saveAttempt(attempt('n1', 9));
    await repo.awardBadge('PERFECTO');
    await store.set('session.account', 'x');
    await repo.resetAll();
    expect((await repo.getLevelStatus())[0]).toMatchObject({ completed: false });
    expect(await repo.listBadges()).toEqual([]);
    expect(await store.get('session.account')).toBe('x');
  });

  it('fallo de escritura: reintenta y se recupera; si persiste → STORAGE_FAILED (RF-03 A1)', async () => {
    const { repo, store } = mk();
    store.failNextSets = 2; // 2 fallos, reintentos = 2 → la 3.ª escritura funciona
    await repo.saveAttempt(attempt('n1', 8));
    expect((await repo.getLevelStatus())[0]!.completed).toBe(true);
    store.failNextSets = 10;
    await expect(repo.saveAttempt(attempt('n1', 9))).rejects.toMatchObject({ code: 'STORAGE_FAILED' });
  });

  it('niveles fuera de orden se ordenan por `order`', async () => {
    const store = new MemoryKeyValueStore();
    const repo = new ProgressRepositoryImpl({ store, levels: async () => [{ id: 'b', order: 2 }, { id: 'a', order: 1 }] });
    expect((await repo.getLevelStatus()).map((s) => s.levelId)).toEqual(['a', 'b']);
  });
});
