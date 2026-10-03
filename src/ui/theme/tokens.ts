/**
 * Design Tokens for EarthQuakeTracker
 * Conforms to WCAG 2.1 AA accessibility guidelines
 * Minimum touch target: 48dp, Panic button: 96dp
 */

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  giant: 64,
} as const;

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: 'System',
    monospace: 'Courier New',
  },
  scale: {
    display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    headline: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
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
