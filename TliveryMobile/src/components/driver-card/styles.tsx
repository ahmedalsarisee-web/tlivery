import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign, isRTL} from '@app/utils/directionalStyles';
import {elevation, fontSize, radius} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

const AVATAR = getWidth(56);

export const driverCardStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const navy = theme.brand.navy;
  const gold = theme.brand.gold;
  const accent = isDark ? gold : navy;
  const cardBg = isDark ? theme.backgrounds.surface : theme.base.white;
  const rtl = isRTL(direction);

  return StyleSheet.create({
    card: {
      borderRadius: radius.md,
      padding: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      gap: 0,
      backgroundColor: cardBg,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? theme.ui.border : 'transparent',
      ...elevation.card,
      shadowOpacity: isDark ? 0.3 : 0.08,
      elevation: isDark ? 3 : 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getWidth(12),
      paddingVertical: getHeight(8),
      gap: getWidth(8),
    },
    colAvatar: {
      width: AVATAR,
      height: AVATAR,
      flexShrink: 0,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(212,175,55,0.14)'
        : 'rgba(15,23,42,0.06)',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: fontSize.body,
      color: accent,
      ...cairoFont('bold'),
    },
    statusDot: {
      position: 'absolute',
      end: getWidth(0),
      bottom: getHeight(0),
      width: getWidth(12),
      height: getWidth(12),
      borderRadius: getWidth(6),
      borderWidth: 2,
      borderColor: cardBg,
      zIndex: 2,
    },
    colInfo: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: getHeight(3),
    },
    name: {
      fontSize: fontSize.body,
      lineHeight: fontSize.body + 2,
      color: isDark ? theme.base.white : navy,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    ratingRow: {
      alignItems: 'center',
      gap: getWidth(4),
    },
    ratingBadge: {
      width: getWidth(15),
      height: getWidth(15),
      borderRadius: getWidth(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
    },
    ratingValue: {
      fontSize: fontSize.caption,
      lineHeight: fontSize.caption + 2,
      color: isDark ? theme.base.white : navy,
      ...cairoFont('bold'),
    },
    reviewCount: {
      fontSize: fontSize.label,
      lineHeight: fontSize.label + 2,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
    },
    vehicleRow: {
      alignSelf: rtl ? 'flex-end' : 'flex-start',
      maxWidth: '100%',
      alignItems: 'center',
      gap: getWidth(6),
    },
    vehicleIconBox: {
      width: getWidth(22),
      height: getWidth(22),
      borderRadius: getWidth(6),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(15,23,42,0.07)',
      flexShrink: 0,
    },
    vehicleText: {
      fontSize: fontSize.label,
      lineHeight: fontSize.label + 2,
      color: theme.typography.secondary,
      ...cairoFont('medium'),
      flexShrink: 1,
    },
    vehicleSep: {
      width: StyleSheet.hairlineWidth,
      height: getHeight(9),
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : theme.ui.border,
    },
    colActions: {
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: getWidth(6),
    },
    actionsDivider: {
      width: StyleSheet.hairlineWidth,
      height: AVATAR - getHeight(10),
      backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : theme.ui.border,
      marginHorizontal: getWidth(4),
    },
    callBtn: {
      width: getWidth(36),
      height: getWidth(36),
      borderRadius: getWidth(18),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
    },
    chevronBtn: {
      padding: getWidth(2),
    },
  });
};
