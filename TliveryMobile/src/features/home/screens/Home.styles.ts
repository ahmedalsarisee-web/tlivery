import {StyleSheet} from 'react-native';
import {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getHeight,
  getWidth,
  moderateScale,
} from '@app/utils/responsive-design';
import {
  getFlexDirection,
  getTextAlign,
} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';

export const homeStyles = (theme: ThemeType, direction: LangDirection) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backgrounds.background,
    },
    scrollFill: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingBottom: getHeight(24),
    },
    homeScroll: {
      paddingBottom: getHeight(24),
      flexGrow: 1,
    },

    headerSafe: {
      backgroundColor: theme.brand.navy,
    },
    header: {
      backgroundColor: theme.brand.navy,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getWidth(16),
      paddingTop: getHeight(8),
      paddingBottom: getHeight(12),
    },
    headerSide: {
      width: getWidth(44),
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getWidth(8),
    },
    logoSymbol: {
      width: getWidth(28),
      height: getWidth(26),
    },
    logoText: {
      color: theme.base.white,
      fontSize: moderateScale(20),
      ...cairoFont('bold'),
    },
    bellWrap: {
      position: 'relative',
      padding: getWidth(6),
    },
    bellDot: {
      position: 'absolute',
      top: getHeight(6),
      right: getWidth(6),
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
      backgroundColor: theme.brand.gold,
    },
    avatar: {
      width: getWidth(40),
      height: getWidth(40),
      borderRadius: getWidth(20),
      borderWidth: 1.5,
      borderColor: theme.brand.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: theme.brand.gold,
      fontSize: moderateScale(12),
      ...cairoFont('bold'),
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getWidth(4),
    },

    body: {
      paddingHorizontal: getWidth(16),
      marginTop: 0,
      gap: getHeight(16),
    },
    greeting: {
      color: theme.typography.primary,
      fontSize: moderateScale(26),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    greetingSub: {
      color: theme.typography.secondary,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
      marginTop: getHeight(4),
    },

    searchRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
    },
    searchBox: {
      flex: 1,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(8),
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(12),
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingHorizontal: getWidth(12),
      minHeight: getHeight(38),
    },
    searchInput: {
      flex: 1,
      alignSelf: 'stretch',
      color: theme.typography.primary,
      fontSize: moderateScale(12),
      lineHeight: moderateScale(16),
      ...cairoFont('medium'),
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
      textAlign: getTextAlign(direction),
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    newOrderBtn: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      gap: getWidth(6),
      backgroundColor: theme.brand.navy,
      borderRadius: moderateScale(12),
      paddingHorizontal: getWidth(12),
      minHeight: getHeight(38),
    },
    newOrderText: {
      color: theme.base.white,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
    },

    kpiScroll: {
      gap: getWidth(10),
      paddingVertical: getHeight(2),
    },
    kpiCard: {
      width: getWidth(148),
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(14),
      paddingVertical: getWidth(10),
      paddingHorizontal: getWidth(12),
      borderWidth: 1,
      borderColor: theme.ui.border,
      gap: getHeight(6),
    },
    kpiTop: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiIconWrap: {
      width: getWidth(32),
      height: getWidth(32),
      borderRadius: getWidth(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiLabel: {
      color: theme.typography.secondary,
      fontSize: moderateScale(12),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    kpiValue: {
      fontSize: moderateScale(22),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    kpiTrend: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(4),
    },
    kpiTrendText: {
      color: theme.status.success,
      fontSize: moderateScale(11),
      ...cairoFont('medium'),
    },
    kpiMeta: {
      color: theme.typography.caption,
      fontSize: moderateScale(10),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    dashboardStateText: {
      color: theme.typography.secondary,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    dashboardErrorText: {
      color: theme.typography.error,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },

    sectionHeader: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: theme.typography.primary,
      fontSize: moderateScale(18),
      ...cairoFont('bold'),
      textAlign: getTextAlign(direction),
    },
    filterChip: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(4),
      backgroundColor: theme.ui.borderLight,
      borderRadius: moderateScale(8),
      paddingHorizontal: getWidth(10),
      paddingVertical: getHeight(6),
    },
    filterText: {
      color: theme.typography.secondary,
      fontSize: moderateScale(12),
      ...cairoFont('medium'),
    },
    chartsRow: {
      flexDirection: getFlexDirection(direction),
      gap: getWidth(10),
    },
    chartCard: {
      flex: 1,
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(14),
      padding: getWidth(12),
      borderWidth: 1,
      borderColor: theme.ui.border,
      minHeight: getHeight(180),
    },
    chartTitle: {
      color: theme.typography.secondary,
      fontSize: moderateScale(12),
      ...cairoFont('medium'),
      marginBottom: getHeight(8),
      textAlign: getTextAlign(direction),
    },
    legendRow: {
      flexDirection: getFlexDirection(direction),
      flexWrap: 'wrap',
      gap: getWidth(8),
      marginTop: getHeight(8),
    },
    legendItem: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      gap: getWidth(4),
    },
    legendDot: {
      width: getWidth(8),
      height: getWidth(8),
      borderRadius: getWidth(4),
    },
    legendText: {
      color: theme.typography.caption,
      fontSize: moderateScale(10),
      ...cairoFont('medium'),
    },
    donutCenter: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutWrap: {
      width: getWidth(88),
      height: getWidth(88),
      alignSelf: 'center',
    },
    donutValue: {
      color: theme.typography.primary,
      fontSize: moderateScale(18),
      ...cairoFont('bold'),
    },
    donutLabel: {
      color: theme.typography.caption,
      fontSize: moderateScale(9),
      ...cairoFont('medium'),
    },
    sampleDataLabel: {
      color: theme.brand.gold,
      fontSize: moderateScale(9),
      marginTop: getHeight(6),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    emptyChartText: {
      color: theme.typography.secondary,
      fontSize: moderateScale(10),
      marginTop: getHeight(8),
      ...cairoFont('medium'),
      textAlign: 'center',
    },

    viewAll: {
      color: theme.brand.gold,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
    },
    ordersCard: {
      backgroundColor: theme.backgrounds.surface,
      borderRadius: moderateScale(14),
      borderWidth: 1,
      borderColor: theme.ui.border,
      overflow: 'hidden',
    },
    sampleDataNotice: {
      color: theme.brand.gold,
      fontSize: moderateScale(11),
      marginTop: getHeight(4),
      marginBottom: getHeight(6),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    tableHeader: {
      flexDirection: getFlexDirection(direction),
      backgroundColor: theme.ui.borderLight,
      paddingVertical: getHeight(10),
      paddingHorizontal: getWidth(10),
      gap: getWidth(4),
    },
    tableHeaderCell: {
      color: theme.typography.caption,
      fontSize: moderateScale(10),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    tableRow: {
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      paddingVertical: getHeight(12),
      paddingHorizontal: getWidth(10),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.border,
      gap: getWidth(4),
    },
    tableCell: {
      color: theme.typography.primary,
      fontSize: moderateScale(11),
      ...cairoFont('medium'),
      textAlign: getTextAlign(direction),
    },
    tableReference: {
      ...cairoFont('medium'),
    },
    colRef: {width: getWidth(52)},
    colCustomer: {width: getWidth(88)},
    colAddress: {width: getWidth(120)},
    colCompany: {width: getWidth(64)},
    colDriver: {width: getWidth(72)},
    colStatus: {width: getWidth(80), alignItems: 'center'},
    statusBadge: {
      paddingHorizontal: getWidth(6),
      paddingVertical: getHeight(3),
      borderRadius: moderateScale(6),
    },
    statusBadgeText: {
      fontSize: moderateScale(9),
      ...cairoFont('medium'),
    },
    chevronCol: {
      width: getWidth(16),
      alignItems: 'center',
    },
    emptyOrders: {
      minWidth: getWidth(360),
      paddingVertical: getHeight(20),
      paddingHorizontal: getWidth(12),
      alignItems: 'center',
    },
    emptyOrdersText: {
      color: theme.typography.secondary,
      fontSize: moderateScale(12),
      ...cairoFont('medium'),
      textAlign: 'center',
    },

    segment: {
      flexDirection: getFlexDirection(direction),
      gap: getWidth(8),
    },
    chip: {
      flex: 1,
      paddingVertical: getHeight(10),
      borderRadius: moderateScale(10),
      borderWidth: 1,
      borderColor: theme.ui.border,
      alignItems: 'center',
      backgroundColor: theme.backgrounds.surface,
    },
    chipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    chipLabel: {
      color: theme.typography.primary,
      fontSize: moderateScale(13),
      ...cairoFont('medium'),
    },
    chipLabelActive: {
      color: theme.typography.inverse,
    },
  });

export const tabBarStyles = (_theme: ThemeType, _direction: LangDirection) =>
  StyleSheet.create({
    /** @deprecated Tab bar styles live in navigation/components/main-tab-bar */
    wrap: {},
  });
