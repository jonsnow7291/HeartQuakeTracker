import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing, borderRadius, typography, touchTargets } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // We do not send analytics to cloud in accordance with D-21 zero-telemetry policy.
    // Error is kept in memory for local recovery.
    if (__DEV__) {
      console.warn('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.title}>Ocurrió un problema</Text>
      <Text style={styles.description}>
        La aplicación encontró un error inesperado. Tus datos locales y la baliza continúan a salvo.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onReset}
        accessibilityRole="button"
        accessibilityLabel="Reintentar y volver a la pantalla anterior"
      >
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.scale.headline,
      color: colors.panic,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    description: {
      ...typography.scale.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.xxl,
    },
    retryButton: {
      minHeight: touchTargets.min,
      minWidth: 160,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    retryText: {
      ...typography.scale.label,
      color: colors.onPrimary,
    },
  });
