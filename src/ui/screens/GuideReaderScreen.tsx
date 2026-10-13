import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Markdown from 'react-native-markdown-display';
import { Banner } from '../components/Banner';
import { ErrorState } from '../components/ErrorState';
import { useServices } from '../hooks/useServices';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { spacing, typography, borderRadius, touchTargets } from '../theme/tokens';
import type { ErrorCode } from '../../contracts/errors';

export interface GuideReaderScreenProps {
  guideId: string;
  onBack: () => void;
}

export function GuideReaderScreen({ guideId, onBack }: GuideReaderScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const markdownStyles = useThemedStyles(makeMarkdownStyles);
  const { content, progress } = useServices();

  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      if (content) {
        const text = await content.getGuideMarkdown(guideId);
        setMarkdown(text);

        // Verificación de actualizaciones en segundo plano (Flujo alterno A2)
        content
          .checkUpdates()
          .then((res) => {
            if (res.available) {
              setUpdateAvailable(true);
            }
          })
          .catch(() => {
            // Ignorar errores de red en segundo plano (modo offline)
          });
      }
    } catch (err: unknown) {
      const code = (err as { code?: ErrorCode })?.code ?? 'CONTENT_MISSING';
      setError(code);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [guideId, content]);

  const handleFinish = async () => {
    try {
      if (progress) {
        // Otorgar insignia de primera guía leída (D-34)
        await progress.awardBadge('PRIMERA_GUIA');
      }
    } catch (err) {
      console.warn('No se pudo registrar insignia de lectura:', err);
    }
    onBack();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabecera contextual */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButtonCircle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Volver al catálogo de guías"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="arrow_back" size={20} color={brand.espresso} />
            </TouchableOpacity>
            <View style={styles.subHeaderTitleBlock}>
              <View style={styles.phaseIndicatorRow}>
                <View style={styles.phaseIndicatorDot} />
                <Text style={styles.phaseIndicatorText}>Lectura Offline</Text>
              </View>
              <Text style={styles.phaseTitleText} accessibilityRole="header">
                Guía Educativa
              </Text>
            </View>
          </View>
          <View style={styles.headerIconBadge}>
            <Icon name="article" size={22} color={brand.espresso} />
          </View>
        </View>

        {updateAvailable ? (
          <View style={styles.bannerWrapper}>
            <Banner
              kind="info"
              title="Actualización disponible"
              message="Existe una versión actualizada de esta guía en los servidores oficiales."
              actionText="Actualizar"
              onAction={loadContent}
            />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <ErrorState code={error} onRetry={loadContent} />
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brand.espresso} />
            <Text style={styles.loadingText}>Cargando guía educativa...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Markdown style={markdownStyles}>{markdown}</Markdown>

            {/* Accesos directos a checklists complementarios */}
            <View style={styles.relatedActions}>
              {guideId === 'mochila-emergencia' ? (
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => navigation.navigate('Kit')}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir Checklist de Mochila 72 horas"
                >
                  <Icon name="backpack" size={20} color={brand.espresso} />
                  <Text style={styles.secondaryActionBtnText}>
                    Abrir Checklist de Mochila 72h
                  </Text>
                </TouchableOpacity>
              ) : null}

              {guideId === 'plan-familiar' ? (
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => navigation.navigate('FamilyPlan')}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir Plan Familiar de Evacuación"
                >
                  <Icon name="diversity_3" size={20} color={brand.espresso} />
                  <Text style={styles.secondaryActionBtnText}>
                    Abrir Plan Familiar de Evacuación
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.primaryFinishBtn}
                onPress={handleFinish}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Finalizar lectura de la guía"
              >
                <Icon name="check_circle" size={20} color={colors.onPrimary} />
                <Text style={styles.primaryFinishBtnText}>Finalizar Lectura</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
  container: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenEdgePadding,
    paddingVertical: spacing.spaceXs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subHeaderTitleBlock: {
    justifyContent: 'center',
  },
  phaseIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space2xs,
  },
  phaseIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  phaseIndicatorText: {
    ...typography.scale.labelCaps,
    textTransform: 'uppercase',
    color: colors.onTertiaryContainer,
    letterSpacing: 0.88,
  },
  phaseTitleText: {
    ...typography.scale.headlineLgMobile,
    color: brand.espresso,
    letterSpacing: -0.2,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerWrapper: {
    paddingHorizontal: spacing.screenEdgePadding,
    marginTop: spacing.spaceXs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.spaceXl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  loadingText: {
    ...typography.scale.bodyMd,
    color: colors.outline,
  },
  content: {
    paddingHorizontal: spacing.screenEdgePadding,
    paddingTop: spacing.spaceMd,
    paddingBottom: spacing.space3xl,
  },
  relatedActions: {
    marginTop: spacing.spaceXl,
    paddingTop: spacing.spaceLg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    gap: spacing.spaceSm,
  },
  secondaryActionBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceXs,
    paddingHorizontal: spacing.spaceLg,
  },
  secondaryActionBtnText: {
    ...typography.scale.labelLg,
    color: brand.espresso,
  },
  primaryFinishBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: borderRadius.full,
    backgroundColor: brand.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spaceXs,
    paddingHorizontal: spacing.spaceLg,
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryFinishBtnText: {
    ...typography.scale.labelLg,
    color: colors.onPrimary,
  },
});

const makeMarkdownStyles = ({ colors, brand }: AppTheme) => ({
  body: {
    ...typography.scale.bodyLg,
    color: colors.onBackground,
    lineHeight: 24,
  },
  heading1: {
    ...typography.scale.headlineLg,
    color: brand.espresso,
    marginTop: spacing.spaceLg,
    marginBottom: spacing.spaceXs,
  },
  heading2: {
    ...typography.scale.headlineMd,
    color: brand.during,
    marginTop: spacing.spaceMd,
    marginBottom: spacing.space2xs,
  },
  heading3: {
    ...typography.scale.headlineSm,
    color: brand.espresso,
    marginTop: spacing.spaceSm,
    marginBottom: spacing.space2xs,
  },
  paragraph: {
    ...typography.scale.bodyMd,
    color: colors.onBackground,
    lineHeight: 22,
    marginBottom: spacing.spaceSm,
  },
  bullet_list: {
    marginBottom: spacing.spaceSm,
  },
  ordered_list: {
    marginBottom: spacing.spaceSm,
  },
  list_item: {
    ...typography.scale.bodyMd,
    color: colors.onBackground,
    lineHeight: 20,
    marginBottom: spacing.space2xs,
  },
  blockquote: {
    backgroundColor: colors.surfaceVariant,
    borderLeftColor: brand.during,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.spaceXs,
    marginVertical: spacing.spaceSm,
    borderRadius: borderRadius.sm,
  },
  strong: {
    fontWeight: '700' as const,
    color: brand.espresso,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: typography.fontFamily.monospace,
    color: colors.onSurfaceVariant,
  },
  hr: {
    backgroundColor: brand.border,
    height: 1,
    marginVertical: spacing.spaceMd,
  },
});
