import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {getWidth, moderateScale} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';

/** Same inset as English — just enough for flag + dial code. */
const PREFIX_SPACE = getWidth(86);

export const countryPhoneInputStyles = (
  theme: ThemeType,
  _direction: LangDirection,
) =>
  StyleSheet.create({
    phoneInput: {
      textAlign: 'left',
      writingDirection: 'ltr',
      paddingStart: PREFIX_SPACE,
      paddingEnd: getWidth(12),
    },
    countryPrefix: {
      width: getWidth(70),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(5),
    },
    flag: {
      fontSize: moderateScale(18),
      flexShrink: 0,
    },
    countryCode: {
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      writingDirection: 'ltr',
      flexShrink: 0,
      ...cairoFont('medium'),
    },
  });
