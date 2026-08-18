import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {getWidth, moderateScale} from '@app/utils/responsive-design';
import {isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

const PREFIX_SPACE = getWidth(86);

export const jordanPhoneInputStyles = (
  theme: ThemeType,
  direction: LangDirection,
) =>
  StyleSheet.create({
    phoneInput: {
      textAlign: 'left',
      writingDirection: 'ltr',
      ...(isRTL(direction)
        ? {paddingEnd: PREFIX_SPACE}
        : {paddingStart: PREFIX_SPACE}),
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
    },
    countryCode: {
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      writingDirection: 'ltr',
      ...cairoFont('medium'),
    },
  });
