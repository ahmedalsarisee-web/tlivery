import {Platform, StyleSheet, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize} from '@app/theme/tokens';
import {moderateScale} from '@app/utils/responsive-design';

export const TAB_BAR_HEIGHT = 56;
export const TAB_HUMP_RISE = 28;
export const TAB_CORNER_RADIUS = 22;
export const TAB_FAB_SIZE = 52;

/**
 * Android: edgeToEdgeEnabled=false — window already ends above system nav.
 * Keep a small pad so labels aren't flush with the screen edge.
 */
export function useMainTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const bottomInset =
    Platform.OS === 'android' ? 6 : Math.max(insets.bottom, 6);
  const totalBarHeight = TAB_BAR_HEIGHT + bottomInset;
  const totalVisualHeight = totalBarHeight + TAB_HUMP_RISE;
  const reservedCenter = Math.round(
    Math.min(92, Math.max(80, windowWidth * 0.22)),
  );
  const rowPaddingHorizontal = Math.round(
    Math.min(18, Math.max(10, windowWidth * 0.032)),
  );

  return {
    bottomInset,
    totalBarHeight,
    totalVisualHeight,
    reservedCenter,
    rowPaddingHorizontal,
    humpRise: TAB_HUMP_RISE,
    cornerRadius: TAB_CORNER_RADIUS,
    fabSize: TAB_FAB_SIZE,
  };
}

export const mainTabBarStyles = (
  theme: ThemeType,
  direction: LangDirection,
  metrics: ReturnType<typeof useMainTabBarMetrics>,
  _isDark: boolean,
) => {
  const {
    bottomInset,
    reservedCenter,
    rowPaddingHorizontal,
    humpRise,
    fabSize,
  } = metrics;

  return StyleSheet.create({
    /** Synchro-style: pinned to the bottom of the MainTabs flex shell */
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      overflow: 'visible',
      zIndex: 60,
      backgroundColor: 'transparent',
    },
    shapeLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'visible',
      backgroundColor: 'transparent',
    },
    row: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: bottomInset,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: rowPaddingHorizontal,
      backgroundColor: 'transparent',
    },
    segment: {
      flex: 1,
      flexDirection: getFlexDirection(direction),
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
      backgroundColor: 'transparent',
    },
    centerSlot: {
      width: reservedCenter,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    tabButton: {
      flex: 1,
      minWidth: 0,
      maxWidth: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Platform.OS === 'ios' ? 2 : 1,
      paddingVertical: Platform.OS === 'ios' ? 2 : 1,
      paddingHorizontal: 2,
      backgroundColor: 'transparent',
    },
    tabLabel: {
      width: '100%',
      textAlign: 'center',
      fontSize: moderateScale(fontSize.label),
      ...cairoFont('bold'),
      color: theme.navigation.inactiveTint,
    },
    tabLabelActive: {
      color: theme.brand.gold,
    },
    fabWrap: {
      position: 'absolute',
      top: -(humpRise + fabSize / 2 - 2),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    fabCircle: {
      width: fabSize,
      height: fabSize,
      borderRadius: fabSize / 2,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.9)',
      shadowColor: theme.brand.navy,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 6,
    },
    fabPressed: {
      opacity: 0.92,
      transform: [{scale: 0.96}],
    },
    fabInner: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
  });
};
