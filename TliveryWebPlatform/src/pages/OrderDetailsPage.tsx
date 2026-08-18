import {useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Check, UserPlus, X} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {
  useAcceptOrder,
  useAssignDriverToOrder,
  useCancelOrder,
  useDeleteOrder,
  useDriverDeliverOrder,
  useDriverReceiveOrder,
  useOrder,
  useUnassignDriverFromOrder,
} from '../hooks/useOrders';
import {useDrivers} from '../hooks/useWorkflow';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {Modal} from '../components/Modal';
import {canManageOrders} from '../utils/orderPermissions';
import {
  canOpenOrderPlacer,
  formatOrderPlacerLine,
  orderPlacerDetailsPath,
  orderSourceBadgeClass,
  orderSourceI18nKey,
  resolveOrderSource,
} from '../utils/orderSource';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {OrderTrackingCard} from '../components/live-tracking/OrderTrackingCard';

function orderStatusBadgeClass(status: string): string {
  if (status === 'cancelled') {
    return 'badge badge-rejected';
  }
  if (status === 'pendingCompany' || status === 'driverAssigned') {
    return 'badge badge-pending';
  }
  return 'badge badge-active';
}

function formatOrderDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function OrderDetailsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {orderId = ''} = useParams<{orderId: string}>();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const manageOrders = canManageOrders(user);
  const orderQuery = useOrder(orderId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const debouncedAssignSearch = useDebouncedValue(assignSearch, 250);
  const driversQuery = useDrivers(companyId, {
    q: debouncedAssignSearch,
    status: 'active',
  });
  const acceptOrder = useAcceptOrder();
  const cancelOrder = useCancelOrder();
  const assignDriver = useAssignDriverToOrder(companyId);
  const unassignDriver = useUnassignDriverFromOrder(companyId);
  const deleteOrder = useDeleteOrder();
  const receiveOrder = useDriverReceiveOrder();
  const deliverOrder = useDriverDeliverOrder();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const order = orderQuery.data;
  const assignDrivers = driversQuery.data?.drivers ?? [];

  const busy =
    acceptOrder.isPending ||
    cancelOrder.isPending ||
    assignDriver.isPending ||
    unassignDriver.isPending ||
    deleteOrder.isPending ||
    receiveOrder.isPending ||
    deliverOrder.isPending;

  const canAccept = manageOrders && order?.status === 'pendingCompany';
  const canCompletePickup =
    manageOrders && order?.status === 'companyAccepted';
  const canAssign =
    manageOrders &&
    order != null &&
    (order.status === 'driverAssigned' ||
      order.status === 'onRoute' ||
      order.status === 'shipped');
  const canUnassign =
    manageOrders &&
    Boolean(order?.driverId) &&
    (order?.status === 'onRoute' || order?.status === 'shipped');
  const canDelete =
    manageOrders &&
    (order?.status === 'companyAccepted' ||
      (order?.status === 'driverAssigned' && !order.driverId));
  const canDriverDeliver =
    user?.role === 'driver' &&
    (order?.status === 'onRoute' || order?.status === 'shipped') &&
    order.driverId === user.id;

  const onAccept = () => {
    if (!order) {
      return;
    }
    acceptOrder.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('orderAcceptedToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onConfirmReject = () => {
    if (!order) {
      return;
    }
    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        setRejectOpen(false);
        showToast(ToastType.success, t('orderRejectedToast'));
      },
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onCompletePickup = () => {
    if (!order) {
      return;
    }
    receiveOrder.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('pickupCompletedToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onDriverDeliver = () => {
    if (!order) {
      return;
    }
    deliverOrder.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('orderDeliveredToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onAssign = (driverId: string) => {
    if (!order) {
      return;
    }
    assignDriver.mutate(
      {orderId: order.id, driverId},
      {
        onSuccess: () => {
          setAssignOpen(false);
          showToast(ToastType.success, t('driverAssignedToast'));
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  const onUnassign = () => {
    if (!order) {
      return;
    }
    unassignDriver.mutate(order.id, {
      onSuccess: () =>
        showToast(ToastType.success, t('driverUnassignedToast')),
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  const onConfirmDelete = () => {
    if (!order) {
      return;
    }
    deleteOrder.mutate(order.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        showToast(ToastType.success, t('orderDeletedToast'));
        navigate('/orders');
      },
      onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
    });
  };

  if (orderQuery.isLoading) {
    return (
      <div className="page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="page">
        <div className="toolbar">
          <Link to="/orders" className="btn btn-secondary">
            {t('goBack')}
          </Link>
        </div>
        <div className="card">{t('orderNotFound')}</div>
      </div>
    );
  }

  const statusKey = `orderStatus_${order.status}`;
  const statusLabel = t(statusKey, {defaultValue: order.status});
  const lastUpdate = order.timeline[order.timeline.length - 1]?.at;
  const source = resolveOrderSource(order.createdByRole);
  const placerLine = formatOrderPlacerLine(order, t);
  const openPlacer = canOpenOrderPlacer(order);

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/orders" className="btn btn-secondary">
          {t('goBack')}
        </Link>
        <span className={orderSourceBadgeClass(source)}>
          {t(orderSourceI18nKey(source))}
        </span>
        <span className={orderStatusBadgeClass(order.status)}>{statusLabel}</span>
      </div>

      <div className="card">
        <h2 style={{marginTop: 0}}>{order.reference}</h2>
        <p className="muted" style={{marginBottom: 8}}>
          {formatOrderDate(order.createdAt)}
        </p>
        <p style={{margin: '4px 0'}}>
          <span className="muted">{t('orderPartyPlacer')}: </span>
          {openPlacer ? (
            <Link className="order-placer-link" to={orderPlacerDetailsPath(order)}>
              {placerLine}
              <span className="order-placer-chevron" aria-hidden>
                ›
              </span>
            </Link>
          ) : (
            placerLine
          )}
        </p>
        <p style={{margin: '4px 0'}}>
          <span className="muted">{t('orderPartyRecipient')}: </span>
          {order.customerName?.trim() || '—'}
        </p>
      </div>

      {canAccept ? (
        <div className="order-decision-row">
          <button
            type="button"
            className="order-decision-btn order-decision-btn-accept"
            disabled={busy}
            aria-label={t('acceptOrder')}
            title={t('acceptOrder')}
            onClick={onAccept}>
            <Check size={22} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            className="order-decision-btn order-decision-btn-reject"
            disabled={busy}
            aria-label={t('rejectOrder')}
            title={t('rejectOrder')}
            onClick={() => setRejectOpen(true)}>
            <X size={22} strokeWidth={2.6} />
          </button>
        </div>
      ) : null}
      {canCompletePickup ? (
        <div className="order-decision-row">
          <button
            type="button"
            className="order-decision-btn order-decision-btn-accept"
            disabled={busy}
            aria-label={t('completePickup')}
            title={t('completePickup')}
            onClick={onCompletePickup}>
            <Check size={22} strokeWidth={2.6} />
          </button>
        </div>
      ) : null}
      {canAssign && order.status === 'driverAssigned' ? (
        <div className="order-decision-row">
          <button
            type="button"
            className="order-decision-assign"
            disabled={busy}
            onClick={() => setAssignOpen(true)}>
            <UserPlus size={16} strokeWidth={2.4} />
            {t('assignDriver')}
          </button>
        </div>
      ) : null}

      {canDriverDeliver ||
      (canAssign && order.status !== 'driverAssigned') ||
      canUnassign ||
      canDelete ? (
        <div className="toolbar">
          {canAssign && order.status !== 'driverAssigned' ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => setAssignOpen(true)}>
              {order.driverId ? t('reassignDriver') : t('assignDriver')}
            </button>
          ) : null}
          {canUnassign ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={onUnassign}>
              {t('unassignDriver')}
            </button>
          ) : null}
          {canDriverDeliver ? (
            <>
              <p className="muted" style={{margin: 0, flex: 1}}>
                {t('driverDeliverHint')}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={onDriverDeliver}>
                {t('deliverOrder')}
              </button>
            </>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}>
              {t('deleteOrder')}
            </button>
          ) : null}
        </div>
      ) : null}

      <OrderTrackingCard
        order={order}
        isAssignedDriver={
          user?.role === 'driver' &&
          Boolean(user?.id) &&
          order.driverId === user.id
        }
      />

      <div className="card company-form">
        <strong>{t('shipmentDetails')}</strong>
        <div className="field">
          <label>{t('colSource')}</label>
          <p style={{margin: 0}}>
            <span className={orderSourceBadgeClass(source)}>
              {t(orderSourceI18nKey(source))}
            </span>
          </p>
        </div>
        <div className="field">
          <label>{t('colCustomer')}</label>
          <p style={{margin: 0}}>{order.customerName}</p>
        </div>
        <div className="field">
          <label>{t('customerPhone')}</label>
          <p style={{margin: 0}}>{order.customerPhone}</p>
        </div>
        {order.notes?.trim() ? (
          <div className="field">
            <label>{t('shipmentNotes')}</label>
            <p style={{margin: 0, whiteSpace: 'pre-wrap'}}>{order.notes.trim()}</p>
          </div>
        ) : null}
        <div className="field">
          <label>{t('pickupAddress')}</label>
          <p style={{margin: 0}}>{order.pickupAddress}</p>
        </div>
        <div className="field">
          <label>{t('dropoffAddress')}</label>
          <p style={{margin: 0}}>{order.dropoffAddress}</p>
        </div>
        {order.companyName ? (
          <div className="field">
            <label>{t('colCompany')}</label>
            <p style={{margin: 0}}>{order.companyName}</p>
          </div>
        ) : null}
        <div className="field">
          <label>{t('colDriver')}</label>
          <p style={{margin: 0}}>{order.driverName ?? '—'}</p>
        </div>
        <div className="field">
          <label>{t('colAmount')}</label>
          <p style={{margin: 0}}>
            {order.amountJod.toFixed(2)} {t('jod')}
            {order.isCod ? ` · ${t('cod')}` : ''}
          </p>
        </div>
        <div className="field">
          <label>{t('lastUpdate')}</label>
          <p style={{margin: 0}}>
            {lastUpdate
              ? `${formatOrderDate(lastUpdate)} · ${statusLabel}`
              : statusLabel}
          </p>
        </div>
      </div>

      <Modal
        open={assignOpen}
        title={t('assignDriver')}
        onClose={() => {
          setAssignOpen(false);
          setAssignSearch('');
        }}>
        <p className="muted">{t('assignDriverHint')}</p>
        <label className="search-field" style={{display: 'block', marginBottom: 12}}>
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
          <div style={{display: 'grid', gap: 8, maxHeight: 320, overflow: 'auto'}}>
            {assignDrivers.map(driver => (
              <button
                key={driver.id}
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => onAssign(driver.id)}>
                {driver.fullName}
                {driver.phone ? ` · ${driver.phone}` : ''}
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        title={t('rejectOrderTitle')}
        onClose={() => setRejectOpen(false)}>
        <p className="muted">{t('rejectOrderBody', {ref: order.reference})}</p>
        <div className="toolbar" style={{marginTop: 16}}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={cancelOrder.isPending}
            onClick={() => setRejectOpen(false)}>
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
        open={deleteOpen}
        title={t('deleteOrderTitle')}
        onClose={() => setDeleteOpen(false)}>
        <p className="muted">{t('deleteOrderBody', {ref: order.reference})}</p>
        <div className="toolbar" style={{marginTop: 16}}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={deleteOrder.isPending}
            onClick={() => setDeleteOpen(false)}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleteOrder.isPending}
            onClick={onConfirmDelete}>
            {t('delete')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
