import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { lightPalette } from '../theme/theme';
import { spacing, borderRadius, typography, touchTargets } from '../theme/tokens';

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

      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Ocurrió un problema</Text>
          <Text style={styles.description}>
            La aplicación encontró un error inesperado. Tus datos locales y la baliza continúan a salvo.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reintentar y volver a la pantalla anterior"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: lightPalette.background,
  },
  title: {
    ...typography.scale.headline,
    color: lightPalette.panic,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.scale.bodyMedium,
    color: lightPalette.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    minHeight: touchTargets.min,
    minWidth: 160,
    backgroundColor: lightPalette.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    ...typography.scale.label,
    color: lightPalette.onPrimary,
  },
});
