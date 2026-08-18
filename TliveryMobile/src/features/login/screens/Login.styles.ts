import {StyleSheet, Platform} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

const PREFIX_SPACE = getWidth(86);

export const loginStyles = (
  theme: ThemeType,
  direction: LangDirection,
  isDark: boolean,
) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backgrounds.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: getWidth(20),
    },
    topBar: {
      position: 'absolute',
      top: getHeight(2),
      start: getWidth(20),
      end: getWidth(20),
      zIndex: 2,
      alignItems: 'flex-end',
    },
    languageBadgeButton: {
      minWidth: getWidth(40),
      minHeight: getHeight(36),
      paddingHorizontal: getWidth(10),
      paddingVertical: getHeight(4),
      borderRadius: getWidth(18),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
    },
    languageBadgeText: {
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      textAlign: 'center',
      ...cairoFont('bold'),
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
    languageBadgeTextAr: {
      transform: [{translateY: Platform.OS === 'ios' ? -3 : -2}],
    },
    main: {
      width: '100%',
      justifyContent: 'center',
      gap: getHeight(10),
    },
    hero: {
      gap: getHeight(4),
      alignItems: 'center',
      paddingBottom: getHeight(4),
    },
    brandRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(8),
      marginBottom: 0,
    },
    welcome: {
      textAlign: 'center',
      fontSize: moderateScale(18),
      color: theme.typography.primary,
      ...cairoFont('medium'),
    },
    subtitle: {
      textAlign: 'center',
      fontSize: moderateScale(13),
      color: theme.typography.secondary,
      ...cairoFont('regular'),
    },
    methodToggle: {
      flexDirection: getFlexDirection(direction),
      gap: getWidth(6),
      padding: getWidth(3),
      borderRadius: moderateScale(12),
      backgroundColor: theme.ui.borderLight,
      borderWidth: 1,
      borderColor: theme.ui.border,
    },
    methodChip: {
      flex: 1,
      minHeight: getHeight(36),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: moderateScale(10),
      paddingHorizontal: getWidth(8),
    },
    methodChipActive: {
      backgroundColor: theme.backgrounds.surface,
      borderWidth: 1,
      borderColor: theme.brand.gold,
    },
    methodChipLabel: {
      fontSize: moderateScale(13),
      color: theme.typography.secondary,
      textAlign: 'center',
      ...cairoFont('medium'),
    },
    methodChipLabelActive: {
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    form: {
      width: '100%',
      paddingBottom: 0,
    },
    identifierInputRtl: {
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    actions: {
      paddingTop: getHeight(4),
      gap: getHeight(2),
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      paddingVertical: 0,
      marginTop: getHeight(-4),
    },
    phoneInput: {
      textAlign: 'left',
      writingDirection: 'ltr',
      ...(isRTL(direction)
        ? {paddingEnd: PREFIX_SPACE}
        : {paddingStart: PREFIX_SPACE}),
    },
    countryPrefix: {
      width: getWidth(70),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(5),
    },
    flag: {
      fontSize: moderateScale(18),
    },
    countryCode: {
      color: theme.typography.primary,
      fontSize: moderateScale(14),
      writingDirection: 'ltr',
      ...cairoFont('medium'),
    },
    footerLink: {
      alignItems: 'center',
      paddingVertical: getHeight(4),
    },
    footerLinkText: {
      fontSize: moderateScale(13),
      color: theme.typography.secondary,
      textAlign: 'center',
      ...cairoFont('regular'),
    },
    footerLinkAccent: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
      ...cairoFont('bold'),
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
      ...cairoFont('medium'),
    },
    itemLabelActive: {
      ...cairoFont('bold'),
    },
  });
