import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';

export const selectCountryStyles = (
  theme: ThemeType,
  _direction: LangDirection,
  isDark: boolean,
) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: getWidth(20),
      paddingTop: getHeight(12),
      paddingBottom: getHeight(8),
      gap: getHeight(6),
    },
    title: {
      color: theme.typography.primary,
      fontSize: moderateScale(24),
      ...cairoFont('bold'),
    },
    subtitle: {
      color: theme.typography.secondary,
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
      ...cairoFont('regular'),
    },
    list: {
      paddingHorizontal: getWidth(16),
      paddingBottom: getHeight(16),
      gap: getHeight(8),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getWidth(12),
      paddingVertical: getHeight(14),
      paddingHorizontal: getWidth(14),
      borderRadius: getWidth(14),
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
    },
    rowActive: {
      borderColor: isDark ? theme.brand.gold : theme.brand.navy,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.08)'
        : 'rgba(15, 42, 68, 0.04)',
    },
    flag: {
      fontSize: moderateScale(28),
    },
    rowText: {
      flex: 1,
      gap: getHeight(2),
    },
    rowTitle: {
      color: theme.typography.primary,
      fontSize: moderateScale(16),
      ...cairoFont('medium'),
    },
    rowDial: {
      color: theme.typography.secondary,
      fontSize: moderateScale(13),
      writingDirection: 'ltr',
      ...cairoFont('regular'),
    },
    footer: {
      paddingHorizontal: getWidth(20),
      paddingBottom: getHeight(16),
      paddingTop: getHeight(8),
    },
  });
