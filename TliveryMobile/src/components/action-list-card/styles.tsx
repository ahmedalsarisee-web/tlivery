import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {cairoFont} from '@app/theme/fonts';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {getWidth} from '@app/utils/responsive-design';

export const actionListCardStyles = (
  theme: ThemeType,
  rtl: boolean,
  accent: string,
  isDark: boolean,
) =>
  StyleSheet.create({
    wrap: {
      marginBottom: getWidth(space.xs),
    },
    card: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingVertical: getWidth(space.sm),
      paddingHorizontal: getWidth(space.md),
      overflow: 'hidden',
      ...elevation.card,
    },
    accent: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: accent,
      ...(rtl
        ? {
            right: 0,
            borderTopRightRadius: radius.lg,
            borderBottomRightRadius: radius.lg,
          }
        : {
            left: 0,
            borderTopLeftRadius: radius.lg,
            borderBottomLeftRadius: radius.lg,
          }),
    },
    row: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: getWidth(space.sm),
    },
    iconShell: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      backgroundColor: `${accent}18`,
      borderColor: `${accent}40`,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: getWidth(2),
    },
    titleRow: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: getWidth(space.xs),
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      textAlign: rtl ? 'right' : 'left',
      ...cairoFont('bold'),
    },
    meta: {
      fontSize: fontSize.caption,
      color: theme.typography.caption,
      textAlign: rtl ? 'right' : 'left',
      ...cairoFont('regular'),
    },
    metric: {
      fontSize: fontSize.body,
      color: theme.typography.primary,
      marginTop: 2,
      textAlign: rtl ? 'right' : 'left',
      ...cairoFont('bold'),
    },
    footer: {
      marginTop: getWidth(space.xs),
      paddingTop: getWidth(space.xs),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
      flexDirection: rtl ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: getWidth(space.xs),
    },
    actionBtn: {
      minHeight: getWidth(32),
      minWidth: getWidth(72),
      paddingVertical: getWidth(6),
      paddingHorizontal: getWidth(10),
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPrimary: {
      borderColor: theme.brand.navy,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.16)'
        : 'rgba(15, 23, 42, 0.06)',
    },
    actionPrimaryText: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
      fontSize: fontSize.caption,
      ...cairoFont('bold'),
    },
    actionMuted: {
      borderColor: theme.ui.border,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(15, 23, 42, 0.03)',
    },
    actionMutedText: {
      color: theme.typography.caption,
      fontSize: fontSize.caption,
      ...cairoFont('medium'),
    },
    actionDanger: {
      borderColor: theme.status.error,
      backgroundColor: isDark
        ? 'rgba(239, 68, 68, 0.14)'
        : 'rgba(239, 68, 68, 0.06)',
    },
    actionDangerText: {
      color: theme.status.error,
      fontSize: fontSize.caption,
      ...cairoFont('bold'),
    },
  });
