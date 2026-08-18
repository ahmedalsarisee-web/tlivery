import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {fontSize, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const listScreenHeaderStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return StyleSheet.create({
    wrap: {
      gap: getHeight(space.sm),
    },
    metaRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      paddingVertical: getHeight(2),
    },
    metaCount: {
      flexShrink: 1,
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    metaSpacer: {
      flex: 1,
    },
    metaActions: {
      alignItems: 'center',
      gap: getWidth(space.sm),
      flexShrink: 0,
    },
    clearBtn: {
      paddingVertical: getHeight(2),
    },
    clearLabel: {
      fontSize: fontSize.caption,
      color: theme.brand.gold,
      ...cairoFont('bold'),
    },
    error: {
      color: theme.status.error,
    },
    sortBtn: {
      paddingHorizontal: getWidth(4),
      paddingVertical: getHeight(2),
    },
    sortLabel: {
      fontSize: fontSize.caption,
      color: accent,
      ...cairoFont('bold'),
    },
  });
};
