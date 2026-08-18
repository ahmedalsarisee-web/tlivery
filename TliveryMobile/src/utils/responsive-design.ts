import {
  scale,
  verticalScale,
  moderateScale as rnModerateScale,
} from 'react-native-size-matters';

export const getWidth = (n: number) => scale(n);
export const getHeight = (n: number) => verticalScale(n);

/** Gentler than size-matters default (0.5) so type stays compact on large phones. */
export const moderateScale = (size: number, factor = 0.3) =>
  rnModerateScale(size, factor);

/** Prefer for fontSize — minimal upscaling vs layout scale helpers. */
export const scaleFont = (size: number) => rnModerateScale(size, 0.2);
