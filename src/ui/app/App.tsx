import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Services } from '../../contracts/container';
import { initServices } from '../../app/bootstrap';
import { ServicesProvider } from '../hooks/useServices';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RootNavigator } from '../navigation/RootNavigator';
import { LogoMark } from '../components/LogoMark';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

/**
 * Punto de entrada de la UI. `initServices()` sustituye los mocks por los servicios reales; la
 * navegación solo se monta cuando termina, porque las pantallas leen los servicios en su primer render.
 * Si un servicio real falla, el bootstrap conserva su mock y la app sigue arrancando.
 */
export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [services, setServices] = useState<Services | undefined>();
  const theme = useTheme();
  const navTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onBackground,
      primary: theme.colors.primary,
      border: theme.colors.outlineVariant,
    },
  };

  useEffect(() => {
    let active = true;
    initServices().then((s) => {
      if (active) setServices(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {!services ? <BootSplash /> : (
        <SafeAreaProvider>
          <ErrorBoundary>
            <ServicesProvider services={services}>
              <NavigationContainer theme={navTheme}>
                <RootNavigator />
              </NavigationContainer>
            </ServicesProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      )}
    </>
  );
}

function BootSplash() {
  const theme: AppTheme = useTheme();
  const styles = bootStyles(theme);
  // Mismo lenguaje visual que el splash (design/mockups): logo, nombre y lema, sin spinner genérico.
  return (
    <View style={styles.boot} accessibilityLabel="Iniciando EarthQuakeTracker">
      <LogoMark size={120} />
      <Text style={styles.bootTitle}>EARTHQUAKE</Text>
      <Text style={styles.bootSub}>— TRACKER —</Text>
      <Text style={styles.bootTag}>PREPARA · PROTÉGETE · ACTÚA · AYUDA</Text>
    </View>
  );
}

function bootStyles(theme: AppTheme) {
  return StyleSheet.create({
    boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.brand.cream, paddingHorizontal: 24 },
    bootTitle: { marginTop: 16, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: 2, color: theme.brand.espresso },
    bootSub: { fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 6, color: theme.brand.during },
    bootTag: { marginTop: 28, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.6, color: theme.brand.espresso },
  });
}
