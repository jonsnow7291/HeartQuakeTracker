import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { QuizLevel } from '../../contracts/content';
import { QuizEngine, AnswerFeedback } from '../features/quiz/engine/QuizEngine';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useServices } from '../hooks/useServices';
import { lightPalette } from '../theme/theme';
import { spacing, typography, borderRadius } from '../theme/tokens';

export interface QuizScreenProps {
  level: QuizLevel;
  onFinish: () => void;
  onNavigateToGuide: (guideId: string) => void;
}

export function QuizScreen({ level, onFinish, onNavigateToGuide }: QuizScreenProps) {
  const { progress } = useServices();

  const [engine] = useState(() => new QuizEngine(level));
  const [engineState, setEngineState] = useState(() => engine.getState());
  const [feedback, setFeedback] = useState<AnswerFeedback | undefined>(undefined);
  const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);
  const [isFinished, setIsFinished] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const handleSelectOption = (index: number) => {
    if (feedback) return; // Answer already locked in
    setSelectedOption(index);
    const fb = engine.answerCurrentQuestion(index);
    setFeedback(fb);
    setEngineState(engine.getState());
  };

  const handleNext = async () => {
    setFeedback(undefined);
    setSelectedOption(undefined);

    const hasNext = engine.nextQuestion();
    if (!hasNext) {
      // Completed!
      const attempt = engine.toAttempt(false);
      try {
        if (progress) {
          await progress.saveAttempt(attempt);
          const badges = engine.calculateBadgesToAward();
          for (const b of badges) {
            await progress.awardBadge(b);
          }
          setEarnedBadges(badges);
        }
      } catch (err) {
        console.warn('Could not save progress:', err);
      }
      setIsFinished(true);
    } else {
      setEngineState(engine.getState());
    }
  };

  if (isFinished) {
    const isPassed = engine.isPassed();
    const score = engineState.score;
    const total = engineState.totalQuestions;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{isPassed ? '🎉' : '📖'}</Text>
          <Text style={styles.resultTitle}>
            {isPassed ? '¡Nivel Aprobado!' : 'Sigue practicando'}
          </Text>
          <Text style={styles.scoreText}>
            Puntuación: {score} de {total} ({Math.round((score / total) * 100)}%)
          </Text>
          <Text style={styles.resultSubtitle}>
            {isPassed
              ? 'Has demostrado conocimientos sólidos de autoprotección y mitigación sísmica.'
              : 'Se requiere al menos un 70% para desbloquear el siguiente nivel.'}
          </Text>

          {/* Badges Earned */}
          {earnedBadges.length > 0 ? (
            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>Insignias Obtenidas</Text>
              <View style={styles.badgesRow}>
                {earnedBadges.map((b) => (
                  <Badge key={b} title={b.replace(/_/g, ' ')} unlocked={true} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Guide Recommendations */}
          {engineState.recommendedGuides.length > 0 ? (
            <View style={styles.recommendSection}>
              <Text style={styles.recommendTitle}>Guías Recomendadas para Repasar:</Text>
              {engineState.recommendedGuides.map((gid) => (
                <Button
                  key={gid}
                  title={`Repasar: ${gid}`}
                  variant="outline"
                  onPress={() => onNavigateToGuide(gid)}
                  style={styles.reviewBtn}
                />
              ))}
            </View>
          ) : null}

          <Button title="Volver a Educación" variant="primary" onPress={onFinish} style={styles.finishBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQ = engineState.currentQuestion;
  const questionNumber = engineState.currentIndex + 1;
  const totalQuestions = engineState.totalQuestions;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <Text style={styles.levelTitle}>{level.title}</Text>
          <Text style={styles.questionCounter}>
            Pregunta {questionNumber} de {totalQuestions}
          </Text>
        </View>

        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQ.text}</Text>
        </Card>

        {/* Options */}
        <ScrollView style={styles.optionsList}>
          {currentQ.options.map((optionText, idx) => {
            let optionBg = lightPalette.surface;
            let optionBorder = lightPalette.outlineVariant;
            let textColor = lightPalette.onSurface;

            if (feedback) {
              if (idx === currentQ.correctIndex) {
                optionBg = lightPalette.successContainer;
                optionBorder = lightPalette.success;
                textColor = lightPalette.onSuccessContainer;
              } else if (idx === selectedOption) {
                optionBg = lightPalette.panicContainer;
                optionBorder = lightPalette.panic;
                textColor = lightPalette.onPanicContainer;
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                disabled={feedback !== undefined}
                onPress={() => handleSelectOption(idx)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Opción ${String.fromCharCode(65 + idx)}: ${optionText}`}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: optionBg,
                    borderColor: optionBorder,
                  },
                ]}
              >
                <Text style={[styles.optionLetter, { color: textColor }]}>
                  {String.fromCharCode(65 + idx)}.
                </Text>
                <Text style={[styles.optionText, { color: textColor }]}>{optionText}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Immediate Feedback Card (< 1s) */}
          {feedback ? (
            <Card
              style={[
                styles.feedbackCard,
                {
                  borderColor: feedback.isCorrect ? lightPalette.success : lightPalette.panic,
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: feedback.isCorrect ? lightPalette.success : lightPalette.panic },
                ]}
              >
                {feedback.isCorrect ? '✅ ¡Correcto!' : '❌ Respuesta incorrecta'}
              </Text>
              <Text style={styles.explanationText}>{feedback.explanation}</Text>
              {feedback.protocolRef ? (
                <Text style={styles.protocolText}>Fuente: {feedback.protocolRef}</Text>
              ) : null}

              <Button
                title={questionNumber === totalQuestions ? 'Ver Resultados' : 'Siguiente Pregunta →'}
                variant="primary"
                onPress={handleNext}
                style={styles.nextBtn}
              />
            </Card>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightPalette.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  progressHeader: {
    marginBottom: spacing.md,
  },
  levelTitle: {
    ...typography.scale.label,
    color: lightPalette.primary,
    textTransform: 'uppercase',
  },
  questionCounter: {
    ...typography.scale.title,
    color: lightPalette.onBackground,
    marginTop: spacing.xxs,
  },
  questionCard: {
    marginBottom: spacing.md,
  },
  questionText: {
    ...typography.scale.bodyLarge,
    fontWeight: '600',
    color: lightPalette.onSurface,
  },
  optionsList: {
    flex: 1,
  },
  optionButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  optionLetter: {
    ...typography.scale.label,
    fontSize: 16,
    marginRight: spacing.sm,
    width: 24,
  },
  optionText: {
    ...typography.scale.bodyMedium,
    flex: 1,
  },
  feedbackCard: {
    borderWidth: 2,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  feedbackTitle: {
    ...typography.scale.title,
    fontSize: 16,
    fontWeight: '700',
  },
  explanationText: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  protocolText: {
    ...typography.scale.label,
    color: lightPalette.outline,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  nextBtn: {
    marginTop: spacing.md,
  },
  resultContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  resultTitle: {
    ...typography.scale.headline,
    color: lightPalette.onBackground,
  },
  scoreText: {
    ...typography.scale.title,
    color: lightPalette.primary,
    marginTop: spacing.xs,
  },
  resultSubtitle: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  badgesSection: {
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  badgesTitle: {
    ...typography.scale.label,
    color: lightPalette.onSurface,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  recommendSection: {
    marginTop: spacing.xl,
    width: '100%',
  },
  recommendTitle: {
    ...typography.scale.label,
    color: lightPalette.onSurface,
    marginBottom: spacing.xs,
  },
  reviewBtn: {
    marginVertical: spacing.xxs,
  },
  finishBtn: {
    marginTop: spacing.xxl,
    width: '100%',
    marginBottom: spacing.xl,
  },
});
