import {
  ProgressRepository,
  QuizAttempt,
  LevelStatus,
  Badge,
} from '../../contracts/progress';

export class MockProgressRepository implements ProgressRepository {
  private attempts: Map<string, QuizAttempt> = new Map();
  private badges: Map<string, Badge> = new Map([
    { code: 'PRIMERA_GUIA', title: 'Primera Guía Leída', awardedAt: new Date().toISOString() },
  ]);

  public async saveAttempt(a: QuizAttempt): Promise<void> {
    this.attempts.set(a.levelId, { ...a });
  }

  public async getPartial(levelId: string): Promise<QuizAttempt | null> {
    const attempt = this.attempts.get(levelId);
    if (attempt && attempt.partial) {
      return { ...attempt };
    }
    return null;
  }

  public async getLevelStatus(): Promise<LevelStatus[]> {
    return [
      {
        levelId: 'nivel-1-basico',
        unlocked: true,
        bestScore: this.attempts.get('nivel-1-basico')?.score ?? 0,
        completed: (this.attempts.get('nivel-1-basico')?.score ?? 0) >= 2,
      },
      {
        levelId: 'nivel-2-intermedio',
        unlocked: (this.attempts.get('nivel-1-basico')?.score ?? 0) >= 2,
        bestScore: this.attempts.get('nivel-2-intermedio')?.score ?? 0,
        completed: (this.attempts.get('nivel-2-intermedio')?.score ?? 0) >= 2,
      },
      {
        levelId: 'nivel-3-avanzado',
        unlocked: (this.attempts.get('nivel-2-intermedio')?.score ?? 0) >= 2,
        bestScore: this.attempts.get('nivel-3-avanzado')?.score ?? 0,
        completed: (this.attempts.get('nivel-3-avanzado')?.score ?? 0) >= 2,
      },
    ];
  }

  public async listBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }

  public async awardBadge(code: string): Promise<void> {
    if (!this.badges.has(code)) {
      this.badges.set(code, {
        code,
        title: code.replace(/_/g, ' '),
        awardedAt: new Date().toISOString(),
      });
    }
  }

  public async resetAll(): Promise<void> {
    this.attempts.clear();
    this.badges.clear();
  }
}
