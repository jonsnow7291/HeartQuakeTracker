import { spacing, borderRadius, typography, motion, touchTargets } from './tokens';

export interface ColorPalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  auxiliary: string;
  onAuxiliary: string;
  auxiliaryContainer: string;
  onAuxiliaryContainer: string;

  panic: string;
  onPanic: string;
  panicContainer: string;
  onPanicContainer: string;
  terracottaAlert: string;

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
  primary: '#2A1D13',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DAC2B2',
  onPrimaryContainer: '#25190F',

  secondary: '#D47A22',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FE9C43',
  onSecondaryContainer: '#6C3800',

  tertiary: '#3D7D54',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#AEF2C0',
  onTertiaryContainer: '#00210E',

  auxiliary: '#3F6F8E',
  onAuxiliary: '#FFFFFF',
  auxiliaryContainer: '#C3DCEE',
  onAuxiliaryContainer: '#0A2538',

  panic: '#BA1A1A',
  onPanic: '#FFFFFF',
  panicContainer: '#FFDAD6',
  onPanicContainer: '#410002',
  terracottaAlert: '#C24726',

  background: '#FDF9F2',
  onBackground: '#1C1C18',
  surface: '#FFFFFF',
  onSurface: '#1C1C18',
  surfaceVariant: '#E6E2DB',
  onSurfaceVariant: '#4E453F',
  outline: '#80756E',
  outlineVariant: '#D1C4BC',

  status: {
    offline: '#80756E',
    online: '#3D7D54',
    syncing: '#3F6F8E',
    beaconActive: '#BA1A1A',
    lowPower: '#D47A22',
  },
};

export const darkPalette: ColorPalette = {
  primary: '#DAC2B2',
  onPrimary: '#25190F',
  primaryContainer: '#4A3525',
  onPrimaryContainer: '#F7DECE',

  secondary: '#FFB77D',
  onSecondary: '#462400',
  secondaryContainer: '#653800',
  onSecondaryContainer: '#FFDDB3',

  tertiary: '#93D5A5',
  onTertiary: '#003915',
  tertiaryContainer: '#1B4D2E',
  onTertiaryContainer: '#AEF2C0',

  auxiliary: '#86B6D6',
  onAuxiliary: '#0A2538',
  auxiliaryContainer: '#234960',
  onAuxiliaryContainer: '#C3DCEE',

  panic: '#FFB4AB',
  onPanic: '#690005',
  panicContainer: '#93000A',
  onPanicContainer: '#FFDAD6',
  terracottaAlert: '#C24726',

  background: '#1A1815',
  onBackground: '#F4F0E9',
  surface: '#23201C',
  onSurface: '#F4F0E9',
  surfaceVariant: '#4E453F',
  onSurfaceVariant: '#D1C4BC',
  outline: '#9E9087',
  outlineVariant: '#4E453F',

  status: {
    offline: '#9E9087',
    online: '#93D5A5',
    syncing: '#86B6D6',
    beaconActive: '#FFB4AB',
    lowPower: '#FFB77D',
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
