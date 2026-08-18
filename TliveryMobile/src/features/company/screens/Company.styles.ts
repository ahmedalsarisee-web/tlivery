import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';

export const companyStyles = (_theme: ThemeType, _direction: LangDirection) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(4),
      borderRadius: moderateScale(6),
    },
    metaRow: {
      marginTop: getHeight(2),
    },
    mapPlaceholder: {
      height: getHeight(120),
      borderRadius: moderateScale(12),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getHeight(4),
    },
  });
