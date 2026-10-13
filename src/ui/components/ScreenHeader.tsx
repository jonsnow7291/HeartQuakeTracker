import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export type HeaderTone = 'plain' | 'prevention' | 'during' | 'after' | 'espresso';

export interface ScreenHeaderProps {
  title: string;
  /** Texto pequeño sobre el título (p. ej. «FASE 1 · ANTES DEL SISMO»). */
  eyebrow?: string;
  tone?: HeaderTone;
  onBack?: () => void;
  right?: ReactNode;
}

/** Cabecera de pantalla del sistema de diseño: franja de 64 px codificada por color de fase (DESIGN.md › Layout). */
export function ScreenHeader({ title, eyebrow, tone = 'plain', onBack, right }: ScreenHeaderProps) {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const TONES: Record<HeaderTone, { bg: string; fg: string }> = {
    plain: { bg: brand.cream, fg: brand.espresso },
    prevention: { bg: brand.prevention, fg: brand.onPhase },
    during: { bg: brand.during, fg: brand.onPhase },
    after: { bg: brand.after, fg: brand.onPhase },
    espresso: { bg: colors.primary, fg: colors.onPrimary },
  };
  const t = TONES[tone];
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" accessibilityHint="Regresa a la pantalla anterior" onPress={onBack} hitSlop={8} style={styles.side}>
            <Icon name="arrow_back" size={24} color={t.fg} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
        <View style={styles.center}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: t.fg }]}>{eyebrow}</Text> : null}
          <Text numberOfLines={2} style={[styles.title, { color: t.fg }]} accessibilityRole="header">{title}</Text>
        </View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: spacing.xs },
    side: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    right: { alignItems: 'flex-end' },
    center: { flex: 1, alignItems: 'center' },
    title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 0.88, opacity: 0.9 },
  });
