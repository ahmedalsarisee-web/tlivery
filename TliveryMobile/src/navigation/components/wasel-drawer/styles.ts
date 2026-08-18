import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export function createWaselDrawerStyles(theme: ThemeType, isDark: boolean) {
  const accent = isDark ? theme.brand.gold : theme.brand.navy;
  const activeBg = isDark
    ? 'rgba(212,175,55,0.14)'
    : 'rgba(15,35,68,0.10)';

  return StyleSheet.create({
    root: {flex: 1},
    hero: {
      position: 'relative',
      paddingHorizontal: getWidth(space.md),
      paddingBottom: getHeight(space.md),
      gap: 0,
      overflow: 'hidden',
      backgroundColor: isDark ? '#3D3010' : theme.brand.navy,
    },
    profileRow: {
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: getWidth(space.sm),
    },
    avatar: {
      width: getWidth(48),
      height: getWidth(48),
      borderRadius: getWidth(24),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderWidth: 2,
      borderColor: isDark ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.55)',
    },
    avatarText: {
      color: isDark ? '#3D3010' : theme.brand.navy,
      fontSize: fontSize.body,
      fontWeight: '700',
    },
    userMeta: {
      zIndex: 1,
      flex: 1,
      minWidth: 0,
      gap: getHeight(4),
    },
    metaLine: {
      alignItems: 'center',
      gap: getWidth(6),
    },
    userName: {
      flex: 1,
      minWidth: 0,
      color: theme.base.white,
      fontSize: fontSize.cardTitle,
      fontWeight: '700',
    },
    userRole: {
      flex: 1,
      minWidth: 0,
      color: 'rgba(255,255,255,0.78)',
      fontSize: fontSize.caption,
      fontWeight: '700',
    },
    companyMetaText: {
      flex: 1,
      minWidth: 0,
      color: 'rgba(255,255,255,0.88)',
      fontSize: fontSize.caption,
      fontWeight: '700',
    },
    scroll: {flex: 1, backgroundColor: 'transparent'},
    scrollContent: {
      paddingTop: getHeight(space.xs),
      paddingHorizontal: getWidth(space.sm),
      paddingBottom: getHeight(space.sm),
      gap: 0,
      backgroundColor: 'transparent',
    },
    itemOuter: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    itemRow: {
      minHeight: getHeight(38),
      borderRadius: radius.md,
      paddingHorizontal: getWidth(space.sm),
      paddingVertical: getHeight(4),
      flexDirection: 'row',
      alignItems: 'center',
      gap: getWidth(space.sm),
    },
    itemRowActive: {
      backgroundColor: activeBg,
    },
    accentBar: {
      position: 'absolute',
      top: getHeight(8),
      bottom: getHeight(8),
      width: getWidth(3),
      borderRadius: 2,
      backgroundColor: accent,
    },
    accentBarStart: {
      start: getWidth(4),
    },
    itemLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.body,
      fontWeight: '700',
    },
    itemLabelActive: {
      fontWeight: '700',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.ui.border,
      marginVertical: getHeight(space.xs),
      marginHorizontal: getWidth(space.xs),
    },
    footer: {
      paddingHorizontal: getWidth(space.md),
      paddingTop: getHeight(space.xs),
      paddingBottom: getHeight(space.sm),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
      gap: getHeight(2),
      backgroundColor: 'transparent',
    },
    logoutLabel: {
      color: theme.status.error,
      fontSize: fontSize.body,
      fontWeight: '700',
    },
    version: {
      color: theme.typography.caption,
      fontSize: fontSize.label,
      textAlign: 'center',
      fontWeight: '600',
      paddingHorizontal: getWidth(space.sm),
    },
  });
}
