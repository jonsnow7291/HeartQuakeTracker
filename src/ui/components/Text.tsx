import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { familyForWeight } from '../theme/fonts';
import { useTheme } from '../theme/ThemeProvider';

type TextComponentProps = React.ComponentProps<typeof RNText>;
type TextInputComponentProps = React.ComponentProps<typeof RNTextInput>;

/**
 * Resuelve fontFamily a partir de fontWeight para que todo el texto use Plus Jakarta Sans con el peso
 * correcto y aplica el color de texto del tema cuando el llamador no fija uno.
 */
function withFont(style: TextComponentProps['style'], defaultColor: string) {
  const flat = StyleSheet.flatten(style) ?? {};
  const additions: Record<string, unknown> = {};
  if (!flat.fontFamily) {
    additions.fontFamily = familyForWeight(flat.fontWeight);
    additions.fontWeight = 'normal';
  }
  if (flat.color === undefined) {
    additions.color = defaultColor;
  }
  return Object.keys(additions).length > 0 ? [style, additions] : style;
}

// React 19 pasa `ref` como una prop más: se reenvía con {...props}.
export function Text(props: TextComponentProps) {
  const { colors } = useTheme();
  return <RNText {...props} style={withFont(props.style, colors.onBackground)} />;
}

export function TextInput(props: TextInputComponentProps) {
  const { colors } = useTheme();
  return <RNTextInput {...props} style={withFont(props.style as TextComponentProps['style'], colors.onSurface)} />;
}
