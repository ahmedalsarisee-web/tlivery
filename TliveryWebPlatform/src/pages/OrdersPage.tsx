import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {
  useAcceptOrder,
  useAssignDriverToOrder,
  useCancelOrder,
  useDriverReceiveOrder,
  useOrders,
} from '../hooks/useOrders';
import {useDrivers} from '../hooks/useWorkflow';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {useListFilters} from '../components/ListToolbar';
import {Modal} from '../components/Modal';
import {OrderListCard} from '../components/orders/OrderListCard';
import {matchesDateRange, paginateItems} from '../lib/listQuery';
import {
  canCreateOrder,
  canManageOrders,
  canReadOrders,
} from '../utils/orderPermissions';
import {
  orderFilterI18nKey,
  orderFilterToApiStatus,
  orderFiltersForRole,
} from '../utils/orderFilters';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import type {OrderDto} from '../models/workflow';

const SEARCH_DEBOUNCE_MS = 400;

const ON_THE_WAY = new Set([
  'onRoute',
  'shipped',
  'driverOnTheWay',
  'arrivedPickup',
  'pickedUp',
  'nearCustomer',
]);
const DELIVERED = new Set(['delivered', 'completed']);
const CANCELLED = new Set([
  'cancelled',
  'failedDelivery',
  'refunded',
  'returned',
]);

export function OrdersPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const filters = useListFilters(8);
  const debouncedQ = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS);
  const canRead = canReadOrders(user);
  const canCreate = canCreateOrder(user);
  const manageOrders = canManageOrders(user);
  const companyId = user?.companyId ?? '';
  const acceptOrder = useAcceptOrder();
  const cancelOrder = useCancelOrder();
  const receiveOrder = useDriverReceiveOrder();
  const assignDriver = useAssignDriverToOrder(companyId);
  const [rejectTarget, setRejectTarget] = useState<OrderDto | null>(null);
  const [assignTarget, setAssignTarget] = useState<OrderDto | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const debouncedAssignSearch = useDebouncedValue(assignSearch, 250);
  const driversQuery = useDrivers(assignTarget ? companyId : '', {
    q: debouncedAssignSearch,
    status: 'active',
  });
  const assignDrivers = driversQuery.data?.drivers ?? [];

  const apiStatus =
    orderFilterToApiStatus(filters.status, user?.role) ?? 'all';
  const ordersQuery = useOrders(apiStatus, canRead, debouncedQ);
  const allOrders = ordersQuery.data ?? [];

  const kpis = useMemo(() => {
    let onTheWay = 0;
    let delivered = 0;
    let revenue = 0;
    for (const order of allOrders) {
      if (ON_THE_WAY.has(order.status)) {
        onTheWay += 1;
      }
      if (DELIVERED.has(order.status)) {
        delivered += 1;
      }
      if (!CANCELLED.has(order.status)) {
        revenue += Number(order.amountJod) || 0;
      }
    }
    return {
      total: allOrders.length,
      onTheWay,
      delivered,
      revenue,
    };
  }, [allOrders]);

  const onAccept = (order: OrderDto) => {
    acceptOrder.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('orderAcceptedToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onConfirmReject = () => {
    if (!rejectTarget) {
      return;
    }
    cancelOrder.mutate(rejectTarget.id, {
      onSuccess: () => {
        setRejectTarget(null);
        showToast(ToastType.success, t('orderRejectedToast'));
      },
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onCompletePickup = (order: OrderDto) => {
    receiveOrder.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('pickupCompletedToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const closeAssign = () => {
    setAssignTarget(null);
    setAssignSearch('');
  };

  const onAssign = (driverId: string) => {
    if (!assignTarget) {
      return;
    }
    assignDriver.mutate(
      {orderId: assignTarget.id, driverId},
      {
        onSuccess: () => {
          closeAssign();
          showToast(ToastType.success, t('driverAssignedToast'));
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  const statusOptions = useMemo(
    () =>
      orderFiltersForRole(user?.role).map(value => ({
        value,
        label: t(orderFilterI18nKey(value)),
      })),
    [t, user?.role],
  );

  const filteredOrders = useMemo(() => {
    const from = filters.dateFrom || undefined;
    if (!from) {
      return allOrders;
    }
    return allOrders.filter(order =>
      matchesDateRange(order.createdAt ?? undefined, from, from),
    );
  }, [allOrders, filters.dateFrom]);

  const page = useMemo(
    () =>
      paginateItems(filteredOrders, {
        page: filters.page,
        pageSize: filters.params.pageSize,
      }),
    [filteredOrders, filters.page, filters.params.pageSize],
  );

  const hasActiveFilters =
    Boolean(filters.query.trim()) ||
    filters.status !== 'all' ||
    Boolean(filters.dateFrom);

  const showInitialLoading =
    !ordersQuery.data &&
    (ordersQuery.isLoading || ordersQuery.isFetching) &&
    !ordersQuery.isError;

  if (showInitialLoading) {
    return (
      <div className="page orders-page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="page orders-page">
        <div className="card">{t('workflowActionError')}</div>
      </div>
    );
  }

  return (
    <div className="page orders-page">
      <div className="orders-page-header">
        <div className="orders-page-heading">
          <h1 className="orders-page-title">{t('navOrders')}</h1>
          <p className="orders-page-lead">{t('ordersLead')}</p>
        </div>
        {canCreate ? (
          <Link to="/orders/new" className="btn btn-primary orders-page-cta">
            <Plus size={18} strokeWidth={2.4} />
            {t('createOrder')}
          </Link>
        ) : null}
      </div>

      <div className="orders-kpi-grid">
        <div className="orders-kpi-card">
          <div className="orders-kpi-top">
            <span className="orders-kpi-label">{t('ordersKpiTotal')}</span>
            <span className="orders-kpi-icon is-total">
              <ShoppingBag size={18} strokeWidth={2.2} />
            </span>
          </div>
          <strong className="orders-kpi-value">{kpis.total}</strong>
        </div>
        <div className="orders-kpi-card">
          <div className="orders-kpi-top">
            <span className="orders-kpi-label">{t('ordersKpiOnTheWay')}</span>
            <span className="orders-kpi-icon is-way">
              <Truck size={18} strokeWidth={2.2} />
            </span>
          </div>
          <strong className="orders-kpi-value">{kpis.onTheWay}</strong>
        </div>
        <div className="orders-kpi-card">
          <div className="orders-kpi-top">
            <span className="orders-kpi-label">{t('ordersKpiDelivered')}</span>
            <span className="orders-kpi-icon is-done">
              <CheckCircle2 size={18} strokeWidth={2.2} />
            </span>
          </div>
          <strong className="orders-kpi-value">{kpis.delivered}</strong>
        </div>
        <div className="orders-kpi-card">
          <div className="orders-kpi-top">
            <span className="orders-kpi-label">{t('ordersKpiRevenue')}</span>
            <span className="orders-kpi-icon is-revenue">
              <Wallet size={18} strokeWidth={2.2} />
            </span>
          </div>
          <strong className="orders-kpi-value">
            {kpis.revenue.toFixed(2)} {t('jod')}
          </strong>
        </div>
      </div>

      <div className="orders-filter-bar">
        <label className="orders-filter-search">
          <Search size={16} strokeWidth={2.2} aria-hidden />
          <span className="sr-only">{t('searchOrdersPlaceholder')}</span>
          <input
            type="search"
            value={filters.query}
            onChange={event => filters.setQuery(event.target.value)}
            placeholder={t('searchOrdersPlaceholder')}
          />
        </label>
        <label className="orders-filter-field">
          <CalendarDays size={16} strokeWidth={2.2} aria-hidden />
          <span className="sr-only">{t('filterDate')}</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={event => filters.setDateFrom(event.target.value || '')}
            aria-label={t('filterDate')}
          />
        </label>
        <label className="orders-filter-field">
          <Package size={16} strokeWidth={2.2} aria-hidden />
          <span className="sr-only">{t('filterStatus')}</span>
          <select
            value={filters.status}
            onChange={event => filters.setStatus(event.target.value)}
            aria-label={t('filterStatus')}>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary orders-filter-more"
          onClick={filters.reset}
          disabled={!hasActiveFilters}>
          <Filter size={16} strokeWidth={2.2} />
          {hasActiveFilters ? t('clearFilters') : t('ordersMoreFilters')}
        </button>
      </div>

      <div className="orders-list-section">
        <h2 className="orders-list-heading">
          {t('ordersAllTitle', {count: page.total})}
        </h2>
        <div className="order-list-stack">
          {page.items.map(order => {
            const deciding =
              acceptOrder.isPending && acceptOrder.variables === order.id
                ? 'accept'
                : cancelOrder.isPending && cancelOrder.variables === order.id
                  ? 'reject'
                  : receiveOrder.isPending && receiveOrder.variables === order.id
                    ? 'pickup'
                    : null;
            return (
              <OrderListCard
                key={order.id}
                order={order}
                canDecide={manageOrders && order.status === 'pendingCompany'}
                canCompletePickup={
                  manageOrders && order.status === 'companyAccepted'
                }
                canAssignDriver={
                  manageOrders && order.status === 'driverAssigned'
                }
                deciding={deciding}
                assigning={
                  assignDriver.isPending && assignTarget?.id === order.id
                }
                onAccept={() => onAccept(order)}
                onReject={() => setRejectTarget(order)}
                onCompletePickup={() => onCompletePickup(order)}
                onAssignDriver={() => setAssignTarget(order)}
              />
            );
          })}
          {page.total === 0 ? (
            <div className="card empty">{t('noResults')}</div>
          ) : null}
        </div>

        {page.total > 0 ? (
          <div className="orders-pagination">
            <span className="muted">
              {t('paginationRange', {
                from:
                  page.total === 0
                    ? 0
                    : (page.page - 1) * page.pageSize + 1,
                to: Math.min(page.page * page.pageSize, page.total),
                total: page.total,
              })}
            </span>
            <div className="pager-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page.page <= 1}
                onClick={() => filters.setPage(page.page - 1)}>
                {t('previousPage')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!page.hasMore}
                onClick={() => filters.setPage(page.page + 1)}>
                {t('nextPage')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(rejectTarget)}
        title={t('rejectOrderTitle')}
        onClose={() => setRejectTarget(null)}>
        <p className="muted">
          {t('rejectOrderBody', {ref: rejectTarget?.reference ?? ''})}
        </p>
        <div className="toolbar" style={{marginTop: 16}}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={cancelOrder.isPending}
            onClick={() => setRejectTarget(null)}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={cancelOrder.isPending}
            onClick={onConfirmReject}>
            {t('rejectOrder')}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(assignTarget)}
        title={t('assignDriver')}
        onClose={closeAssign}>
        <p className="muted">{t('assignDriverHint')}</p>
        <label
          className="search-field"
          style={{display: 'block', marginBottom: 12}}>
          <span className="sr-only">{t('searchDriversPlaceholder')}</span>
          <input
            type="search"
            value={assignSearch}
            onChange={event => setAssignSearch(event.target.value)}
            placeholder={t('searchDriversPlaceholder')}
          />
        </label>
        {assignDrivers.length === 0 ? (
          <div className="empty">
            {debouncedAssignSearch.trim()
              ? t('noResults')
              : t('emptyDrivers')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 8,
              maxHeight: 320,
              overflow: 'auto',
            }}>
            {assignDrivers.map(driver => (
              <button
                key={driver.id}
                type="button"
                className="btn btn-secondary"
                disabled={assignDriver.isPending}
                onClick={() => onAssign(driver.id)}>
                {driver.fullName}
                {driver.phone ? ` · ${driver.phone}` : ''}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
