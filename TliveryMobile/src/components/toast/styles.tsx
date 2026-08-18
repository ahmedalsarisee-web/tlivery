import {Dimensions, Platform, StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';

const screenWidth = Dimensions.get('window').width;

export const toastStyles = (theme: ThemeType, direction: LangDirection) =>
  StyleSheet.create({
    safeArea: {
      position: 'absolute',
      top: Platform.OS === 'android' ? getHeight(-28) : 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10000,
      elevation: Platform.OS === 'android' ? 100 : 0,
      pointerEvents: 'box-none',
    },
    toastContainer: {
      alignItems: 'center',
      backgroundColor: theme.backgrounds.surface,
      width: screenWidth - getWidth(20),
      marginHorizontal: getWidth(10),
      borderRadius: getWidth(10),
      paddingVertical: getWidth(10),
      borderStartWidth: 5,
      elevation: 4,
      shadowColor: theme.ui.shadow,
      shadowOpacity: 0.1,
      shadowOffset: {width: 0, height: 2},
      shadowRadius: 6,
      flexDirection: getFlexDirection(direction),
    },
    iconCircle: {
      width: getWidth(30),
      height: getWidth(30),
      borderRadius: getWidth(15),
      backgroundColor: theme.ui.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: getWidth(10),
    },
    icon: {
      fontSize: moderateScale(16),
    },
    toastText: {
      fontSize: moderateScale(14),
      ...cairoFont('medium'),
      flex: 1,
      marginEnd: getWidth(10),
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
    },
  });
