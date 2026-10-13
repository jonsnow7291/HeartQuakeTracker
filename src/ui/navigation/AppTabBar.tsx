import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const ICONS: Record<string, string> = { Home: 'home', Map: 'map', Alerts: 'crisis_alert', Profile: 'person' };

/**
 * Barra inferior del mockup: fondo espresso, pestaña activa con relleno y píldora tenue,
 * ícono Material Symbols de 24 px y etiqueta labelMd (design/mockups/inicio_earthquake_tracker).
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { brand } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key]!;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const color = focused ? brand.navActive : brand.navInactive;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            accessibilityHint={focused ? 'Pestaña activa' : `Abre la pestaña ${label}`}
            onPress={onPress}
            style={[styles.item, focused && styles.itemActive]}
          >
            <Icon name={ICONS[route.name] ?? 'circle'} size={24} color={color} filled={focused} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ brand }: AppTheme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: brand.fill,
      paddingTop: 8,
      paddingHorizontal: 8,
      shadowColor: brand.espresso,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    item: { alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 64, minHeight: 48, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    itemActive: { backgroundColor: 'rgba(230,226,219,0.10)' },
    label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.12 },
  });
