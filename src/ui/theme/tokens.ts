/**
 * Design Tokens for EarthQuakeTracker
 * "Tactile Warmth & Organic Modernism"
 * Grounded Espresso, Ochre, Emerald, and Calm Steel Blue
 */

export const spacing = {
  none: 0,
  space2xs: 4,
  spaceXs: 8,
  spaceSm: 12,
  spaceMd: 16,
  spaceLg: 20,
  spaceXl: 24,
  space2xl: 32,
  space3xl: 40,
  screenEdgePadding: 20,
  cardInnerPadding: 16,
  bottomNavHeight: 72,
  headerBannerHeight: 64,
  // Alias cortos usados por los componentes
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: 'PlusJakartaSans-Regular',
    monospace: 'Courier New',
  },
  scale: {
    headlineXl: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.64 },
    headlineLg: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.24 },
    headlineLgMobile: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const },
    headlineMd: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
    headlineSm: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    bodyMd: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodySm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
    labelLg: { fontSize: 14, lineHeight: 18, fontWeight: '700' as const, letterSpacing: 0.28 },
    labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.12 },
    labelCaps: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 0.88 },
    // Alias usados por los componentes
    headline: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
    body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    label: { fontSize: 14, lineHeight: 18, fontWeight: '700' as const, letterSpacing: 0.28 },
    panicCountdown: { fontSize: 56, lineHeight: 64, fontWeight: '900' as const },
  },
} as const;

export const motion = {
  quick: 150,
  standard: 250,
  criticalPanicMaxMs: 300,
  countdownMs: 3000,
} as const;

export const touchTargets = {
  min: 48,
  panic: 96,
} as const;

/** Colores de marca y fases (DESIGN.md): útiles fuera del ColorPalette tematizable. */
export const brand = {
  espresso: '#2A1D13',
  espressoSoft: '#988375',
  cream: '#FDF9F2',
  sand: '#F4ECE1',
  linen: '#FAF6F0',
  border: '#E2D5C3',
  /** Fases: Prevención verde, Durante ocre, Después azul acero. */
  prevention: '#3D7D54',
  during: '#D47A22',
  after: '#3F6F8E',
  terracotta: '#C24726',
  navActive: '#FFDCC3',
  navInactive: '#D1C4BC',
} as const;
