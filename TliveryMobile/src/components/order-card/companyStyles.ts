import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import type {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const companyOrderCardStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const align = getTextAlign(direction);
  const border = isDark ? theme.ui.border : '#E2E8F0';

  return StyleSheet.create({
    card: {
      width: '100%',
      alignSelf: 'stretch',
      borderRadius: 10,
      backgroundColor: isDark ? theme.backgrounds.surface : '#FFFFFF',
      borderWidth: 1,
      borderColor: border,
      borderStartWidth: 4,
      paddingVertical: getHeight(8),
      paddingHorizontal: getWidth(10),
      overflow: 'hidden',
    },
    cardPressed: {
      opacity: 0.94,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
    },
    topRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(8),
    },
    topStart: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getWidth(6),
    },
    refText: {
      flexShrink: 0,
      fontSize: 13,
      lineHeight: 16,
      color: isDark ? theme.typography.primary : '#0F172A',
      ...cairoFont('bold'),
    },
    statusBadge: {
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexShrink: 1,
      maxWidth: getWidth(120),
    },
    statusText: {
      fontSize: 10,
      lineHeight: 13,
      ...cairoFont('bold'),
    },
    amountText: {
      flexShrink: 0,
      fontSize: 13,
      lineHeight: 16,
      color: isDark ? theme.typography.primary : '#0F172A',
      ...cairoFont('bold'),
    },
    metaRow: {
      marginTop: 4,
      alignItems: 'center',
      gap: getWidth(6),
    },
    customerText: {
      flex: 1,
      minWidth: 0,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? theme.typography.primary : '#0F172A',
      textAlign: align,
      ...cairoFont('medium'),
    },
    metaMuted: {
      fontSize: 10,
      lineHeight: 13,
      color: '#94A3B8',
      ...cairoFont('regular'),
    },
    routeBlock: {
      marginTop: 4,
      gap: 2,
    },
    stopRow: {
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    },
    stopDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      flexShrink: 0,
    },
    stopText: {
      flex: 1,
      minWidth: 0,
      fontSize: 11,
      lineHeight: 15,
      color: isDark ? theme.typography.secondary : '#475569',
      textAlign: align,
      ...cairoFont('regular'),
    },
    toolsRow: {
      marginTop: getHeight(6),
      paddingTop: getHeight(6),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
      alignItems: 'center',
      gap: getWidth(6),
    },
    toolsStart: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getWidth(6),
    },
    toolsEnd: {
      flexShrink: 0,
      alignItems: 'center',
      gap: getWidth(6),
    },
    toolBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
    },
    senderChip: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: getWidth(140),
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
    },
    senderName: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 10,
      lineHeight: 13,
      color: isDark ? theme.typography.primary : '#334155',
      ...cairoFont('bold'),
    },
    assignChip: {
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(37,99,235,0.28)' : '#E0EDFF',
    },
    driverChip: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: getWidth(140),
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(37,99,235,0.28)' : '#E0EDFF',
    },
    assignChipText: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 10,
      lineHeight: 13,
      color: isDark ? '#93C5FD' : '#1D4ED8',
      ...cairoFont('bold'),
    },
    acceptBtn: {
      backgroundColor: isDark ? 'rgba(34,197,94,0.22)' : '#E8F8EF',
    },
    rejectBtn: {
      backgroundColor: isDark ? 'rgba(239,68,68,0.22)' : '#FEE2E2',
    },
  });
};
