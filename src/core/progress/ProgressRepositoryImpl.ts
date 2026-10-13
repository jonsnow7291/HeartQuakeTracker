import { AppException } from '../../contracts/types';
import type { Badge, LevelStatus, ProgressRepository, QuizAttempt } from '../../contracts/progress';
import type { Clock, KeyValueStore } from '../platform/ports';
import { systemClock } from '../platform/ports';

const P = 'progress.';
const PARTIAL = (level: string) => `${P}partial.${level}`;
const BEST = (level: string) => `${P}best.${level}`;
const BADGES = `${P}badges`;

/** Umbral (D-33) para desbloquear el siguiente nivel: ≥ 70 % del puntaje del anterior. */
export const UNLOCK_RATIO = 0.7;

/** Insignias definidas (D-34). El conjunto lo gobierna el equipo de UI; aquí solo se valida el código. */
export const BADGE_CATALOG: Record<string, string> = {
  PRIMERA_GUIA: 'Primera Guía Leída',
  NIVEL_1: 'Nivel 1 completado',
  NIVEL_2: 'Nivel 2 completado',
  NIVEL_3: 'Nivel 3 completado',
  PERFECTO: 'Puntaje perfecto',
  PLAN_FAMILIAR_LISTO: 'Plan familiar listo',
  MOCHILA_COMPLETA: 'Mochila de emergencia completa',
};

interface BestRecord {
  score: number;
  maxScore: number;
}

export interface ProgressDeps {
  /** Almacén cifrado (SQLCipher) en el dispositivo. */
  store: KeyValueStore;
  /** Niveles disponibles en orden (normalmente `content.getQuizBank()`). */
  levels: () => Promise<{ id: string; order: number }[]>;
  clock?: Clock;
  /** Reintentos de escritura ante fallo de almacenamiento (RF-03 A1). */
  writeRetries?: number;
}

/** ProgressRepository real (RF-02/03): conserva el 100 % del progreso tras cerrar y reabrir la app. */
export class ProgressRepositoryImpl implements ProgressRepository {
  private readonly clock: Clock;

  constructor(private readonly deps: ProgressDeps) {
    this.clock = deps.clock ?? systemClock;
  }

  async saveAttempt(a: QuizAttempt): Promise<void> {
    if (!a.levelId) throw new AppException('VALIDATION', 'levelId requerido');
    if (a.score < 0 || a.maxScore <= 0 || a.score > a.maxScore) throw new AppException('VALIDATION', 'Puntaje fuera de rango');

    if (a.partial) {
      await this.put(PARTIAL(a.levelId), JSON.stringify({ ...a, finishedAt: undefined }));
      return;
    }
    const best = await this.getBest(a.levelId);
    // Mejor intento = mayor proporción de aciertos (los niveles pueden cambiar de tamaño entre versiones).
    if (!best || a.score / a.maxScore > best.score / best.maxScore) {
      await this.put(BEST(a.levelId), JSON.stringify({ score: a.score, maxScore: a.maxScore } satisfies BestRecord));
    }
    await this.deps.store.delete(PARTIAL(a.levelId)); // el parcial queda obsoleto al terminar
  }

  async getPartial(levelId: string): Promise<QuizAttempt | null> {
    const raw = await this.deps.store.get(PARTIAL(levelId));
    return raw ? (JSON.parse(raw) as QuizAttempt) : null;
  }

  async getLevelStatus(): Promise<LevelStatus[]> {
    const levels = [...(await this.deps.levels())].sort((a, b) => a.order - b.order);
    const out: LevelStatus[] = [];
    let prevPassed = true;
    for (const [i, l] of levels.entries()) {
      const best = await this.getBest(l.id);
      out.push({
        levelId: l.id,
        unlocked: i === 0 || prevPassed,
        bestScore: best?.score ?? 0,
        completed: best !== null,
      });
      prevPassed = best !== null && best.score / best.maxScore >= UNLOCK_RATIO;
    }
    return out;
  }

  async listBadges(): Promise<Badge[]> {
    const raw = await this.deps.store.get(BADGES);
    return raw ? (JSON.parse(raw) as Badge[]) : [];
  }

  async awardBadge(code: string): Promise<void> {
    const title = BADGE_CATALOG[code];
    if (!title) throw new AppException('VALIDATION', `Insignia desconocida: ${code}`);
    const badges = await this.listBadges();
    if (badges.some((b) => b.code === code)) return; // idempotente
    badges.push({ code, title, awardedAt: new Date(this.clock.now()).toISOString() });
    await this.put(BADGES, JSON.stringify(badges));
  }

  /** Eliminación total del progreso (ISO A.8.10). */
  async resetAll(): Promise<void> {
    for (const k of await this.deps.store.keys(P)) await this.deps.store.delete(k);
  }

  // ---- internos ----

  private async getBest(levelId: string): Promise<BestRecord | null> {
    const raw = await this.deps.store.get(BEST(levelId));
    return raw ? (JSON.parse(raw) as BestRecord) : null;
  }

  /** Escritura con reintentos; si persiste el fallo → STORAGE_FAILED (RF-03 A1). */
  private async put(key: string, value: string): Promise<void> {
    const retries = this.deps.writeRetries ?? 2;
    for (let i = 0; i <= retries; i++) {
      try {
        await this.deps.store.set(key, value);
        return;
      } catch {
        /* reintenta */
      }
    }
    throw new AppException('STORAGE_FAILED', 'No se pudo guardar tu progreso. Libera espacio e inténtalo de nuevo');
  }
}
