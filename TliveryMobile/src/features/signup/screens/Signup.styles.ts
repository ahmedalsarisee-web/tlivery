import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

export const signupStyles = (
  theme: ThemeType,
  direction: LangDirection,
  isDark: boolean,
) =>
  StyleSheet.create({
    header: {
      gap: getHeight(6),
      marginBottom: getHeight(16),
    },
    title: {
      fontSize: moderateScale(22),
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    subtitle: {
      fontSize: moderateScale(14),
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    form: {
      width: '100%',
      paddingBottom: getHeight(28),
      gap: getHeight(8),
    },
    roleList: {
      gap: getHeight(10),
      marginBottom: getHeight(16),
    },
    roleCard: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(14),
      paddingVertical: getHeight(14),
      paddingHorizontal: getWidth(14),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(12),
    },
    roleCardActive: {
      borderColor: theme.brand.gold,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.12)'
        : 'rgba(212, 175, 55, 0.1)',
    },
    roleIconWrap: {
      width: getWidth(44),
      height: getWidth(44),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
    },
    roleTextCol: {
      flex: 1,
      gap: getHeight(2),
    },
    roleTitle: {
      fontSize: moderateScale(16),
      color: theme.typography.primary,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    roleBody: {
      fontSize: moderateScale(13),
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    chipRow: {
      flexDirection: getFlexDirection(direction),
      flexWrap: 'wrap',
      gap: getWidth(8),
    },
    chip: {
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(20),
      paddingVertical: getHeight(6),
      paddingHorizontal: getWidth(12),
    },
    chipActive: {
      borderColor: theme.brand.gold,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.12)'
        : 'rgba(212, 175, 55, 0.1)',
    },
    chipLabel: {
      fontSize: moderateScale(13),
      color: theme.typography.primary,
      ...cairoFont('medium'),
    },
    chipLabelActive: {
      ...cairoFont('bold'),
    },
    sectionLabel: {
      fontSize: moderateScale(13),
      color: theme.typography.secondary,
      textAlign: getTextAlign(direction),
      marginBottom: getHeight(2),
      ...cairoFont('medium'),
    },
    footerLink: {
      marginTop: getHeight(8),
      alignItems: 'center',
      paddingVertical: getHeight(8),
    },
    footerLinkText: {
      fontSize: moderateScale(14),
      color: theme.typography.secondary,
      textAlign: 'center',
      ...cairoFont('regular'),
    },
    footerLinkAccent: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
      ...cairoFont('bold'),
    },
    pendingWrap: {
      alignItems: 'center',
      gap: getHeight(12),
      paddingTop: getHeight(24),
      paddingBottom: getHeight(28),
    },
    pendingIconWrap: {
      width: getWidth(72),
      height: getWidth(72),
      borderRadius: getWidth(36),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.16)'
        : 'rgba(212, 175, 55, 0.14)',
      marginBottom: getHeight(4),
    },
    pendingTitle: {
      fontSize: moderateScale(22),
      color: theme.typography.primary,
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    pendingBody: {
      fontSize: moderateScale(14),
      color: theme.typography.secondary,
      textAlign: 'center',
      lineHeight: moderateScale(22),
      ...cairoFont('regular'),
    },
    referenceBox: {
      marginTop: getHeight(4),
      marginBottom: getHeight(8),
      borderWidth: 1,
      borderColor: theme.ui.border,
      borderRadius: moderateScale(12),
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(16),
      backgroundColor: theme.backgrounds.surface,
      alignItems: 'center',
      gap: getHeight(2),
    },
    referenceLabel: {
      fontSize: moderateScale(12),
      color: theme.typography.secondary,
      ...cairoFont('regular'),
    },
    referenceValue: {
      fontSize: moderateScale(16),
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    ltrInput: {
      textAlign: 'left',
      writingDirection: 'ltr',
    },
  });
