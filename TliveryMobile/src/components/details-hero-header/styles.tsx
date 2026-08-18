import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const detailsHeroHeaderStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return StyleSheet.create({
    heroCard: {
      backgroundColor: isDark ? theme.backgrounds.surface : theme.base.white,
      borderRadius: radius.md,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? theme.ui.border : 'transparent',
      padding: getWidth(space.md),
      ...elevation.card,
      shadowOpacity: isDark ? 0.22 : 0.08,
      elevation: isDark ? 3 : 2,
      gap: getHeight(space.sm),
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
    metaRow: {
      alignItems: 'center',
      gap: getWidth(6),
    },
    metaText: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    footer: {
      gap: getHeight(space.xs),
    },
  });
};
