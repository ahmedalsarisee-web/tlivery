import {useCallback, useRef, useState} from 'react';

const DEFAULT_MIN_DURATION_MS = 400;

export type UsePullToRefreshOptions = {
  onRefresh: () => Promise<unknown>;
  /** Avoid a flash when the network responds instantly. */
  minDurationMs?: number;
  enabled?: boolean;
};

export function usePullToRefresh({
  onRefresh,
  minDurationMs = DEFAULT_MIN_DURATION_MS,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const busyRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const handleRefresh = useCallback(async () => {
    if (!enabled || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setRefreshing(true);
    const startedAt = Date.now();
    try {
      await onRefreshRef.current();
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < minDurationMs) {
        await new Promise<void>(resolve =>
          setTimeout(resolve, minDurationMs - elapsed),
        );
      }
      setRefreshing(false);
      busyRef.current = false;
    }
  }, [enabled, minDurationMs]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}

/** List screens backed by React Query — keep content visible while refetching. */
export function useQueryListPullToRefresh(
  query: {
    refetch: () => Promise<unknown>;
    isFetching: boolean;
    isPending: boolean;
  },
  options?: {
    minDurationMs?: number;
    onBeforeRefresh?: () => void;
  },
) {
  const onBeforeRefreshRef = useRef(options?.onBeforeRefresh);
  onBeforeRefreshRef.current = options?.onBeforeRefresh;

  const onRefresh = useCallback(async () => {
    onBeforeRefreshRef.current?.();
    await query.refetch();
  }, [query]);

  const pull = usePullToRefresh({
    onRefresh,
    minDurationMs: options?.minDurationMs,
  });

  const queryRefreshing = query.isFetching && !query.isPending;

  return {
    refreshing: pull.refreshing || queryRefreshing,
    onRefresh: pull.onRefresh,
  };
}
