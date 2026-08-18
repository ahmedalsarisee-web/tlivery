import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const completeProfileStyles = (
  theme: ThemeType,
  direction: LangDirection,
  isDark: boolean,
) => {
  const gold = theme.brand.gold;
  const rtl = isRTL(direction);

  return StyleSheet.create({
    stack: {
      gap: getHeight(space.sm),
      paddingBottom: getHeight(space.md),
    },
    intro: {
      color: theme.typography.secondary,
      fontSize: fontSize.body,
      textAlign: getTextAlign(direction),
      lineHeight: fontSize.body + 6,
      ...cairoFont('medium'),
    },
    card: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      padding: getWidth(space.sm),
      gap: getHeight(space.xs),
      ...elevation.card,
    },
    sectionTitle: {
      color: theme.typography.primary,
      fontSize: fontSize.section,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    fieldGroup: {
      gap: getHeight(4),
    },
    fieldLabel: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('medium'),
    },
    fieldBox: {
      minHeight: getHeight(40),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : theme.backgrounds.background,
      paddingHorizontal: getWidth(space.sm),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
    },
    fieldInput: {
      flex: 1,
      color: theme.typography.primary,
      fontSize: fontSize.body,
      textAlign: getTextAlign(direction),
      writingDirection: rtl ? 'rtl' : 'ltr',
      paddingVertical: getHeight(8),
      ...cairoFont('medium'),
    },
    hint: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    verifiedText: {
      color: theme.status.success,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    debugOtpBanner: {
      marginTop: getHeight(6),
      padding: getWidth(space.sm),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: gold,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.16)'
        : 'rgba(212, 175, 55, 0.12)',
      gap: getHeight(4),
    },
    debugOtpTitle: {
      color: theme.typography.primary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    debugOtpCode: {
      color: theme.typography.primary,
      fontSize: fontSize.section,
      letterSpacing: 4,
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    debugOtpHint: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    otpRow: {
      marginTop: getHeight(2),
    },
    emptySearch: {
      minHeight: getHeight(40),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : '#E5E7EB',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      paddingHorizontal: getWidth(space.sm),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    emptySearchText: {
      flex: 1,
      color: theme.typography.secondary,
      fontSize: fontSize.body,
      textAlign: getTextAlign(direction),
      ...cairoFont('medium'),
    },
    locationBody: {
      gap: getHeight(space.xs),
    },
    locationTextCol: {
      gap: getHeight(4),
    },
    locationTitle: {
      color: theme.typography.primary,
      fontSize: fontSize.cardTitle,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    locationSub: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    locationFooter: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
    },
    pinBadge: {
      width: getWidth(32),
      height: getWidth(32),
      borderRadius: getWidth(16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.status.success,
    },
    changeBtn: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(2),
    },
    changeText: {
      color: gold,
      fontSize: fontSize.body,
      ...cairoFont('bold'),
    },
  });
};
