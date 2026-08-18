import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth, moderateScale} from '@app/utils/responsive-design';
import {HOME_HEADER_NAV_HEIGHT} from '../components/home-header/headerMetrics';

export const roleHomeStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const rtl = isRTL(direction);
  const surface = theme.backgrounds.surface;
  const pageBg = isDark ? theme.backgrounds.background : '#F3F4F6';
  const heroFill = isDark ? '#3D3010' : theme.brand.navy;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: pageBg,
    },
    scrollFill: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scroll: {
      flexGrow: 1,
    },
    stickyHero: {
      position: 'absolute',
      top: 0,
      start: 0,
      end: 0,
      zIndex: 20,
      overflow: 'visible',
      backgroundColor: heroFill,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.45 : 0.28,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 6},
      elevation: 12,
    },
    stickyHeroClip: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    navRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getWidth(space.md),
      height: getHeight(HOME_HEADER_NAV_HEIGHT),
    },
    navSlot: {
      minWidth: getWidth(44),
      minHeight: getHeight(40),
      alignItems: 'center',
      justifyContent: 'center',
    },
    navSlotStart: {
      alignItems: rtl ? 'flex-end' : 'flex-start',
    },
    navSlotEnd: {
      alignItems: rtl ? 'flex-start' : 'flex-end',
    },
    navCenter: {
      flex: 1,
    },
    bellWrap: {
      position: 'relative',
      padding: getWidth(4),
    },
    goldBadge: {
      position: 'absolute',
      top: getHeight(2),
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.brand.gold,
    },
    heroBand: {
      paddingHorizontal: getWidth(space.md),
      paddingBottom: getHeight(space.sm),
    },
    greetRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
    },
    greetCol: {
      flex: 1,
      gap: getHeight(2),
    },
    greetHello: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: fontSize.body,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    greetName: {
      color: theme.base.white,
      fontSize: moderateScale(28),
      lineHeight: moderateScale(34),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    onlinePill: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(6),
      paddingHorizontal: getWidth(12),
      paddingVertical: getHeight(7),
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      marginTop: getHeight(4),
    },
    onlineDot: {
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.status.success,
    },
    offlineDot: {
      backgroundColor: theme.typography.caption,
    },
    onlineText: {
      color: theme.base.white,
      fontSize: fontSize.caption,
      ...cairoFont('bold'),
    },
    earningsCard: {
      marginHorizontal: getWidth(space.md),
      marginBottom: getHeight(space.md),
      backgroundColor: surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingVertical: getHeight(space.md),
      paddingHorizontal: getWidth(space.md),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 14,
      shadowOffset: {width: 0, height: 6},
      elevation: 6,
      zIndex: 2,
    },
    earningsCardInNav: {
      marginHorizontal: getWidth(space.md),
      backgroundColor: isDark ? 'rgba(8, 16, 32, 0.92)' : surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : theme.ui.border,
      paddingHorizontal: getWidth(space.md),
      paddingVertical: getHeight(space.md),
      flex: 1,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 12,
      shadowOffset: {width: 0, height: 4},
      elevation: 6,
    },
    earningsCol: {
      flex: 1,
      gap: getHeight(4),
    },
    earningsLabel: {
      color: isDark ? 'rgba(255,255,255,0.65)' : theme.typography.secondary,
      fontSize: fontSize.caption,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    earningsValue: {
      color: isDark ? theme.brand.gold : theme.typography.primary,
      fontSize: moderateScale(26),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    earningsBtn: {
      width: getWidth(44),
      height: getWidth(44),
      borderRadius: getWidth(22),
      backgroundColor: isDark ? theme.base.white : theme.brand.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flexGrow: 1,
      paddingHorizontal: getWidth(space.md),
      paddingTop: getHeight(space.xs),
      gap: getHeight(space.md),
      backgroundColor: 'transparent',
      paddingBottom: getHeight(space.lg),
    },
    extraContent: {
      marginBottom: getHeight(2),
    },
    statsRow: {
      flexDirection: getFlexDirection(direction),
      gap: getWidth(8),
    },
    statCard: {
      flex: 1,
      minHeight: getHeight(88),
      backgroundColor: surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(8),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getHeight(2),
    },
    statValue: {
      color: theme.typography.primary,
      fontSize: moderateScale(20),
      ...cairoFont('bold'),
    },
    statLabel: {
      color: theme.typography.secondary,
      fontSize: fontSize.label,
      ...cairoFont('medium'),
      textAlign: 'center',
    },
    statSub: {
      color: theme.typography.caption,
      fontSize: fontSize.label,
      ...cairoFont('regular'),
      textAlign: 'center',
    },
    sectionHeader: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: theme.typography.primary,
      fontSize: fontSize.section,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    viewAll: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
      fontSize: fontSize.caption,
      ...cairoFont('bold'),
    },
    summaryCard: {
      backgroundColor: surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: theme.ui.border,
      padding: getWidth(space.md),
      gap: getHeight(space.sm),
    },
    summaryTop: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
    },
    summaryEarnLabel: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    summaryEarnValue: {
      color: theme.typography.primary,
      fontSize: moderateScale(20),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    sparkWrap: {
      width: getWidth(110),
      height: getHeight(44),
      justifyContent: 'flex-end',
      transform: rtl ? [{scaleX: -1}] : undefined,
    },
    sparkRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: '100%',
    },
    sparkBar: {
      flex: 1,
      borderRadius: 3,
      backgroundColor: '#F59E0B',
      minHeight: 4,
    },
    breakRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: getHeight(6),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
    },
    breakLabel: {
      color: theme.typography.secondary,
      fontSize: fontSize.body,
      ...cairoFont('medium'),
    },
    breakValue: {
      color: theme.typography.primary,
      fontSize: fontSize.body,
      ...cairoFont('bold'),
    },
    starRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 2,
    },
  });
};
