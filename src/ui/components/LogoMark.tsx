import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/** Logo oficial (design/mockups/earthquake_tracker_logo): escudo, skyline, pulso sísmico y grieta. */
export function LogoMark({ size = 96 }: { size?: number }) {
  const { brand } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel="Logo de EarthQuakeTracker">
      <Defs>
        <LinearGradient id="eqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={brand.during} />
          <Stop offset="100%" stopColor={brand.terracotta} />
        </LinearGradient>
      </Defs>
      <Path d="M100 20 C55 20 25 55 25 95 C25 135 65 170 100 185 C135 170 175 135 175 95 C175 55 145 20 100 20 Z" fill={brand.espresso} />
      <Path d="M100 28 C60 28 33 60 33 95 C33 130 70 162 100 175 C130 162 167 130 167 95 C167 60 140 28 100 28 Z" fill={brand.sand} />
      <Path d="M50 120 L50 105 L60 105 L60 95 L72 95 L72 110 L80 110 L80 90 L92 90 L92 120 Z" fill={brand.espresso} />
      <Path d="M108 120 L108 85 L120 85 L120 100 L130 100 L130 92 L142 92 L142 120 Z" fill={brand.espresso} />
      <Path d="M40 108 L70 108 L82 80 L92 130 L104 65 L116 125 L126 95 L136 108 L160 108" fill="none" stroke={brand.during} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M100 122 L96 135 L103 148 L97 160 L100 172" fill="none" stroke={brand.espresso} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
