/**
 * Clear list API contract shared by Orders, Drivers, Employees.
 * Client helpers mirror what future server endpoints should return.
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export type ListQueryParams = {
  /** Free-text search (name, phone, reference, etc.) */
  q?: string;
  /** Status filter; empty / 'all' means no filter */
  status?: string;
  /** Inclusive start date YYYY-MM-DD */
  from?: string;
  /** Inclusive end date YYYY-MM-DD */
  to?: string;
  /** 1-based page index */
  page?: number;
  pageSize?: number;
};

export type ListPageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ListFilterState = {
  q: string;
  status: string;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
};

export const defaultListFilterState = (
  pageSize = DEFAULT_PAGE_SIZE,
): ListFilterState => ({
  q: '',
  status: 'all',
  from: null,
  to: null,
  page: 1,
  pageSize,
});

export type FilterChipOption = {
  value: string;
  labelKey: string;
};
