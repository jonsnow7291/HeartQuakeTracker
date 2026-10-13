import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { QuizLevel } from '../../contracts/content';
import { QuizEngine, AnswerFeedback } from '../features/quiz/engine/QuizEngine';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { useServices } from '../hooks/useServices';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';

export interface QuizScreenProps {
  level: QuizLevel;
  onFinish: () => void;
  onNavigateToGuide: (guideId: string) => void;
}

export function QuizScreen({ level, onFinish, onNavigateToGuide }: QuizScreenProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { progress, content } = useServices();

  const [engine, setEngine] = useState<QuizEngine | null>(null);
  const [engineState, setEngineState] = useState<ReturnType<QuizEngine['getState']> | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | undefined>(undefined);
  const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);
  const [isFinished, setIsFinished] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideTitleMap, setGuideTitleMap] = useState<Record<string, string>>({});

  // Cargar títulos de las guías disponibles (A-11)
  useEffect(() => {
    let mounted = true;
    async function loadGuides() {
      if (!content) return;
      try {
        const guides = await content.listGuides();
        if (mounted && guides) {
          const map: Record<string, string> = {};
          for (const g of guides) {
            map[g.id] = g.title;
          }
          setGuideTitleMap(map);
        }
      } catch (err) {
        console.warn('[QuizScreen] Error al cargar títulos de guías:', err);
      }
    }
    loadGuides();
    return () => {
      mounted = false;
    };
  }, [content]);

  // Inicialización y carga de intento parcial (RF-02 Flujo Alterno A1)
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        let partial = null;
        if (progress) {
          partial = await progress.getPartial(level.id);
        }
        if (mounted) {
          const eng = new QuizEngine(level, partial);
          setEngine(eng);
          setEngineState(eng.getState());
        }
      } catch (err) {
        console.warn('[QuizScreen] Error al recuperar intento parcial:', err);
        if (mounted) {
          const eng = new QuizEngine(level);
          setEngine(eng);
          setEngineState(eng.getState());
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [level, progress]);

  const handleSelectOption = (index: number) => {
    if (!engine || feedback) return;
    setSelectedOption(index);
    const fb = engine.answerCurrentQuestion(index);
    setFeedback(fb);
    setEngineState(engine.getState());
  };

  const handleNext = async () => {
    if (!engine) return;
    setFeedback(undefined);
    setSelectedOption(undefined);

    const hasNext = engine.nextQuestion();
    if (!hasNext) {
      // Intento finalizado completamente
      const attempt = engine.toAttempt(false);
      try {
        if (progress) {
          await progress.saveAttempt(attempt);
          const badges = engine.calculateBadgesToAward();
          const awarded: string[] = [];
          for (const b of badges) {
            try {
              await progress.awardBadge(b);
              awarded.push(b);
            } catch (e) {
              console.warn('[QuizScreen] no se pudo otorgar la insignia', b, e);
            }
          }
          setEarnedBadges(awarded);
        }
      } catch (err) {
        console.warn('[QuizScreen] Error al guardar progreso:', err);
      }
      setIsFinished(true);
    } else {
      setEngineState(engine.getState());
    }
  };

  const handlePauseAndExit = async () => {
    if (engine && progress) {
      try {
        await progress.saveAttempt(engine.toAttempt(true));
      } catch (err) {
        console.warn('[QuizScreen] Error al guardar progreso parcial:', err);
      }
    }
    onFinish();
  };

  if (loading || !engine || !engineState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.espresso} />
          <Text style={styles.loadingText}>Cargando preguntas oficiales...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla de Resultados
  if (isFinished) {
    const isPassed = engine.isPassed();
    const score = engineState.score;
    const total = engineState.totalQuestions;
    const scorePct = Math.round((score / total) * 100);

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {/* Hero de Resultado */}
          <View
            style={[
              styles.resultHeroBadge,
              isPassed ? styles.resultHeroPassed : styles.resultHeroReview,
            ]}
          >
            <Icon
              name={isPassed ? 'military_tech' : 'menu_book'}
              size={48}
              color={isPassed ? colors.onSuccessContainer : brand.during}
              filled
            />
          </View>

          <Text style={styles.resultTitle}>
            {isPassed ? '¡Nivel Aprobado!' : 'Sigue practicando'}
          </Text>

          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>
              Puntuación: {score} de {total} ({scorePct}%)
            </Text>
          </View>

          <Text style={styles.resultSubtitle}>
            {isPassed
              ? 'Has superado el umbral del 70% requerido por el protocolo oficial UNGRD (Regla D-33). Tus habilidades de autoprotección están fortalecidas.'
              : 'Se requiere al menos un 70% de aciertos para desbloquear el siguiente nivel de preparación. Revisa el refuerzo pedagógico y vuelve a intentarlo.'}
          </Text>

          {/* Insignias Obtenidas */}
          {earnedBadges.length > 0 ? (
            <View style={styles.badgesSection}>
              <View style={styles.badgesSectionHeader}>
                <Icon name="workspace_premium" size={20} color={brand.during} filled />
                <Text style={styles.badgesSectionTitle}>Insignias Desbloqueadas</Text>
              </View>
              <View style={styles.badgesRow}>
                {earnedBadges.map((b) => (
                  <View key={b} style={styles.badgeCard} accessible={true} accessibilityRole="text" accessibilityLabel={`Insignia ${b.replace(/_/g, ' ')}, asignada`}>
                    <View style={styles.badgeIconWrapper}>
                      <Icon name="workspace_premium" size={24} color={brand.during} filled />
                      <View style={styles.badgeMiniCheck}>
                        <Icon name="check" size={10} color={colors.onSuccessContainer} />
                      </View>
                    </View>
                    <Text style={styles.badgeName}>{b.replace(/_/g, ' ')}</Text>
                    <Text style={styles.badgeTag}>ASIGNADA</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Guías Recomendadas */}
          {engineState.recommendedGuides.length > 0 ? (
            <View style={styles.recommendSection}>
              <View style={styles.recommendHeader}>
                <Icon name="menu_book" size={20} color={brand.espresso} />
                <Text style={styles.recommendTitle}>Guías Recomendadas para Repasar:</Text>
              </View>
              {engineState.recommendedGuides.map((gid) => {
                const title = guideTitleMap[gid] || gid;
                return (
                  <TouchableOpacity
                    key={gid}
                    style={styles.reviewGuideCard}
                    onPress={() => onNavigateToGuide(gid)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Repasar guía oficial: ${title}`}
                  >
                    <Icon name="auto_stories" size={20} color={brand.during} />
                    <Text style={styles.reviewGuideText} numberOfLines={2}>
                      {title}
                    </Text>
                    <Icon name="chevron_right" size={20} color={colors.outline} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <Button
            title="Finalizar y Volver"
            variant="primary"
            onPress={onFinish}
            style={styles.finishBtn}
            accessibilityLabel="Finalizar quiz y volver al catálogo de módulos"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQ = engineState.currentQuestion;
  if (!currentQ) return null;
  const questionNumber = engineState.currentIndex + 1;
  const totalQuestions = engineState.totalQuestions;
  const progressPct = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screenWrapper}>
        {/* Cabecera del Reto Activo */}
        <View style={styles.challengeHeader}>
          <TouchableOpacity
            style={styles.pausePillBtn}
            onPress={handlePauseAndExit}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Pausar reto y guardar progreso parcial"
          >
            <Icon name="arrow_back" size={18} color={brand.espresso} />
            <Text style={styles.pauseBtnText}>Pausar</Text>
          </TouchableOpacity>

          <View style={styles.challengeTitleGroup}>
            <Icon name="quiz" size={18} color={brand.during} />
            <Text style={styles.challengeTitle}>Reto Activo (RF-02)</Text>
          </View>

          <View style={styles.practiceTimerChip}>
            <Icon name="timer" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.practiceTimerText}>Modo Guiado</Text>
          </View>
        </View>

        {/* Barra de progreso visual */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tarjeta de Pregunta Activa */}
          <Card style={styles.activeQuestionCard}>
            {/* Top Bar interior de la tarjeta */}
            <View style={styles.questionCardTopBar}>
              <View style={styles.faseChip}>
                <View style={styles.pulsingDot} />
                <Text style={styles.faseChipText} numberOfLines={2}>
                  {level.title.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.questionCounterText}>
                Pregunta {questionNumber} de {totalQuestions}
              </Text>
            </View>

            {/* Texto de la Pregunta */}
            <Text style={styles.questionText}>{currentQ.text}</Text>

            {/* Lista de Opciones */}
            <View style={styles.optionsList}>
              {currentQ.options.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                const isAnswered = feedback !== undefined;

                let cardStyle = styles.optionItemDefault;
                let letterBoxStyle = styles.letterBoxDefault;
                let textColor: string = brand.espresso;

                if (isAnswered) {
                  if (isCorrect) {
                    cardStyle = styles.optionItemCorrect;
                    letterBoxStyle = styles.letterBoxCorrect;
                    textColor = colors.onSuccessContainer;
                  } else if (isSelected) {
                    cardStyle = styles.optionItemIncorrect;
                    letterBoxStyle = styles.letterBoxIncorrect;
                    textColor = colors.onErrorContainer;
                  } else {
                    cardStyle = styles.optionItemMuted;
                    textColor = colors.outline;
                  }
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={isAnswered}
                    onPress={() => handleSelectOption(idx)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isAnswered }}
                    accessibilityLabel={`Opción ${String.fromCharCode(65 + idx)}: ${optionText}`}
                    style={[styles.optionItem, cardStyle]}
                  >
                    <View style={styles.optionContentRow}>
                      <View style={[styles.letterBox, letterBoxStyle]}>
                        {isAnswered && isCorrect ? (
                          <Icon name="check" size={16} color={colors.onSuccessContainer} filled />
                        ) : isAnswered && isSelected ? (
                          <Icon name="close" size={16} color={colors.onError} />
                        ) : (
                          <Text style={styles.letterText}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.optionTextWrapper}>
                        <Text
                          style={[
                            styles.optionText,
                            { color: textColor },
                            isAnswered && isCorrect && styles.optionTextCorrectBold,
                          ]}
                        >
                          {optionText}
                        </Text>
                        {isAnswered && isCorrect ? (
                          <View style={styles.verifiedBadge}>
                         <Icon name="verified" size={12} color={colors.tertiaryContainer} />
                         <Text style={styles.verifiedBadgeText}>
                           {feedback.protocolRef
                             ? `¡Correcto! ${feedback.protocolRef}`
                             : '¡Correcto! Protocolo oficial UNGRD'}
                         </Text>
                       </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Refuerzo Pedagógico UNIMINUTO */}
            {feedback ? (
              <View style={styles.reinforcementBox}>
                <Icon name="lightbulb" size={20} color={brand.during} style={styles.lightbulbIcon} />
                <View style={styles.reinforcementContent}>
                  <Text style={styles.reinforcementTitle}>Refuerzo Pedagógico UNIMINUTO</Text>
                  <Text style={styles.reinforcementText}>{feedback.explanation}</Text>

                  {!feedback.isCorrect && feedback.guideId ? (
                    <TouchableOpacity
                      style={styles.reviewGuidePill}
                      onPress={() => {
                        if (feedback.guideId) onNavigateToGuide(feedback.guideId);
                      }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Consultar guía oficial para repasar"
                    >
                      <Icon name="menu_book" size={16} color={brand.espresso} />
                      <Text style={styles.reviewGuidePillText}>
                        Consultar guía oficial de estudio
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Botón de Siguiente Pregunta o Finalizar */}
            {feedback ? (
              <TouchableOpacity
                style={styles.nextActionBtn}
                onPress={handleNext}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  questionNumber === totalQuestions
                    ? 'Ver resultados del reto'
                    : 'Avanzar a la siguiente pregunta y sumar puntos'
                }
              >
                <Text style={styles.nextActionBtnText}>
                  {questionNumber === totalQuestions
                    ? 'Ver Resultados Finales'
                    : 'Siguiente Pregunta (+50 XP)'}
                </Text>
                <Icon name="arrow_forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            ) : null}
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.scale.bodyMd,
    color: colors.outline,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenEdgePadding,
    paddingVertical: spacing.xs,
  },
  pausePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: brand.sand,
  },
  pauseBtnText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
  },
  challengeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  challengeTitle: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  practiceTimerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  practiceTimerText: {
    ...typography.scale.labelCaps,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: brand.during,
  },
  scrollContent: {
    padding: spacing.screenEdgePadding,
    paddingBottom: spacing.space3xl,
  },
  activeQuestionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.cardInnerPadding,
    borderColor: brand.border,
    borderWidth: 1,
  },
  questionCardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.space2xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: 6,
  },
  faseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.xs,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.during,
    flexShrink: 0,
  },
  faseChipText: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '800',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  questionCounterText: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '800',
    flexShrink: 0,
  },
  questionText: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionItem: {
    minHeight: touchTargets.min,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  optionItemDefault: {
    backgroundColor: colors.surfaceVariant,
    borderColor: 'transparent',
  },
  optionItemCorrect: {
    backgroundColor: colors.successContainer,
    borderColor: colors.tertiary,
  },
  optionItemIncorrect: {
    backgroundColor: colors.panicContainer,
    borderColor: colors.panic,
  },
  optionItemMuted: {
    backgroundColor: colors.surfaceVariant,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  optionContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  letterBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  letterBoxDefault: {
    backgroundColor: colors.outlineVariant,
  },
  letterBoxCorrect: {
    backgroundColor: colors.tertiaryContainer,
  },
  letterBoxIncorrect: {
    backgroundColor: colors.panic,
  },
  letterText: {
    ...typography.scale.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionText: {
    ...typography.scale.bodyMd,
    lineHeight: 20,
  },
  optionTextCorrectBold: {
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    ...typography.scale.labelCaps,
    color: colors.onSuccessContainer,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  reinforcementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: brand.border,
  },
  lightbulbIcon: {
    marginTop: 2,
  },
  reinforcementContent: {
    flex: 1,
  },
  reinforcementTitle: {
    ...typography.scale.labelMd,
    color: brand.during,
    fontWeight: '700',
  },
  reinforcementText: {
    ...typography.scale.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  reviewGuidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: brand.border,
  },
  reviewGuidePillText: {
    ...typography.scale.labelCaps,
    color: brand.espresso,
    fontWeight: '700',
  },
  nextActionBtn: {
    height: 52,
    backgroundColor: brand.fill,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  nextActionBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  resultContainer: {
    padding: spacing.screenEdgePadding,
    alignItems: 'center',
    paddingBottom: spacing.space3xl,
  },
  resultHeroBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  resultHeroPassed: {
    backgroundColor: colors.tertiaryContainer,
  },
  resultHeroReview: {
    backgroundColor: colors.secondaryContainer,
  },
  resultTitle: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    fontWeight: '800',
  },
  scorePill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: brand.border,
    marginTop: spacing.xs,
  },
  scorePillText: {
    ...typography.scale.labelLg,
    color: brand.during,
    fontWeight: '800',
  },
  resultSubtitle: {
    ...typography.scale.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  badgesSection: {
    marginTop: spacing.lg,
    width: '100%',
  },
  badgesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  badgesSectionTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.border,
    minWidth: 110,
    flex: 1,
  },
  badgeIconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  badgeMiniCheck: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: colors.successContainer,
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    ...typography.scale.labelMd,
    color: brand.espresso,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeTag: {
    ...typography.scale.labelCaps,
    color: brand.during,
    fontWeight: '800',
    marginTop: 2,
    fontSize: 9,
  },
  recommendSection: {
    marginTop: spacing.lg,
    width: '100%',
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  recommendTitle: {
    ...typography.scale.labelLg,
    color: brand.espresso,
    fontWeight: '700',
  },
  reviewGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: spacing.xs,
    minHeight: touchTargets.min,
    gap: spacing.xs,
  },
  reviewGuideText: {
    ...typography.scale.bodyMd,
    color: brand.espresso,
    flex: 1,
  },
  finishBtn: {
    marginTop: spacing.xl,
    width: '100%',
    minHeight: 52,
  },
});
