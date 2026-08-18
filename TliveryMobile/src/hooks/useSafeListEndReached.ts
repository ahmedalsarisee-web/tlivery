import {useCallback, useRef} from 'react';

/**
 * Guards FlatList onEndReached so it does not fire on first mount
 * (which jumps the list / scrolls the header filters out of view).
 * Enables after the user actually scrolls.
 */
export function useSafeListEndReached(
  onLoadMore: () => void,
  enabled: boolean,
) {
  const allowRef = useRef(false);

  const onScrollBeginDrag = useCallback(() => {
    allowRef.current = true;
  }, []);

  const onEndReached = useCallback(() => {
    if (!allowRef.current || !enabled) {
      return;
    }
    onLoadMore();
  }, [enabled, onLoadMore]);

  return {
    onEndReached,
    onScrollBeginDrag,
    onEndReachedThreshold: 0.35 as const,
  };
}
