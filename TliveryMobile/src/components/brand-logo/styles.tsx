import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';
import {BrandLogoSize, BrandLogoTone} from '@app/types/brandLogo.props';

export const brandLogoStyles = (
  theme: ThemeType,
  _direction: LangDirection,
  size: BrandLogoSize,
  tone: BrandLogoTone,
) => {
  const onDark = tone === 'onDark';
  const textColor = onDark ? theme.base.white : '#0F172A';
  const isHeader = size === 'header';

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isHeader ? getWidth(8) : getWidth(14),
    },
    wordmark: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    nameAr: {
      color: textColor,
      fontSize: isHeader ? moderateScale(22) : moderateScale(44),
      lineHeight: isHeader ? moderateScale(32) : moderateScale(56),
      ...cairoFont('bold'),
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    nameEnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: getHeight(1),
      alignSelf: 'center',
    },
    nameEnRowFallback: {
      minWidth: isHeader ? getWidth(72) : getWidth(140),
    },
    nameEnLetter: {
      color: textColor,
      fontSize: isHeader ? moderateScale(11) : moderateScale(18),
      lineHeight: isHeader ? moderateScale(15) : moderateScale(24),
      ...cairoFont('bold'),
      includeFontPadding: false,
      textAlign: 'center',
    },
    symbol: {
      width: isHeader ? getWidth(36) : getWidth(72),
      height: isHeader ? getHeight(40) : getHeight(80),
    },
  });
};
