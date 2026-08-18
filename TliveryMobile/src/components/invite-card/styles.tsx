import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const inviteCardStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const iconShellBg = isDark
    ? 'rgba(255,255,255,0.06)'
    : theme.ui.borderLight;
  const secondaryBtnBg = isDark
    ? 'rgba(255,255,255,0.06)'
    : theme.ui.borderLight;
  const secondaryBtnFg = isDark ? theme.brand.gold : theme.brand.navy;
  const primaryBtnBg = isDark ? theme.brand.gold : theme.brand.navy;
  const primaryBtnFg = isDark ? theme.brand.navy : theme.typography.inverse;
  const dangerBg = isDark ? 'rgba(255,99,105,0.12)' : 'rgba(239,68,68,0.08)';

  return StyleSheet.create({
    card: {
      borderRadius: radius.md,
      padding: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      overflow: 'hidden',
      gap: 0,
      borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
      ...elevation.card,
      shadowOpacity: isDark ? 0.25 : 0.04,
      elevation: isDark ? 3 : 1,
    },
    mainRow: {
      alignItems: 'stretch',
      minHeight: getHeight(100),
    },
    statusRail: {
      width: getWidth(44),
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(4),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getHeight(8),
    },
    statusRailLabel: {
      fontSize: fontSize.label,
      letterSpacing: 0.2,
      textAlign: 'center',
      ...cairoFont('bold'),
      lineHeight: fontSize.label + 3,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    body: {
      paddingHorizontal: getWidth(space.sm),
      paddingTop: getHeight(space.sm),
      paddingBottom: getHeight(space.xs),
      gap: getHeight(space.xs),
    },
    infoRow: {
      alignItems: 'center',
      gap: getWidth(space.xs),
    },
    codeShell: {
      alignItems: 'center',
      gap: getWidth(6),
      flex: 1,
      minWidth: 0,
    },
    code: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.cardTitle,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
      letterSpacing: 1,
    },
    metaBlock: {
      gap: getHeight(4),
    },
    metaRow: {
      alignItems: 'center',
      gap: getWidth(6),
    },
    metaItemWide: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getWidth(4),
    },
    metaIconShell: {
      width: getWidth(22),
      height: getWidth(22),
      borderRadius: getWidth(7),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: iconShellBg,
      flexShrink: 0,
    },
    metaValue: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.caption,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    hint: {
      fontSize: fontSize.caption,
      color: theme.typography.caption,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    footer: {
      gap: getHeight(8),
      paddingTop: getHeight(space.xs),
      paddingHorizontal: getWidth(space.sm),
      paddingBottom: getHeight(space.sm),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
    },
    footerPrimaryRow: {
      alignItems: 'stretch',
      gap: getWidth(8),
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
      minHeight: getHeight(36),
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(4),
      paddingHorizontal: getWidth(8),
    },
    actionDangerFull: {
      flex: 0,
      alignSelf: 'stretch',
    },
    actionPrimary: {
      backgroundColor: primaryBtnBg,
    },
    actionSecondary: {
      backgroundColor: secondaryBtnBg,
      borderWidth: 1,
      borderColor: theme.ui.border,
    },
    actionDanger: {
      backgroundColor: dangerBg,
      borderWidth: 1,
      borderColor: theme.status.error,
    },
    actionPrimaryLabel: {
      flexShrink: 1,
      fontSize: fontSize.label,
      color: primaryBtnFg,
      ...cairoFont('bold'),
    },
    actionSecondaryLabel: {
      flexShrink: 1,
      fontSize: fontSize.label,
      color: secondaryBtnFg,
      ...cairoFont('bold'),
    },
    actionDangerLabel: {
      flexShrink: 1,
      fontSize: fontSize.label,
      color: theme.status.error,
      ...cairoFont('bold'),
    },
  });
};
