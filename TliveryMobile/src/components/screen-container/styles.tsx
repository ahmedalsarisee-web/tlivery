import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const screenContainerStyles = (
  theme: ThemeType,
  themeType: 'light' | 'dark' = 'light',
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        themeType === 'light' ? theme.base.white : theme.backgrounds.background,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
    padded: {
      padding: getWidth(20),
      gap: getHeight(16),
    },
  });
