import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { AppTheme, darkTheme, lightTheme } from './theme';

/** Preferencia del usuario: seguir al sistema o forzar claro/oscuro. */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_SERVICE = 'eqt.theme';

interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  preference: 'system',
  setPreference: () => {},
});

/**
 * Por defecto sigue el esquema del sistema (`useColorScheme()`); el usuario puede forzar claro u
 * oscuro desde Perfil y la elección se recuerda en el Keychain/Keystore (no es un dato sensible,
 * pero evita añadir otra dependencia de almacenamiento antes de que arranquen los servicios).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    Keychain.getGenericPassword({ service: STORAGE_SERVICE })
      .then((r) => {
        if (active && r && (r.password === 'light' || r.password === 'dark')) setPref(r.password);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    Keychain.setGenericPassword('theme', p, { service: STORAGE_SERVICE }).catch(() => {});
  }, []);

  const dark = preference === 'system' ? scheme === 'dark' : preference === 'dark';
  const value = useMemo(
    () => ({ theme: dark ? darkTheme : lightTheme, preference, setPreference }),
    [dark, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext).theme;
}

/** Preferencia de tema y su setter (para el selector de Perfil). */
export function useThemePreference(): Pick<ThemeContextValue, 'preference' | 'setPreference'> {
  const { preference, setPreference } = useContext(ThemeContext);
  return { preference, setPreference };
}

/** Atajo para construir hojas de estilo a partir del tema activo, memoizadas por tema. */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
