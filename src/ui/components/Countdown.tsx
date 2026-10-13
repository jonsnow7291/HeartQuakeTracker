import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography, borderRadius } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

export interface CountdownProps {
  durationSeconds?: number;
  onFinish?: () => void;
}

export function Countdown({ durationSeconds = 3, onFinish }: CountdownProps) {
  const styles = useThemedStyles(makeStyles);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  // `onFinish` llega como función nueva en cada render del padre: se guarda en una ref para que el
  // intervalo no se reinicie (antes el contador se quedaba clavado en 3 s).
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const endsAt = Date.now() + durationSeconds * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        finishRef.current?.();
      }
    }, 200);
    return () => clearInterval(timer);
  }, [durationSeconds]);

  const progressPercent = ((durationSeconds - secondsLeft) / durationSeconds) * 100;

  return (
    <View style={styles.container} accessible={true} accessibilityRole="timer">
      <Text style={styles.countdownNumber}>{secondsLeft}</Text>
      <Text style={styles.label}>Activando en {secondsLeft} s...</Text>
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    countdownNumber: {
      ...typography.scale.panicCountdown,
      color: colors.panic,
    },
    label: {
      ...typography.scale.label,
      color: colors.onSurfaceVariant,
      marginTop: spacing.xs,
      textTransform: 'uppercase',
    },
    progressBarTrack: {
      width: '100%',
      height: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.full,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.panic,
    },
  });
