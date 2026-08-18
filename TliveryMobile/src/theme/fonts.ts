import type {TextStyle} from 'react-native';

export type AppFontWeight = 'regular' | 'medium' | 'bold';

export const Fonts: Record<AppFontWeight, string> = {
  regular: 'Cairo-Regular',
  medium: 'Cairo-Medium',
  bold: 'Cairo-Bold',
};

export function resolveFontWeight(
  weight?: TextStyle['fontWeight'] | number | string | null,
): AppFontWeight {
  if (weight == null || weight === 'normal' || weight === '400') {
    return 'regular';
  }
  if (weight === 'bold') {
    return 'bold';
  }
  const numeric =
    typeof weight === 'number' ? weight : Number.parseInt(String(weight), 10);
  if (!Number.isFinite(numeric)) {
    return 'regular';
  }
  if (numeric >= 700) {
    return 'bold';
  }
  if (numeric >= 500) {
    return 'medium';
  }
  return 'regular';
}

export function cairoFont(
  weight: AppFontWeight = 'regular',
): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  return {
    fontFamily: Fonts[weight],
    fontWeight: 'normal',
  };
}
