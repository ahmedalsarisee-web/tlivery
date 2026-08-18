import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const driversStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return StyleSheet.create({
    fleetCard: {
      borderRadius: radius.md,
      padding: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      overflow: 'hidden',
      gap: 0,
      backgroundColor: theme.backgrounds.surface,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      ...elevation.card,
      shadowOpacity: isDark ? 0.2 : 0.05,
      elevation: isDark ? 2 : 1,
    },
    fleetBody: {
      paddingHorizontal: getWidth(space.md),
      paddingVertical: getHeight(space.sm),
      gap: getHeight(space.xs),
    },
    fleetTop: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.xs),
    },
    fleetIcon: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.14)'
        : 'rgba(15,23,42,0.06)',
    },
    fleetTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: getHeight(2),
    },
    fleetTitle: {
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    fleetSubtitle: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    fleetStat: {
      alignItems: 'flex-end',
      gap: getHeight(2),
    },
    fleetStatValue: {
      fontSize: fontSize.section,
      color: accent,
      ...cairoFont('bold'),
    },
    capacityTrack: {
      height: getHeight(6),
      borderRadius: radius.pill,
      overflow: 'hidden',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.ui.borderLight,
    },
    capacityFill: {
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: theme.brand.gold,
    },
    capacityMeta: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.xs),
    },
    capacityMetaText: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    fab: {
      position: 'absolute',
      alignItems: 'center',
      gap: getHeight(4),
      zIndex: 30,
    },
    fabCircle: {
      width: getWidth(56),
      height: getWidth(56),
      borderRadius: getWidth(28),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 4},
      elevation: 8,
    },
    fabLabel: {
      fontSize: fontSize.caption,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: 'center',
      textShadowColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 3,
    },
    flex: {
      flex: 1,
    },
  });
};
