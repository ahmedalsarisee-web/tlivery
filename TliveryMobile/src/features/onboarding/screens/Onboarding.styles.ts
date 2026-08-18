import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

export const onboardingStyles = (
  theme: ThemeType,
  direction: LangDirection,
) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backgrounds.background,
    },
    list: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'transparent',
    },
    slide: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    slideRtlUnmirror: {
      transform: [{scaleX: -1}],
    },
    artClip: {
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
    },
    artImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '106%',
    },
    bottomPanel: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: getHeight(48),
      paddingHorizontal: getWidth(24),
      gap: getHeight(12),
      justifyContent: 'flex-end',
    },
    copy: {
      gap: getHeight(8),
    },
    title: {
      color: theme.typography.primary,
      fontSize: moderateScale(26),
      lineHeight: moderateScale(34),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    body: {
      color: theme.typography.secondary,
      fontSize: moderateScale(15),
      lineHeight: moderateScale(23),
      ...cairoFont('regular'),
      textAlign: getTextAlign(direction),
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 4,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: getWidth(20),
      paddingBottom: getHeight(4),
      minHeight: getHeight(40),
    },
    skip: {
      color: theme.brand.gold,
      fontSize: moderateScale(14),
      ...cairoFont('medium'),
      paddingVertical: getHeight(8),
      paddingHorizontal: getWidth(10),
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 4,
    },
    dots: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(8),
    },
    dot: {
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.ui.border,
    },
    dotActive: {
      width: getWidth(22),
      backgroundColor: theme.brand.gold,
    },
    actions: {
      gap: getHeight(8),
    },
  });
