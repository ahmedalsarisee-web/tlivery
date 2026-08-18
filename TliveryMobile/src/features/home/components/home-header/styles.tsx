import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

export const homeHeaderStyles = (
  theme: ThemeType,
  direction: LangDirection,
) => {
  const rtl = isRTL(direction);

  return StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      overflow: 'visible',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
    },
    safe: {
      backgroundColor: 'transparent',
    },
    chrome: {
      position: 'relative',
      overflow: 'visible',
      backgroundColor: theme.brand.navy,
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 6},
      elevation: 12,
    },
    navRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getWidth(16),
      paddingTop: getHeight(4),
      paddingBottom: getHeight(2),
      minHeight: getHeight(48),
      backgroundColor: 'transparent',
    },
    sideSlot: {
      minWidth: getWidth(44),
      minHeight: getHeight(40),
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideSlotStart: {
      alignItems: rtl ? 'flex-end' : 'flex-start',
    },
    sideSlotEnd: {
      alignItems: rtl ? 'flex-start' : 'flex-end',
    },

    bellWrap: {
      position: 'relative',
      padding: getWidth(4),
    },
    goldBadge: {
      position: 'absolute',
      top: getHeight(2),
      ...(rtl
        ? {left: getWidth(2)}
        : {right: getWidth(2)}),
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.brand.gold,
    },

    logoGroup: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getWidth(8),
    },

    titleOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getWidth(56),
      pointerEvents: 'none',
    },
    pageTitle: {
      color: theme.base.white,
      fontSize: moderateScale(17),
      ...cairoFont('bold'),
      textAlign: 'center',
      writingDirection: rtl ? 'rtl' : 'ltr',
    },

    profileDropdown: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(6),
    },
    avatarCircle: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(20),
      borderWidth: 1.5,
      borderColor: theme.brand.gold,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.brand.gold,
      fontSize: moderateScale(13),
      ...cairoFont('bold'),
    },
  });
};
