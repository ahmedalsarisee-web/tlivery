import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

export const notificationsStyles = (
  theme: ThemeType,
  direction: LangDirection,
) => {
  const rtl = isRTL(direction);

  return StyleSheet.create({
    rootPad: {
      paddingBottom: getHeight(8),
    },
    toolbar: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(12),
      marginBottom: getHeight(4),
    },
    filters: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
      flex: 1,
    },
    filterChip: {
      paddingHorizontal: getWidth(14),
      paddingVertical: getHeight(7),
      borderRadius: moderateScale(20),
      backgroundColor: theme.backgrounds.surface,
      borderWidth: 1,
      borderColor: theme.ui.border,
    },
    filterChipActive: {
      backgroundColor: theme.brand.navy,
      borderColor: theme.brand.navy,
    },
    filterLabel: {
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
      color: theme.typography.secondary,
    },
    filterLabelActive: {
      color: theme.base.white,
    },
    markAll: {
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
      color: theme.brand.gold,
      paddingVertical: getHeight(6),
    },
    unreadBanner: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
      marginBottom: getHeight(4),
    },
    unreadCount: {
      fontSize: moderateScale(12),
      ...cairoFont('medium'),
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
    },
    sectionLabel: {
      marginTop: getHeight(12),
      marginBottom: getHeight(8),
      fontSize: moderateScale(12),
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      ...cairoFont('bold'),
      color: theme.typography.caption,
      textAlign: getTextAlign(direction),
    },
    list: {
      gap: getHeight(10),
    },
    row: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'flex-start',
      gap: getWidth(12),
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(16),
      paddingHorizontal: getWidth(14),
      paddingVertical: getHeight(14),
      borderWidth: 1,
      borderColor: theme.ui.borderLight,
    },
    rowUnread: {
      borderColor: `${theme.brand.gold}55`,
    },
    iconWrap: {
      width: getWidth(42),
      height: getWidth(42),
      borderRadius: getWidth(14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyCol: {
      flex: 1,
      gap: getHeight(4),
    },
    titleRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(8),
    },
    title: {
      flex: 1,
      fontSize: moderateScale(15),
      ...cairoFont('bold'),
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
    },
    time: {
      fontSize: moderateScale(11),
      ...cairoFont('regular'),
      color: theme.typography.caption,
    },
    body: {
      fontSize: moderateScale(13),
      lineHeight: moderateScale(20),
      ...cairoFont('regular'),
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
    },
    unreadDot: {
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.brand.gold,
      marginTop: getHeight(6),
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getHeight(64),
      gap: getHeight(12),
    },
    emptyIcon: {
      width: getWidth(72),
      height: getWidth(72),
      borderRadius: getWidth(36),
      backgroundColor: `${theme.brand.gold}22`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getHeight(4),
    },
    emptyTitle: {
      fontSize: moderateScale(18),
      ...cairoFont('bold'),
      color: theme.typography.primary,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: moderateScale(14),
      lineHeight: moderateScale(22),
      ...cairoFont('regular'),
      color: theme.typography.secondary,
      textAlign: 'center',
      paddingHorizontal: getWidth(24),
    },
    chevron: {
      transform: [{scaleX: rtl ? -1 : 1}],
      marginTop: getHeight(4),
      opacity: 0.45,
    },
  });
};
