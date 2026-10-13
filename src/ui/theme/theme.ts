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
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  onSuccessContainer: string;
  successContainer: string;
  warning: string;
  onWarningContainer: string;
  warningContainer: string;

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

/**
 * Colores de marca y de fase (DESIGN.md). Se exponen en el tema para que las pantallas no usen
 * hex fijos: en modo oscuro los tonos claros (crema, arena, espresso) se invierten para mantener
 * el contraste texto/fondo equivalente al del modo claro.
 */
export interface BrandPalette {
  espresso: string;
  espressoSoft: string;
  cream: string;
  sand: string;
  linen: string;
  border: string;
  prevention: string;
  during: string;
  after: string;
  terracotta: string;
  navActive: string;
  navInactive: string;
  onPhase: string;
  /** Relleno oscuro de botones y barras (no se invierte en modo oscuro). */
  fill: string;
  /** Texto/icono sobre `fill`. */
  onFill: string;
}

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
  brand: BrandPalette;
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
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  success: '#2E7D32',
  successContainer: '#DDF0DD',
  onSuccessContainer: '#0F3D12',
  warning: '#B26A00',
  warningContainer: '#FFEBC7',
  onWarningContainer: '#4A2C00',

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
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  success: '#81C784',
  successContainer: '#1B4D2E',
  onSuccessContainer: '#C8E6C9',
  warning: '#FFB74D',
  warningContainer: '#5C3A00',
  onWarningContainer: '#FFE082',

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

/** Marca en modo claro: idéntica a los tokens originales. */
export const lightBrand: BrandPalette = {
  espresso: '#2A1D13',
  espressoSoft: '#988375',
  cream: '#FDF9F2',
  sand: '#F4ECE1',
  linen: '#FAF6F0',
  border: '#E2D5C3',
  prevention: '#3D7D54',
  during: '#D47A22',
  after: '#3F6F8E',
  terracotta: '#C24726',
  navActive: '#FFDCC3',
  navInactive: '#D1C4BC',
  onPhase: '#FFFFFF',
  fill: '#2A1D13',
  onFill: '#FDF9F2',
};

/**
 * Marca en modo oscuro. `espresso`/`cream`/`sand`/`border` se invierten para que los pares
 * (texto espresso sobre crema) y (fondo espresso con texto crema) sigan teniendo contraste.
 * Las fases se aclaran lo justo para verse sobre fondo oscuro manteniendo texto blanco legible.
 */
export const darkBrand: BrandPalette = {
  espresso: '#F4F0E9',
  espressoSoft: '#B7ABA0',
  cream: '#1A1815',
  sand: '#23201C',
  linen: '#23201C',
  border: '#4E453F',
  prevention: '#2F6B45',
  during: '#B25E12',
  after: '#35617E',
  terracotta: '#D2694B',
  navActive: '#E9C9A6',
  navInactive: '#CDBFB3',
  onPhase: '#FFFFFF',
  fill: '#5C4636',
  onFill: '#F4F0E9',
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: lightPalette,
  brand: lightBrand,
  spacing,
  borderRadius,
  typography,
  motion,
  touchTargets,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: darkPalette,
  brand: darkBrand,
  spacing,
  borderRadius,
  typography,
  motion,
  touchTargets,
};
