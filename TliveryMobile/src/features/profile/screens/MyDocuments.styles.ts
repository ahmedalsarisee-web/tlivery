import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const myDocumentsStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return StyleSheet.create({
    heroCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      padding: getWidth(space.md),
      alignItems: 'center',
      gap: getHeight(space.sm),
      ...elevation.card,
      shadowOpacity: isDark ? 0.18 : 0.05,
    },
    avatarWrap: {
      width: getWidth(72),
      height: getWidth(72),
    },
    avatar: {
      width: getWidth(72),
      height: getWidth(72),
      borderRadius: getWidth(36),
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
    avatarCamBadge: {
      position: 'absolute',
      end: getWidth(-2),
      bottom: getHeight(-2),
      width: getWidth(24),
      height: getWidth(24),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
      borderWidth: 2,
      borderColor: theme.backgrounds.surface,
    },
    heroMeta: {
      alignItems: 'center',
      gap: getHeight(2),
    },
    heroName: {
      fontSize: fontSize.section,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    heroHint: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      textAlign: 'center',
    },
    docBlock: {
      gap: getHeight(space.xs),
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
  });
};
