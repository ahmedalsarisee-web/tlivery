import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {ListPageResult} from '../lib/listQuery';

type FilterOption = {value: string; label: string};

type ListToolbarProps<T> = {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  showDate?: boolean;
  onClear: () => void;
  page: ListPageResult<T>;
  onPageChange: (page: number) => void;
};

export function ListToolbar<T>({
  query,
  onQueryChange,
  searchPlaceholder,
  status,
  onStatusChange,
  statusOptions,
  dateFrom,
  onDateFromChange,
  showDate,
  onClear,
  page,
  onPageChange,
}: ListToolbarProps<T>) {
  const {t} = useTranslation();
  const from = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);
  const hasFilters =
    Boolean(query.trim()) ||
    (status && status !== 'all') ||
    Boolean(dateFrom);

  return (
    <div className="toolbar list-toolbar">
      <div className="toolbar-filters">
        <label className="search-field">
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            type="search"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        <select
          value={status}
          onChange={event => onStatusChange(event.target.value)}
          aria-label={t('filterStatus')}>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showDate && onDateFromChange ? (
          <input
            type="date"
            value={dateFrom ?? ''}
            onChange={event => onDateFromChange(event.target.value || '')}
            aria-label={t('filterDate')}
          />
        ) : null}
        {hasFilters ? (
          <button type="button" className="btn ghost" onClick={onClear}>
            {t('clearFilters')}
          </button>
        ) : null}
      </div>
      <div className="toolbar-pagination">
        <span className="muted">
          {page.total > 0
            ? t('paginationRange', {from, to, total: page.total})
            : t('noResults')}
        </span>
        <div className="pager-actions">
          <button
            type="button"
            className="btn secondary"
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}>
            {t('previousPage')}
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={!page.hasMore}
            onClick={() => onPageChange(page.page + 1)}>
            {t('nextPage')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useListFilters(pageSize = 10) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage] = useState(1);

  const reset = () => {
    setQuery('');
    setStatus('all');
    setDateFrom('');
    setPage(1);
  };

  const params = useMemo(
    () => ({
      q: query.trim() || undefined,
      status: status !== 'all' ? status : undefined,
      from: dateFrom || undefined,
      to: dateFrom || undefined,
      page,
      pageSize,
    }),
    [query, status, dateFrom, page, pageSize],
  );

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(1);
    },
    status,
    setStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    dateFrom,
    setDateFrom: (value: string) => {
      setDateFrom(value);
      setPage(1);
    },
    page,
    setPage,
    params,
    reset,
  };
}
