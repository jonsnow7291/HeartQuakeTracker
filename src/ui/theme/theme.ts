import { spacing, borderRadius, typography, motion, touchTargets } from './tokens';

export interface ColorPalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  panic: string;
  onPanic: string;
  panicContainer: string;
  onPanicContainer: string;

  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;

  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;

  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;

  status: {
    offline: string;
    online: string;
    syncing: string;
    beaconActive: string;
    lowPower: string;
  };
}

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  motion: typeof motion;
  touchTargets: typeof touchTargets;
}

export const lightPalette: ColorPalette = {
  primary: '#0B57D0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D3E3FD',
  onPrimaryContainer: '#041E49',

  panic: '#BA1A1A',
  onPanic: '#FFFFFF',
  panicContainer: '#FFDAD6',
  onPanicContainer: '#410002',

  warning: '#B26200',
  onWarning: '#FFFFFF',
  warningContainer: '#FFDDB3',
  onWarningContainer: '#2B1700',

  success: '#146C2E',
  onSuccess: '#FFFFFF',
  successContainer: '#C4EED0',
  onSuccessContainer: '#00210B',

  background: '#FDFBFF',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#E1E2EC',
  onSurfaceVariant: '#44474F',
  outline: '#74777F',
  outlineVariant: '#C4C6D0',

  status: {
    offline: '#74777F',
    online: '#146C2E',
    syncing: '#0B57D0',
    beaconActive: '#BA1A1A',
    lowPower: '#B26200',
  },
};

export const darkPalette: ColorPalette = {
  primary: '#A8C7FA',
  onPrimary: '#062E6F',
  primaryContainer: '#0842A0',
  onPrimaryContainer: '#D3E3FD',

  panic: '#FFB4AB',
  onPanic: '#690005',
  panicContainer: '#93000A',
  onPanicContainer: '#FFDAD6',

  warning: '#FFB951',
  onWarning: '#462400',
  warningContainer: '#653800',
  onWarningContainer: '#FFDDB3',

  success: '#6CDD8D',
  onSuccess: '#003915',
  successContainer: '#005322',
  onSuccessContainer: '#C4EED0',

  background: '#111318',
  onBackground: '#E2E2E6',
  surface: '#1A1C1E',
  onSurface: '#E2E2E6',
  surfaceVariant: '#44474F',
  onSurfaceVariant: '#C4C6D0',
  outline: '#8E9099',
  outlineVariant: '#44474F',

  status: {
    offline: '#8E9099',
    online: '#6CDD8D',
    syncing: '#A8C7FA',
    beaconActive: '#FFB4AB',
    lowPower: '#FFB951',
  },
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: lightPalette,
  spacing,
  borderRadius,
  typography,
  motion,
  touchTargets,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: darkPalette,
  spacing,
  borderRadius,
  typography,
  motion,
  touchTargets,
};
