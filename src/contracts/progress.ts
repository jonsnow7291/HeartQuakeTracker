import { ISODate } from './types';

export interface QuizAnswer {
  questionId: string;
  chosen: number;
  correct: boolean;
}

export interface QuizAttempt {
  levelId: string;
  score: number;
  maxScore: number;
  answers: QuizAnswer[];
  finishedAt?: ISODate;
  partial: boolean;
}

export interface LevelStatus {
  levelId: string;
  unlocked: boolean;
  bestScore: number;
  completed: boolean;
}

export interface Badge {
  code: string;
  title: string;
  awardedAt?: ISODate;
}

export interface ProgressRepository {
  saveAttempt(a: QuizAttempt): Promise<void>;
  getPartial(levelId: string): Promise<QuizAttempt | null>;
  getLevelStatus(): Promise<LevelStatus[]>;
  listBadges(): Promise<Badge[]>;
  awardBadge(code: string): Promise<void>;
  resetAll(): Promise<void>; // A.8.10 eliminación
}
