import {useMemo} from 'react';
import {RefreshControl, type RefreshControlProps} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';

export type AppRefreshControlProps = RefreshControlProps & {
  onRefresh: NonNullable<RefreshControlProps['onRefresh']>;
};

/**
 * Themed pull-to-refresh. Forward all ScrollView-injected props on Android —
 * omitting them can blank the scroll body.
 */
export function AppRefreshControl({
  refreshing,
  onRefresh,
  progressViewOffset = 0,
  ...rest
}: AppRefreshControlProps) {
  const {theme} = useTheme();
  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      tintColor={theme.brand.gold}
      colors={[theme.brand.gold]}
      progressBackgroundColor={theme.backgrounds.surface}
      progressViewOffset={progressViewOffset}
    />
  );
}

/** @deprecated Prefer ScreenContainer `pullToRefresh` or AppRefreshControl. */
export const useRefreshControl = (
  refreshing: boolean,
  onRefresh: () => void,
  progressViewOffset = 0,
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
        progressViewOffset={progressViewOffset}
      />
    ),
    [refreshing, onRefresh, theme, progressViewOffset],
  );
};
