import {useMemo} from 'react';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigationState} from '@react-navigation/native';
import {getHeight} from '@app/utils/responsive-design';
import {
  TAB_BAR_HEIGHT,
  TAB_HUMP_RISE,
} from '@app/navigation/components/main-tab-bar/styles';

const SCROLL_EXTRA = 16;

function useIsInsideTabNavigator(): boolean {
  return useNavigationState(state => {
    const walk = (s?: typeof state): boolean => {
      if (!s) {
        return false;
      }
      if (s.type === 'tab') {
        return true;
      }
      const route = s.routes?.[s.index ?? 0];
      if (route && 'state' in route && route.state) {
        return walk(route.state as typeof state);
      }
      return false;
    };
    return walk(state);
  });
}

/**
 * Bottom padding for scroll/screen content.
 * Inside main tabs (absolute Synchro-style bar), includes bar + hump clearance.
 */
export const useBottomSpacing = (base: number = getHeight(24)) => {
  const insets = useSafeAreaInsets();
  const inTabs = useIsInsideTabNavigator();
  // Android window already clears system nav (edgeToEdgeEnabled=false).
  const bottomInset =
    Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 8);

  return useMemo(() => {
    if (inTabs) {
      return {
        paddingBottom:
          base + TAB_BAR_HEIGHT + bottomInset + TAB_HUMP_RISE + SCROLL_EXTRA,
      };
    }
    return {
      paddingBottom:
        base + (Platform.OS === 'android' ? 0 : insets.bottom),
    };
  }, [base, bottomInset, inTabs, insets.bottom]);
};
