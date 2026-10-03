import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography } from '../theme/tokens';

export type BannerKind = 'info' | 'warning' | 'critical' | 'success';

export interface BannerProps {
  kind: BannerKind;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export function Banner({ kind, title, message, actionText, onAction }: BannerProps) {
  const getStyles = () => {
    switch (kind) {
      case 'critical':
        return {
          bg: lightPalette.panicContainer,
          titleColor: lightPalette.panic,
          textColor: lightPalette.onPanicContainer,
          borderColor: lightPalette.panic,
        };
      case 'warning':
        return {
          bg: lightPalette.warningContainer,
          titleColor: lightPalette.warning,
          textColor: lightPalette.onWarningContainer,
          borderColor: lightPalette.warning,
        };
      case 'success':
        return {
          bg: lightPalette.successContainer,
          titleColor: lightPalette.success,
          textColor: lightPalette.onSuccessContainer,
          borderColor: lightPalette.success,
        };
      case 'info':
      default:
        return {
          bg: lightPalette.primaryContainer,
          titleColor: lightPalette.primary,
          textColor: lightPalette.onPrimaryContainer,
          borderColor: lightPalette.primary,
        };
    }
  };

  const styleConfig = getStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: styleConfig.bg,
          borderLeftColor: styleConfig.borderColor,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: styleConfig.titleColor }]}>{title}</Text>
        {message ? <Text style={[styles.message, { color: styleConfig.textColor }]}>{message}</Text> : null}
      </View>
      {actionText && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={[styles.actionText, { color: styleConfig.titleColor }]}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    marginVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.scale.label,
    fontSize: 13,
  },
  message: {
    ...typography.scale.bodyMedium,
    fontSize: 12,
    marginTop: spacing.xxs,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.scale.label,
    textDecorationLine: 'underline',
  },
});
