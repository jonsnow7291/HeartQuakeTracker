import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
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
  const { colors } = useTheme();
  const getStyles = () => {
    switch (kind) {
      case 'critical':
        return {
          bg: colors.panicContainer,
          titleColor: colors.panic,
          textColor: colors.onPanicContainer,
          borderColor: colors.panic,
        };
      case 'warning':
        return {
          bg: colors.warningContainer,
          titleColor: colors.warning,
          textColor: colors.onWarningContainer,
          borderColor: colors.warning,
        };
      case 'success':
        return {
          bg: colors.successContainer,
          titleColor: colors.success,
          textColor: colors.onSuccessContainer,
          borderColor: colors.success,
        };
      case 'info':
      default:
        return {
          bg: colors.primaryContainer,
          titleColor: colors.primary,
          textColor: colors.onPrimaryContainer,
          borderColor: colors.primary,
        };
    }
  };

  const styleConfig = getStyles();
  const liveRegion = kind === 'critical' || kind === 'warning' ? 'assertive' : 'polite';

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
      accessibilityLiveRegion={liveRegion}
      accessibilityLabel={message ? `${title}. ${message}` : title}
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
