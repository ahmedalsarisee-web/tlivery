import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getTextAlign} from '@app/utils/directionalStyles';
import {
  elevation,
  fontSize,
  paymentSoftFor,
  radius,
  space,
} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const orderCardStyles = (
  theme: ThemeType,
  direction: LangDirection,
  themeType: 'light' | 'dark',
) => {
  const isDark = themeType === 'dark';
  const payment = paymentSoftFor(themeType);
  const secondaryBtnBg = isDark
    ? 'rgba(255,255,255,0.06)'
    : theme.ui.borderLight;
  const secondaryBtnFg = isDark ? theme.brand.gold : theme.brand.navy;
  const primaryBtnBg = isDark ? theme.brand.gold : theme.brand.navy;
  const primaryBtnFg = isDark ? theme.brand.navy : theme.typography.inverse;
  const sectionBorder = isDark ? theme.ui.border : theme.ui.borderLight;
  const routeDotSize = getWidth(7);

  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      overflow: 'hidden',
      gap: 0,
      backgroundColor: theme.backgrounds.surface,
      borderWidth: 1,
      borderColor: theme.ui.border,
      ...elevation.card,
    },
    cardFromAccount: {
      borderStartWidth: getWidth(3),
      borderStartColor: theme.brand.gold,
    },
    cardFromCompany: {
      borderStartWidth: getWidth(3),
      borderStartColor: isDark
        ? 'rgba(148, 163, 184, 0.9)'
        : theme.brand.navy,
    },
    body: {
      paddingHorizontal: getWidth(space.sm),
      paddingTop: getHeight(8),
      paddingBottom: getHeight(6),
      gap: getHeight(6),
    },
    footerWrap: {
      paddingHorizontal: getWidth(space.sm),
      paddingBottom: getHeight(8),
      paddingTop: getHeight(2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: sectionBorder,
    },
    headerRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(6),
      width: '100%',
    },
    headerSide: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
    },
    headerSideEnd: {
      justifyContent: 'flex-end',
    },
    statusBadge: {
      maxWidth: '100%',
      minHeight: getHeight(22),
      paddingHorizontal: getWidth(7),
      paddingVertical: getHeight(3),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(3),
      flexShrink: 1,
    },
    statusBadgeText: {
      fontSize: fontSize.label,
      ...cairoFont('bold'),
      flexShrink: 1,
    },
    refBadge: {
      maxWidth: getWidth(128),
      minWidth: getWidth(56),
      flexShrink: 1,
      paddingHorizontal: getWidth(6),
      paddingVertical: getHeight(3),
      borderRadius: radius.sm,
      backgroundColor: isDark
        ? 'rgba(148, 163, 184, 0.16)'
        : 'rgba(15, 23, 42, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(3),
    },
    reference: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: fontSize.label,
      color: theme.typography.secondary,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    ageRow: {
      alignItems: 'center',
      gap: getWidth(3),
      flexShrink: 0,
    },
    ageText: {
      fontSize: fontSize.label,
      color: theme.typography.caption,
      ...cairoFont('regular'),
    },
    factsBlock: {
      width: '100%',
      gap: getHeight(5),
    },
    factRow: {
      width: '100%',
      alignItems: 'center',
      gap: getWidth(5),
      minHeight: getHeight(18),
    },
    factRowClickable: {
      minHeight: getHeight(28),
      paddingVertical: getHeight(4),
      paddingHorizontal: getWidth(6),
      borderRadius: radius.sm,
      backgroundColor: isDark
        ? 'rgba(212, 175, 55, 0.16)'
        : 'rgba(11, 37, 69, 0.08)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? 'rgba(212, 175, 55, 0.35)'
        : 'rgba(11, 37, 69, 0.14)',
    },
    factLabelWrap: {
      width: getWidth(92),
      flexShrink: 0,
      alignItems: 'center',
      gap: getWidth(4),
    },
    factLabel: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: fontSize.label,
      color: theme.typography.caption,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    factLabelClickable: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
    },
    factSep: {
      flexShrink: 0,
      fontSize: fontSize.label,
      color: theme.typography.caption,
      ...cairoFont('bold'),
    },
    factSepClickable: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
    },
    factValue: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.caption,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    factValueClickable: {
      color: isDark ? theme.brand.gold : theme.brand.navy,
    },
    tripBlock: {
      width: '100%',
      borderRadius: radius.md,
      paddingVertical: getHeight(8),
      paddingHorizontal: getWidth(8),
      gap: getHeight(8),
      backgroundColor: isDark
        ? 'rgba(148, 163, 184, 0.10)'
        : 'rgba(15, 23, 42, 0.04)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: sectionBorder,
    },
    tripDivider: {
      width: '100%',
      height: StyleSheet.hairlineWidth,
      backgroundColor: sectionBorder,
    },
    paymentBadge: {
      flexShrink: 0,
      paddingHorizontal: getWidth(7),
      paddingVertical: getHeight(2),
      borderRadius: radius.pill,
      backgroundColor: payment.cod.bg,
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: getWidth(110),
    },
    paymentBadgeMuted: {
      backgroundColor: payment.prepaid.bg,
    },
    paymentText: {
      fontSize: fontSize.label,
      color: payment.cod.fg,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    paymentTextMuted: {
      color: payment.prepaid.fg,
    },
    routeRow: {
      width: '100%',
      alignItems: 'center',
      gap: getWidth(6),
    },
    routeEndpoint: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: getWidth(5),
    },
    routeArrowWrap: {
      width: getWidth(24),
      height: getWidth(24),
      borderRadius: getWidth(12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.brand.gold : theme.brand.navy,
      flexShrink: 0,
    },
    addressDot: {
      width: routeDotSize,
      height: routeDotSize,
      borderRadius: routeDotSize / 2,
      flexShrink: 0,
    },
    addressDotPickup: {
      backgroundColor: '#22C55E',
    },
    addressDotDropoff: {
      backgroundColor: '#EF4444',
    },
    routeEndpointText: {
      flex: 1,
      minWidth: 0,
      fontSize: fontSize.label,
      color: theme.typography.primary,
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
      lineHeight: fontSize.label + 3,
    },
    metricsRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(4),
    },
    metricCell: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(4),
    },
    metricCellAmount: {
      justifyContent: 'center',
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: sectionBorder,
    },
    metricText: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: fontSize.caption,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    metricAmount: {
      color: isDark ? '#86EFAC' : '#059669',
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    footer: {
      alignItems: 'center',
      gap: getWidth(5),
      width: '100%',
    },
    actionBtn: {
      flex: 1,
      minHeight: getHeight(34),
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getWidth(4),
      backgroundColor: secondaryBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: sectionBorder,
    },
    callActionBtn: {
      flex: 1.25,
      gap: getWidth(5),
      paddingHorizontal: getWidth(8),
    },
    actionBtnPrimary: {
      flex: 1.15,
      backgroundColor: primaryBtnBg,
      borderColor: primaryBtnBg,
      paddingHorizontal: getWidth(6),
    },
    actionLabel: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: fontSize.label,
      color: secondaryBtnFg,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    actionLabelPrimary: {
      color: primaryBtnFg,
    },
    driverReceiveBtn: {
      flex: 1.5,
      minHeight: getHeight(34),
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: getWidth(4),
      paddingHorizontal: getWidth(6),
      backgroundColor: primaryBtnBg,
    },
    driverReceiveBtnBusy: {
      opacity: 0.85,
    },
    driverReceiveLabel: {
      fontSize: fontSize.label,
      color: primaryBtnFg,
      ...cairoFont('bold'),
      textAlign: 'center',
    },
    callOptionBtn: {
      width: '100%',
      alignItems: 'center',
      gap: getWidth(10),
      paddingVertical: getHeight(12),
      paddingHorizontal: getWidth(12),
      borderRadius: radius.md,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : theme.ui.borderLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: sectionBorder,
    },
    callOptionTextCol: {
      flex: 1,
      minWidth: 0,
      gap: getHeight(2),
    },
    callOptionTitle: {
      fontSize: fontSize.body,
      color: theme.typography.primary,
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    callOptionSub: {
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('regular'),
      textAlign: getTextAlign(direction),
    },
  });
};
