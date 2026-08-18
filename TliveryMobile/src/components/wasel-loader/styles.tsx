import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type WaselLoaderSize = 'sm' | 'md' | 'lg';

const LOGO_PX: Record<WaselLoaderSize, number> = {
  sm: 44,
  md: 64,
  lg: 88,
};

const RING_PX: Record<WaselLoaderSize, number> = {
  sm: 58,
  md: 82,
  lg: 110,
};

export function waselLoaderStyles(theme: ThemeType, size: WaselLoaderSize) {
  const logo = getWidth(LOGO_PX[size]);
  const ring = getWidth(RING_PX[size]);

  return StyleSheet.create({
    inline: {
      width: '100%',
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getHeight(8),
    },
    fullScreen: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.backgrounds.background === '#081020'
          ? 'rgba(8, 16, 32, 0.88)'
          : 'rgba(248, 250, 252, 0.92)',
      zIndex: 50,
    },
    ringWrap: {
      width: ring,
      height: ring,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    ringSvg: {
      width: ring,
      height: ring,
      position: 'absolute',
    },
    logoWrap: {
      width: logo,
      height: logo,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    label: {
      marginTop: getHeight(12),
      textAlign: 'center',
      alignSelf: 'center',
      maxWidth: getWidth(240),
    },
  });
}
