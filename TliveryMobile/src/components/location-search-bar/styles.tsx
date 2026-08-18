import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {control, elevation, fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export function locationSearchBarStyles(
  theme: ThemeType,
  direction: LangDirection,
  isDark: boolean,
) {
  const gold = theme.brand.gold;
  return StyleSheet.create({
    root: {
      gap: getHeight(space.xs),
    },
    searchAnchor: {
      position: 'relative',
      zIndex: 20,
    },
    searchBox: {
      minHeight: getHeight(control.searchHeight),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : theme.backgrounds.background,
      paddingHorizontal: getWidth(space.sm),
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    input: {
      flex: 1,
      color: theme.typography.primary,
      fontSize: fontSize.body,
      textAlign: getTextAlign(direction),
      ...cairoFont('medium'),
      paddingVertical: getHeight(8),
    },
    clear: {
      minWidth: getWidth(24),
      minHeight: getHeight(24),
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: {
      color: theme.status.error,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('medium'),
    },
    dropdownOverlay: {
      position: 'absolute',
      top: '100%',
      start: 0,
      end: 0,
      marginTop: getHeight(4),
      zIndex: 1000,
      elevation: 12,
      maxHeight: getHeight(320),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? theme.backgrounds.surface
        : theme.backgrounds.background,
      ...elevation.card,
    },
    dropdownContent: {
      flexGrow: 0,
    },
    row: {
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(space.sm),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderLight,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowPressed: {
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.12)'
        : 'rgba(212,175,55,0.08)',
    },
    rowText: {
      flex: 1,
      gap: getHeight(2),
      minWidth: 0,
    },
    rowIcon: {
      flexShrink: 0,
    },
    title: {
      color: theme.typography.primary,
      fontSize: fontSize.body,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    subtitle: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      ...cairoFont('regular'),
    },
    empty: {
      color: theme.typography.secondary,
      fontSize: fontSize.caption,
      textAlign: getTextAlign(direction),
      padding: getWidth(space.sm),
      ...cairoFont('medium'),
    },
    selectedCard: {
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: gold,
      padding: getWidth(space.sm),
      gap: getHeight(space.xs),
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.10)'
        : 'rgba(212,175,55,0.08)',
    },
    selectedHeader: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    selectedIconWrap: {
      width: getWidth(32),
      height: getWidth(32),
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.20)'
        : 'rgba(212,175,55,0.18)',
    },
    selectedBody: {
      flex: 1,
      gap: getHeight(2),
      minWidth: 0,
    },
    selectedBadge: {
      color: gold,
      fontSize: fontSize.label,
      textAlign: getTextAlign(direction),
      ...cairoFont('bold'),
    },
    changeBtn: {
      alignSelf: direction === LangDirection.RTL ? 'flex-end' : 'flex-start',
      paddingVertical: getHeight(6),
      paddingHorizontal: getWidth(space.sm),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : theme.backgrounds.background,
    },
    changeBtnText: {
      color: theme.typography.primary,
      fontSize: fontSize.caption,
      ...cairoFont('bold'),
    },
  });
}
