import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';
import {radius, space} from '@app/theme/tokens';

export const profileStyles = (theme: ThemeType, direction: LangDirection) => {
  const rtl = isRTL(direction);
  return StyleSheet.create({
    headerCard: {
      gap: getHeight(space.sm),
    },
    headerRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(space.md),
    },
    avatar: {
      width: getWidth(64),
      height: getWidth(64),
      borderRadius: getWidth(32),
      borderWidth: 2,
      borderColor: theme.brand.gold,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.backgrounds.surface === theme.backgrounds.background
          ? theme.ui.borderLight
          : theme.backgrounds.background,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitials: {
      color: theme.brand.gold,
    },
    headerText: {
      flex: 1,
      gap: getHeight(4),
    },
    name: {
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
    },
    ratingRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(4),
    },
    ratingText: {
      color: theme.typography.secondary,
    },
    viewProfile: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(2),
      alignSelf: rtl ? 'flex-end' : 'flex-start',
    },
    viewProfileText: {
      color: theme.typography.secondary,
    },
    menuCard: {
      paddingVertical: getHeight(4),
      paddingHorizontal: 0,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      paddingVertical: getHeight(14),
      paddingHorizontal: getWidth(space.md),
    },
    menuRowPressed: {
      backgroundColor: theme.ui.borderLight,
    },
    menuRowDanger: {},
    menuLeft: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(12),
      flex: 1,
    },
    menuIcon: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.typography.primary === '#F8FAFC'
          ? 'rgba(212, 175, 55, 0.2)'
          : 'rgba(212, 175, 55, 0.14)',
    },
    menuIconDanger: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    menuText: {
      flex: 1,
      gap: getHeight(2),
    },
    menuLabel: {
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
    },
    menuLabelDanger: {
      color: theme.status.error,
    },
    menuSubtitle: {
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.ui.border,
      marginStart: getWidth(40 + 12 + space.md),
      marginEnd: getWidth(space.md),
    },
    sheetList: {
      gap: getHeight(4),
      paddingBottom: getHeight(2),
    },
    sheetItem: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(10),
      paddingVertical: getHeight(8),
      paddingHorizontal: getWidth(12),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
    },
    sheetItemActive: {
      backgroundColor: theme.ui.borderLight,
      borderColor: theme.brand.gold,
    },
    flagText: {
      fontSize: moderateScale(18),
      textAlign: 'center',
      minWidth: getWidth(28),
      lineHeight: moderateScale(22),
    },
    itemLabel: {
      flex: 1,
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      textAlign: getTextAlign(direction),
      writingDirection: rtl ? 'rtl' : 'ltr',
      ...cairoFont('medium'),
    },
    itemLabelActive: {
      ...cairoFont('bold'),
    },
    // My Vehicle
    vehicleHero: {
      width: '100%',
      height: getHeight(180),
      borderRadius: radius.lg,
      backgroundColor: theme.ui.borderLight,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleHeroImage: {
      width: '100%',
      height: '100%',
    },
    vehicleTitleRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      marginTop: getHeight(space.sm),
    },
    vehicleTitle: {
      flex: 1,
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
    },
    plateBadge: {
      paddingHorizontal: getWidth(10),
      paddingVertical: getHeight(6),
      borderRadius: radius.sm,
      backgroundColor: theme.ui.borderLight,
      borderWidth: 1,
      borderColor: theme.ui.border,
    },
    plateText: {
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    infoRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      paddingVertical: getHeight(12),
    },
    infoLabel: {
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
    },
    infoValue: {
      color: theme.typography.primary,
      textAlign: rtl ? 'left' : 'right',
      flexShrink: 1,
    },
    infoDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.ui.border,
    },
  });
};
