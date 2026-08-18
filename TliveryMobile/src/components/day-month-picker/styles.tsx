import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';

export const dayMonthPickerStyles = (theme: ThemeType, isDark: boolean) =>
  StyleSheet.create({
    body: {
      paddingBottom: getHeight(8),
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getHeight(8),
      paddingVertical: getHeight(4),
    },
    monthNavHit: {
      width: getWidth(44),
      height: getWidth(44),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.ui.border,
    },
    monthTitleWrap: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: getWidth(8),
    },
    monthTitlePill: {
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(18),
      borderRadius: getWidth(999),
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.ui.border,
    },
    monthTitleText: {
      color: theme.typography.primary,
      fontSize: moderateScale(15),
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    dowRow: {
      flexDirection: 'row',
      marginBottom: getHeight(10),
      gap: getWidth(5),
    },
    dowCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: getHeight(6),
      minWidth: 0,
    },
    dowLabel: {
      color: theme.typography.caption,
      fontSize: moderateScale(10),
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    gridRow: {
      flexDirection: 'row',
      gap: getWidth(5),
      marginBottom: getHeight(5),
    },
    emptyCell: {
      flex: 1,
    },
    dayOuter: {
      flex: 1,
    },
    dayPress: {
      flex: 1,
      alignSelf: 'stretch',
    },
    dayCard: {
      flex: 1,
      alignSelf: 'stretch',
      borderRadius: getWidth(12),
      overflow: 'hidden',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.09)'
        : 'rgba(255,255,255,0.9)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.ui.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCardToday: {
      borderWidth: 2,
      borderColor: theme.brand.gold,
    },
    dayCardSelected: {
      backgroundColor: theme.brand.gold,
      borderColor: theme.brand.gold,
      borderWidth: 0,
    },
    dayNumber: {
      fontSize: moderateScale(14),
      textAlign: 'center',
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    dayNumberSelected: {
      color: theme.base.white,
    },
    weekendBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 4,
      backgroundColor: isDark ? '#FBBF24' : '#F59E0B',
    },
    closeWrap: {
      alignItems: 'center',
      paddingTop: getHeight(8),
      marginTop: getHeight(6),
    },
    closeButton: {
      width: getWidth(52),
      height: getWidth(52),
      borderRadius: getWidth(26),
      backgroundColor: theme.status.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
