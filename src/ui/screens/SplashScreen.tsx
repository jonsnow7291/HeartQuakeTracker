import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useServices } from '../hooks/useServices';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { LogoMark } from '../components/LogoMark';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';
import type { AppTheme } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * SplashScreen (D1 - Rediseño oficial)
 * Identidad visual completa: Logo con anillo Prevención · Durante · Después,
 * tipografía Plus Jakarta Sans «EARTHQUAKE TRACKER»,
 * lema oficial «PREPARA · PROTÉGETE · ACTÚA · AYUDA», y skyline difuminado.
 */
export function SplashScreen() {
  const { colors, brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useServices();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkInitialRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pausa mínima para fluidez visual y animación del splash
      const [hasAcc] = await Promise.all([
        session.hasAccount(),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);

      if (hasAcc) {
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding');
      }
    } catch (err: unknown) {
      console.warn('[SplashScreen] Error al verificar cuenta local:', err);
      setError('No se pudo verificar la sesión local. Por favor reintenta.');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkInitialRoute();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Emblema Central con Anillo Trifásico (Prevención · Durante · Después) */}
        <View style={styles.emblemContainer}>
          <Svg
            width={184}
            height={184}
            viewBox="0 0 200 200"
            style={styles.arcSvg}
          >
            {/* Arco Prevención (Verde) */}
            <Circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={brand.prevention}
              strokeWidth={5}
              strokeDasharray="160 380"
              strokeDashoffset={0}
              strokeLinecap="round"
              opacity={0.9}
            />
            {/* Arco Durante (Ocre) */}
            <Circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={brand.during}
              strokeWidth={5}
              strokeDasharray="130 410"
              strokeDashoffset={-180}
              strokeLinecap="round"
              opacity={0.95}
            />
            {/* Arco Después (Azul acero) */}
            <Circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={brand.after}
              strokeWidth={5}
              strokeDasharray="150 390"
              strokeDashoffset={-330}
              strokeLinecap="round"
              opacity={0.9}
            />
          </Svg>

          {/* Escudo oficial centrado */}
          <View style={styles.logoCircle}>
            <LogoMark size={84} />
          </View>
        </View>

        {/* Bloque Tipográfico Oficial */}
        <View style={styles.textBlock}>
          <Text style={styles.mainTitle}>EARTHQUAKE</Text>
          <Text style={styles.trackerBadge}>— TRACKER —</Text>

          {/* Lema Oficial */}
          <View style={styles.mottoRow}>
            <Text style={styles.mottoWord}>PREPARA</Text>
            <Text style={styles.mottoDot}>•</Text>
            <Text style={styles.mottoWord}>PROTÉGETE</Text>
            <Text style={styles.mottoDot}>•</Text>
            <Text style={styles.mottoWord}>ACTÚA</Text>
            <Text style={styles.mottoDot}>•</Text>
            <Text style={styles.mottoWord}>AYUDA</Text>
          </View>

          <Text style={styles.subtitle}>
            Red de socorro y autoprotección sísmica offline
          </Text>
          <Text style={styles.regionBadge}>BOGOTÁ • COLOMBIA (es-CO)</Text>
        </View>

        {/* Indicador de carga o error */}
        <View style={styles.statusArea}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={brand.espresso} />
              <Text style={styles.loadingText}>Iniciando servicios locales...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Reintentar"
                variant="primary"
                onPress={checkInitialRoute}
                style={styles.retryBtn}
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* Skyline Urbano Difuminado en la base */}
      <View style={styles.skylineWrapper} pointerEvents="none">
        <Svg
          width={SCREEN_WIDTH}
          height={100}
          viewBox="0 0 360 100"
          preserveAspectRatio="none"
        >
          {/* Silueta posterior más tenue */}
          <Path
            d="M0 100 L0 60 L18 60 L18 42 L38 42 L38 70 L55 70 L55 30 L85 30 L85 62 L105 62 L105 38 L130 38 L130 68 L152 68 L152 24 L185 24 L185 58 L205 58 L205 35 L235 35 L235 65 L258 65 L258 45 L288 45 L288 72 L312 72 L312 50 L340 50 L340 78 L360 78 L360 100 Z"
            fill={brand.sand}
            opacity={0.35}
          />
          {/* Silueta frontal más definida */}
          <Path
            d="M0 100 L0 75 L12 75 L12 55 L30 55 L30 82 L48 82 L48 48 L70 48 L70 76 L92 76 L92 52 L118 52 L118 80 L140 80 L140 38 L170 38 L170 70 L192 70 L192 50 L220 50 L220 78 L242 78 L242 58 L268 58 L268 84 L292 84 L292 60 L318 60 L318 86 L342 86 L342 66 L360 66 L360 100 Z"
            fill={brand.border}
            opacity={0.55}
          />
        </Svg>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, brand }: AppTheme) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenEdgePadding,
    zIndex: 2,
  },
  emblemContainer: {
    width: 184,
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.spaceMd,
    position: 'relative',
  },
  arcSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  logoCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.espresso,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: brand.border,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: spacing.spaceXs,
  },
  mainTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: brand.espresso,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  trackerBadge: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: brand.during,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  mottoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.spaceSm,
    gap: 6,
  },
  mottoWord: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: brand.espressoSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mottoDot: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    color: brand.during,
  },
  subtitle: {
    ...typography.scale.bodySm,
    color: brand.espressoSoft,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: spacing.spaceSm,
    lineHeight: 18,
  },
  regionBadge: {
    ...typography.scale.labelCaps,
    color: brand.during,
    marginTop: spacing.spaceSm,
    letterSpacing: 1.2,
  },
  statusArea: {
    marginTop: spacing.spaceXl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    gap: spacing.spaceXs,
  },
  loadingText: {
    ...typography.scale.bodySm,
    color: brand.espressoSoft,
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.spaceSm,
  },
  errorText: {
    ...typography.scale.bodyMd,
    color: brand.terracotta,
    textAlign: 'center',
    marginBottom: spacing.spaceXs,
  },
  retryBtn: {
    minWidth: 140,
  },
  skylineWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
