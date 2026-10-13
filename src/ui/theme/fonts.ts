/**
 * Familias tipográficas del sistema de diseño (design/mockups/earthquake_tracker/DESIGN.md).
 * En Android cada peso es un archivo distinto (assets/fonts), por eso el peso se traduce a una familia.
 */
export const fontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
  icons: 'MaterialSymbolsOutlined',
  iconsFilled: 'MaterialSymbolsFilled',
} as const;

export function familyForWeight(weight?: string | number): string {
  const w = weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : Number(weight);
  if (w >= 800) return fontFamily.extrabold;
  if (w >= 700) return fontFamily.bold;
  if (w >= 600) return fontFamily.semibold;
  if (w >= 500) return fontFamily.medium;
  return fontFamily.regular;
}
