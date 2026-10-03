import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, typography, borderRadius } from '../theme/tokens';

export interface CountdownProps {
  durationSeconds?: number;
  onFinish?: () => void;
}

export function Countdown({ durationSeconds = 3, onFinish }: CountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onFinish) onFinish();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onFinish]);

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  countdownNumber: {
    ...typography.scale.panicCountdown,
    color: lightPalette.panic,
  },
  label: {
    ...typography.scale.label,
    color: lightPalette.onSurfaceVariant,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: lightPalette.surfaceVariant,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: lightPalette.panic,
  },
});
