import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign, isRTL} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const driverDetailsStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return StyleSheet.create({
    heroBlock: {
      gap: getHeight(4),
    },
    heroCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      padding: getWidth(space.md),
      ...elevation.card,
      shadowOpacity: isDark ? 0.22 : 0.05,
    },
    heroTop: {
      alignItems: 'flex-start',
      gap: getWidth(space.sm),
    },
    avatarWrap: {
      width: getWidth(64),
      height: getWidth(64),
      flexShrink: 0,
    },
    avatar: {
      width: getWidth(64),
      height: getWidth(64),
      borderRadius: getWidth(32),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.18)'
        : 'rgba(15,23,42,0.08)',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarCamBadge: {
      position: 'absolute',
      end: getWidth(-2),
      bottom: getHeight(-2),
      width: getWidth(22),
      height: getWidth(22),
      borderRadius: getWidth(11),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
      borderWidth: 2,
      borderColor: theme.backgrounds.surface,
    },
    avatarText: {
      fontSize: fontSize.heading,
      color: accent,
      ...cairoFont('bold'),
    },
    heroMeta: {
      flex: 1,
      minWidth: 0,
      gap: getHeight(6),
      alignItems: 'stretch',
    },
    nameRow: {
      alignItems: 'center',
      gap: getWidth(space.xs),
      flexWrap: 'wrap',
    },
    heroName: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: fontSize.screen,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    statusPill: {
      paddingHorizontal: getWidth(10),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      flexShrink: 0,
    },
    statusPillText: {
      fontSize: fontSize.label,
      ...cairoFont('bold'),
    },
    ratingRow: {
      alignItems: 'center',
      gap: getWidth(4),
    },
    ratingText: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    contactRow: {
      alignItems: 'center',
      gap: getWidth(6),
    },
    contactText: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    tabsScroll: {
      flexGrow: 0,
      alignSelf: 'stretch',
      marginTop: 0,
      marginBottom: 0,
    },
    tabs: {
      flexGrow: 1,
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      gap: getWidth(space.md),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.border,
    },
    tab: {
      paddingTop: getHeight(4),
      paddingBottom: getHeight(6),
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      flexShrink: 0,
    },
    tabActive: {
      borderBottomColor: accent,
    },
    tabLabel: {
      fontSize: fontSize.body,
      color: theme.typography.secondary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    tabLabelActive: {
      color: accent,
    },
    sectionHeader: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
    },
    sectionTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.section,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
      marginBottom: getHeight(space.xs),
    },
    sectionLink: {
      fontSize: fontSize.caption,
      color: accent,
      ...cairoFont('bold'),
      flexShrink: 0,
      marginBottom: getHeight(space.xs),
    },
    infoCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      paddingHorizontal: getWidth(space.md),
      ...elevation.card,
      shadowOpacity: isDark ? 0.18 : 0.04,
    },
    infoRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.sm),
      paddingVertical: getHeight(space.sm),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabelWrap: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    infoIcon: {
      width: getWidth(28),
      height: getWidth(28),
      borderRadius: getWidth(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : theme.ui.borderLight,
      flexShrink: 0,
    },
    infoLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.body,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    infoValueWrap: {
      maxWidth: '52%',
      alignItems: 'center',
      gap: getWidth(6),
      flexShrink: 0,
    },
    infoValue: {
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    platePill: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
    },
    platePillText: {
      fontSize: fontSize.label,
      color: theme.typography.secondary,
      ...cairoFont('bold'),
    },
    summaryCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      paddingVertical: getHeight(space.md),
      paddingHorizontal: getWidth(space.xs),
      alignItems: 'stretch',
      ...elevation.card,
      shadowOpacity: isDark ? 0.18 : 0.04,
    },
    summaryCell: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getHeight(4),
      paddingHorizontal: getWidth(4),
    },
    // Manual row-reverse RTL: physical side borders (borderStart does not flip).
    summaryCellBorder: isRTL(direction)
      ? {
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: theme.ui.border,
        }
      : {
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderLeftColor: theme.ui.border,
        },
    summaryIcon: {
      width: getWidth(28),
      height: getWidth(28),
      borderRadius: getWidth(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryValue: {
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    summaryLabel: {
      fontSize: fontSize.label,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: 'center',
    },
    perfStrip: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      paddingVertical: getHeight(space.md),
      paddingHorizontal: getWidth(space.xs),
      alignItems: 'stretch',
      ...elevation.card,
      shadowOpacity: isDark ? 0.18 : 0.04,
    },
    perfCell: {
      flex: 1,
      alignItems: 'center',
      gap: getHeight(4),
      paddingHorizontal: getWidth(2),
    },
    perfValue: {
      fontSize: fontSize.section,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    perfLabel: {
      fontSize: fontSize.label,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: 'center',
    },
    metricRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: getHeight(space.xs),
    },
    metricLabel: {
      fontSize: fontSize.body,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    metricValue: {
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('bold'),
    },
    docCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      padding: getWidth(space.md),
      alignItems: 'center',
      gap: getWidth(space.sm),
      ...elevation.card,
      shadowOpacity: isDark ? 0.18 : 0.04,
    },
    docCardCol: {
      gap: getHeight(space.xs),
    },
    docThumb: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(10),
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : theme.ui.borderLight,
    },
    docIcon: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.14)'
        : 'rgba(15,23,42,0.06)',
    },
    docBody: {
      flex: 1,
      minWidth: 0,
      gap: getHeight(2),
    },
    docTitle: {
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    docSub: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    verifiedPill: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(61,214,140,0.16)' : '#D1FAE5',
    },
    verifiedText: {
      fontSize: fontSize.label,
      color: isDark ? theme.status.success : '#065F46',
      ...cairoFont('bold'),
    },
    missingPill: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.ui.borderLight,
    },
    missingText: {
      fontSize: fontSize.label,
      color: theme.typography.caption,
      ...cairoFont('bold'),
    },
    activityItem: {
      alignItems: 'flex-start',
      gap: getWidth(space.sm),
      paddingVertical: getHeight(space.sm),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.border,
    },
    activityDot: {
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      marginTop: getHeight(5),
      backgroundColor: accent,
    },
    activityText: {
      flex: 1,
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    activityDate: {
      fontSize: fontSize.caption,
      color: theme.typography.caption,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
      marginTop: getHeight(2),
    },
    bottomBar: {
      flexDirection: 'row',
      gap: getWidth(space.sm),
      paddingTop: getHeight(space.sm),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
      backgroundColor:
        themeType === 'light' ? theme.base.white : theme.backgrounds.background,
    },
    bottomBtn: {
      flex: 1,
    },
    badgeChip: {
      paddingHorizontal: getWidth(8),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      backgroundColor: theme.brand.gold,
    },
    badgeChipText: {
      fontSize: fontSize.label,
      color: theme.brand.navy,
      ...cairoFont('bold'),
    },
    heroBadges: {
      alignItems: 'center',
      gap: getWidth(space.xs),
      flexWrap: 'wrap',
    },
  });
};
