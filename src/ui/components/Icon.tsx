import React from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { fontFamily } from '../theme/fonts';
import { useTheme } from '../theme/ThemeProvider';

export interface IconProps {
  /** Nombre de Material Symbols (ligadura), p. ej. "home", "crisis_alert", "chevron_right". */
  name: string;
  size?: number;
  color?: string;
  /** Variante rellena (pestaña activa en los mockups). */
  filled?: boolean;
  style?: StyleProp<TextStyle>;
}

/** Ícono Material Symbols Outlined, el mismo conjunto que usan los mockups. Decorativo para lectores de pantalla. */
export function Icon({ name, size = 24, color, filled, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <RNText
      accessible={false}
      importantForAccessibility="no"
      allowFontScaling={false}
      style={[{ fontFamily: filled ? fontFamily.iconsFilled : fontFamily.icons, fontSize: size, lineHeight: size, color: color ?? colors.onBackground, fontWeight: 'normal', letterSpacing: 0 }, style]}
    >
      {name}
    </RNText>
  );
}
