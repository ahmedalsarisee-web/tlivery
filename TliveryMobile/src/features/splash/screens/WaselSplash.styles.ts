import {StyleSheet} from 'react-native';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';

export const splashPalette = {
  light: {
    canvas: '#F8FAFC',
    title: '#0F172A',
    subtitle: '#64748B',
    gold: '#D4AF37',
  },
  dark: {
    canvas: '#081020',
    title: '#F8FAFC',
    subtitle: '#94A3B8',
    gold: '#D4AF37',
  },
} as const;

export const waselSplashStyles = (themeType: 'light' | 'dark') => {
  const palette = splashPalette[themeType];

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.canvas,
    },
    fullBg: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getWidth(28),
    },
    brandBlock: {
      alignItems: 'center',
      width: '100%',
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getHeight(28),
    },
    tagBlock: {
      alignItems: 'center',
      width: '100%',
      maxWidth: getWidth(320),
    },
    ornamentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getHeight(18),
      gap: getWidth(10),
    },
    ornamentLine: {
      height: StyleSheet.hairlineWidth * 2,
      width: getWidth(48),
      backgroundColor: palette.gold,
      opacity: 0.9,
    },
    ornamentDiamond: {
      width: getWidth(8),
      height: getWidth(8),
      backgroundColor: palette.gold,
      transform: [{rotate: '45deg'}],
    },
    taglineAr: {
      color: palette.title,
      fontSize: moderateScale(22),
      lineHeight: moderateScale(34),
      ...cairoFont('bold'),
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    taglineEn: {
      marginTop: getHeight(10),
      color: palette.subtitle,
      fontSize: moderateScale(12),
      lineHeight: moderateScale(18),
      ...cairoFont('medium'),
      letterSpacing: 1.4,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });
};
