import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

const NAVY = '#0B1B3A';

export const ordersStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark' = 'light',
) => {
  const isDark = themeType === 'dark';
  const navy = isDark ? theme.brand.navy : NAVY;
  const border = isDark ? theme.ui.border : '#E2E8F0';

  return StyleSheet.create({
    dateChip: {
      alignItems: 'center',
      gap: getWidth(8),
      minHeight: getHeight(36),
      paddingHorizontal: getWidth(12),
      borderRadius: radius.pill,
      backgroundColor: theme.ui.borderLight,
    },
    clearBtn: {
      minHeight: getHeight(36),
      justifyContent: 'center',
      paddingHorizontal: getWidth(8),
    },
    badge: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(4),
      borderRadius: radius.sm,
    },
    timelineDot: {
      width: getWidth(10),
      height: getWidth(10),
      borderRadius: getWidth(5),
      marginTop: getHeight(4),
    },
    timelineLine: {
      width: 2,
      flex: 1,
      minHeight: getHeight(16),
      marginVertical: getHeight(4),
      alignSelf: 'center',
    },
    quoteSelected: {
      borderWidth: 2,
    },
    mapPlaceholder: {
      height: getHeight(140),
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.ui.borderLight,
    },
    sectionGap: {
      marginTop: getHeight(4),
    },
    mono: {
      ...cairoFont('bold'),
      fontSize: 13,
    },

    companyChrome: {
      backgroundColor: navy,
      paddingBottom: getHeight(22),
      paddingHorizontal: getWidth(18),
    },
    companyChromeTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: getHeight(44),
      marginBottom: getHeight(4),
    },
    companyChromeIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    companyChromeBellDot: {
      position: 'absolute',
      top: 9,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#F5C518',
      borderWidth: 1.5,
      borderColor: navy,
    },
    companyChromeTitleWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 48,
      pointerEvents: 'none',
    },
    companyChromeTitle: {
      fontSize: 20,
      lineHeight: 28,
      color: '#FFFFFF',
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    companyChromeSub: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 18,
      color: 'rgba(226,232,240,0.9)',
      textAlign: 'center',
      ...cairoFont('medium'),
    },
    companyBody: {
      flex: 1,
      marginTop: getHeight(-18),
      backgroundColor: isDark ? theme.backgrounds.primary : '#F5F7FB',
      overflow: 'hidden',
    },
    companyTabsBar: {
      backgroundColor: isDark ? theme.backgrounds.surface : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: getHeight(6),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? theme.ui.border : '#E8EEF5',
      shadowColor: '#0F172A',
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 6,
      shadowOffset: {width: 0, height: 2},
      elevation: isDark ? 0 : 1,
    },
    companyTabsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: getWidth(8),
      minWidth: '100%',
    },
    companyTab: {
      flexGrow: 1,
      flexShrink: 0,
      minWidth: getWidth(76),
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: getHeight(12),
      paddingBottom: getHeight(10),
      paddingHorizontal: getWidth(10),
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    companyTabActive: {
      borderBottomColor: '#3B4F9C',
    },
    companyTabText: {
      fontSize: 11,
      lineHeight: 15,
      color: isDark ? theme.typography.secondary : '#4A5568',
      textAlign: 'center',
      ...cairoFont('medium'),
    },
    companyTabTextActive: {
      color: isDark ? theme.brand.gold : '#2C3A7A',
      ...cairoFont('bold'),
    },
    companyStatsRow: {
      flexDirection: getFlexDirection(direction),
      gap: getWidth(8),
      marginTop: getHeight(2),
    },
    companyStatCard: {
      flex: 1,
      minWidth: 0,
      borderRadius: 14,
      paddingVertical: getHeight(12),
      paddingHorizontal: getWidth(4),
      alignItems: 'center',
      gap: getHeight(3),
    },
    companyStatValue: {
      fontSize: 18,
      lineHeight: 22,
      color: '#0F172A',
      ...cairoFont('bold'),
    },
    companyStatLabel: {
      fontSize: 9,
      lineHeight: 12,
      textAlign: 'center',
      color: '#64748B',
      ...cairoFont('medium'),
    },
    companySearchWrap: {
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      paddingHorizontal: 14,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: 10,
      shadowColor: '#0F172A',
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 2},
      elevation: isDark ? 0 : 1,
    },
    companySearchInput: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      fontSize: 12,
      color: isDark ? theme.typography.primary : '#0F172A',
      textAlign: getTextAlign(direction),
      paddingVertical: 0,
      ...cairoFont('medium'),
    },
    companyStickyBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: getWidth(16),
      paddingTop: getHeight(10),
      flexDirection: getFlexDirection(direction),
      gap: getWidth(10),
      backgroundColor: isDark
        ? 'rgba(15,23,42,0.94)'
        : 'rgba(245,247,251,0.96)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    companyStickyPrimary: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      backgroundColor: navy,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowColor: navy,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 4},
      elevation: 3,
    },
    companyStickyPrimaryText: {
      color: '#FFFFFF',
      fontSize: 14,
      ...cairoFont('bold'),
    },
    companyListGap: {
      height: getHeight(8),
    },
  });
};
