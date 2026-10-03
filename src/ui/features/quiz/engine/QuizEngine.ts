import { QuizLevel, QuizQuestion } from '../../../../contracts/content';
import { QuizAttempt, QuizAnswer } from '../../../../contracts/progress';

export interface AnswerFeedback {
  questionId: string;
  isCorrect: boolean;
  chosenIndex: number;
  correctIndex: number;
  explanation: string;
  protocolRef?: string;
  guideId?: string;
}

export interface QuizEngineState {
  levelId: string;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  isComplete: boolean;
  answers: QuizAnswer[];
  currentQuestion: QuizQuestion;
  lastFeedback?: AnswerFeedback;
  recommendedGuides: string[];
}

export class QuizEngine {
  private level: QuizLevel;
  private answers: QuizAnswer[] = [];
  private currentIndex: number = 0;
  private score: number = 0;
  private lastFeedback?: AnswerFeedback;
  private recommendedGuides: Set<string> = new Set();

  constructor(level: QuizLevel, partialAttempt?: QuizAttempt | null) {
    if (!level.questions || level.questions.length === 0) {
      throw new Error('El nivel de quiz debe contener al menos una pregunta');
    }
    this.level = level;

    if (partialAttempt && partialAttempt.answers && partialAttempt.answers.length > 0) {
      // Reanudar intento parcial
      this.answers = [...partialAttempt.answers];
      this.currentIndex = Math.min(this.answers.length, level.questions.length - 1);
      this.score = this.answers.filter((a) => a.correct).length;

      // Reconstruir recomendaciones de guías si hubo errores
      this.answers.forEach((ans) => {
        if (!ans.correct) {
          const q = this.level.questions.find((x) => x.id === ans.questionId);
          if (q && q.guideId) {
            this.recommendedGuides.add(q.guideId);
          }
        }
      });
    }
  }

  public getState(): QuizEngineState {
    const isComplete = this.currentIndex >= this.level.questions.length;
    const currentQ = isComplete
      ? this.level.questions[this.level.questions.length - 1]
      : this.level.questions[this.currentIndex];

    return {
      levelId: this.level.id,
      currentIndex: this.currentIndex,
      totalQuestions: this.level.questions.length,
      score: this.score,
      isComplete,
      answers: [...this.answers],
      currentQuestion: currentQ,
      lastFeedback: this.lastFeedback,
      recommendedGuides: Array.from(this.recommendedGuides),
    };
  }

  /**
   * Responde a la pregunta actual y retorna el feedback inmediato (< 1 s).
   */
  public answerCurrentQuestion(chosenIndex: number): AnswerFeedback {
    if (this.currentIndex >= this.level.questions.length) {
      throw new Error('El cuestionario ya ha finalizado');
    }

    const question = this.level.questions[this.currentIndex];
    const isCorrect = chosenIndex === question.correctIndex;

    if (isCorrect) {
      this.score += 1;
    } else if (question.guideId) {
      this.recommendedGuides.add(question.guideId);
    }

    const answerRecord: QuizAnswer = {
      questionId: question.id,
      chosen: chosenIndex,
      correct: isCorrect,
    };
    this.answers.push(answerRecord);

    const feedback: AnswerFeedback = {
      questionId: question.id,
      isCorrect,
      chosenIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      protocolRef: question.protocolRef,
      guideId: question.guideId,
    };

    this.lastFeedback = feedback;
    return feedback;
  }

  /**
   * Avanza a la siguiente pregunta.
   */
  public nextQuestion(): boolean {
    this.lastFeedback = undefined;
    if (this.currentIndex < this.level.questions.length) {
      this.currentIndex += 1;
    }
    return this.currentIndex < this.level.questions.length;
  }

  /**
   * Genera el payload de intento para guardar en ProgressRepository.
   */
  public toAttempt(isPartial: boolean = false): QuizAttempt {
    return {
      levelId: this.level.id,
      score: this.score,
      maxScore: this.level.questions.length,
      answers: [...this.answers],
      finishedAt: isPartial ? undefined : new Date().toISOString(),
      partial: isPartial,
    };
  }

  /**
   * Determina si el nivel fue aprobado (>= 70% de aciertos según D-33).
   */
  public isPassed(): boolean {
    if (this.level.questions.length === 0) return false;
    const percentage = (this.score / this.level.questions.length) * 100;
    return percentage >= 70;
  }

  /**
   * Calcula insignias aplicables al finalizar el intento.
   */
  public calculateBadgesToAward(): string[] {
    const badges: string[] = [];
    if (!this.isPassed()) return badges;

    if (this.level.id.includes('1') || this.level.order === 1) {
      badges.push('NIVEL_1_COMPLETADO');
    } else if (this.level.id.includes('2') || this.level.order === 2) {
      badges.push('NIVEL_2_COMPLETADO');
    } else if (this.level.id.includes('3') || this.level.order === 3) {
      badges.push('NIVEL_3_COMPLETADO');
    }

    if (this.score === this.level.questions.length) {
      badges.push('PERFECTO');
    }

    return badges;
  }
}
