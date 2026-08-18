import {useCallback, useMemo, useState} from 'react';
import {
  defaultListFilterState,
  type ListFilterState,
} from '@app/types/listQuery';
import {toListQueryParams} from '@app/utils/listQuery';

export const useListQueryState = (pageSize?: number) => {
  const [state, setState] = useState<ListFilterState>(() =>
    defaultListFilterState(pageSize),
  );

  const setQuery = useCallback((q: string) => {
    setState(prev => ({...prev, q, page: 1}));
  }, []);

  const setStatus = useCallback((status: string) => {
    setState(prev => ({...prev, status, page: 1}));
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    setState(prev => ({...prev, from, to, page: 1}));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({...prev, page: Math.max(1, page)}));
  }, []);

  const loadMore = useCallback((hasMore: boolean) => {
    if (!hasMore) {
      return;
    }
    setState(prev => ({...prev, page: prev.page + 1}));
  }, []);

  const reset = useCallback(() => {
    setState(defaultListFilterState(pageSize));
  }, [pageSize]);

  const params = useMemo(() => toListQueryParams(state), [state]);

  return {
    state,
    params,
    setQuery,
    setStatus,
    setDateRange,
    setPage,
    loadMore,
    reset,
  };
};
