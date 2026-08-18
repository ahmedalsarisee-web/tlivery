import {useMemo} from 'react';
import {RefreshControl} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';

/** @deprecated Prefer ScreenContainer `pullToRefresh` or `@app/components/app-refresh-control`. */
export const useRefreshControl = (
  refreshing: boolean,
  onRefresh: () => void,
) => {
  const {theme} = useTheme();
  return useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.brand.gold}
        colors={[theme.brand.gold]}
        progressBackgroundColor={theme.backgrounds.surface}
      />
    ),
    [refreshing, onRefresh, theme],
  );
};
