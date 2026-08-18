import type {ListPageResult, ListQueryParams} from '@app/types/listQuery';
import {DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE} from '@app/types/listQuery';

export const normalizePage = (page?: number): number =>
  Math.max(1, Math.floor(page ?? 1));

export const normalizePageSize = (pageSize?: number): number => {
  const size = Math.floor(pageSize ?? DEFAULT_PAGE_SIZE);
  return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
};

export const matchesSearch = (
  query: string | undefined,
  fields: Array<string | null | undefined>,
): boolean => {
  const normalized = query?.trim().toLocaleLowerCase() ?? '';
  if (!normalized) {
    return true;
  }
  return fields.some(field =>
    (field ?? '').toLocaleLowerCase().includes(normalized),
  );
};

/** Compare ISO datetime or date string against inclusive YYYY-MM-DD range. */
export const matchesDateRange = (
  isoDateTime: string | undefined,
  from?: string | null,
  to?: string | null,
): boolean => {
  if (!isoDateTime) {
    return !from && !to;
  }
  const day = isoDateTime.slice(0, 10);
  if (from && day < from) {
    return false;
  }
  if (to && day > to) {
    return false;
  }
  return true;
};

export const paginateItems = <T>(
  items: T[],
  params: Pick<ListQueryParams, 'page' | 'pageSize'> = {},
): ListPageResult<T> => {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const total = items.length;
  /** Cumulative window for infinite scroll (page 2 = first 2 pages of items). */
  const end = page * pageSize;
  return {
    items: items.slice(0, end),
    total,
    page,
    pageSize,
    hasMore: end < total,
  };
};

export const toListQueryParams = (state: {
  q: string;
  status: string;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
}): ListQueryParams => ({
  q: state.q.trim() || undefined,
  status: state.status && state.status !== 'all' ? state.status : undefined,
  from: state.from ?? undefined,
  to: state.to ?? undefined,
  page: state.page,
  pageSize: state.pageSize,
});
