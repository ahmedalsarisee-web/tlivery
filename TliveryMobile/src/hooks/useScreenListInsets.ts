import {useMemo} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBottomSpacing} from '@app/hooks/useBottomSpacing';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {HOME_HEADER_NAV_HEIGHT} from '@app/features/home/components/home-header/headerMetrics';
import {space} from '@app/theme/tokens';

/**
 * Insets for FlatList screens so content scrolls under the absolute nav
 * header and floating tab bar (same as ScrollView contentContainerStyle).
 */
export function useScreenListInsets(withNavHeader = true) {
  const insets = useSafeAreaInsets();
  const bottomSpacing = useBottomSpacing();

  return useMemo(() => {
    const paddingTop = withNavHeader
      ? insets.top + getHeight(HOME_HEADER_NAV_HEIGHT) + getHeight(6)
      : 0;

    return {
      paddingTop,
      paddingBottom: bottomSpacing.paddingBottom,
      paddingHorizontal: getWidth(20),
      progressViewOffset: paddingTop,
      sectionGap: getHeight(space.sm),
    };
  }, [bottomSpacing.paddingBottom, insets.top, withNavHeader]);
}
