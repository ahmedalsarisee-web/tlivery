import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import type {MouseEvent} from 'react';
import {
  Check,
  MessageCircle,
  Phone,
  Truck,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import {formatPublicLocationShort} from '../../constants/jordanLocations';
import type {OrderDto} from '../../models/workflow';
import {orderPlacerDetailsPath} from '../../utils/orderSource';

type OrderListCardProps = {
  order: OrderDto;
  canDecide?: boolean;
  canCompletePickup?: boolean;
  canAssignDriver?: boolean;
  deciding?: 'accept' | 'reject' | 'pickup' | null;
  assigning?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCompletePickup?: () => void;
  onAssignDriver?: () => void;
};

function statusBucketKey(status: string): string {
  switch (status) {
    case 'draft':
    case 'pendingApproval':
    case 'pendingCompany':
      return 'orderFilter_pending';
    case 'companyAccepted':
      return 'orderFilter_toReceive';
    case 'driverAssigned':
      return 'orderFilter_needsDriver';
    case 'onRoute':
    case 'shipped':
    case 'driverOnTheWay':
    case 'arrivedPickup':
    case 'pickedUp':
    case 'nearCustomer':
      return 'orderFilter_onTheWay';
    case 'delivered':
    case 'completed':
      return 'orderFilter_delivered';
    case 'cancelled':
    case 'failedDelivery':
    case 'refunded':
    case 'returned':
      return 'orderFilter_cancelled';
    default:
      return `orderStatus_${status}`;
  }
}

function statusTone(
  status: string,
): 'waiting' | 'accepted' | 'onTheWay' | 'delivered' | 'cancelled' {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'failedDelivery':
    case 'refunded':
    case 'returned':
      return 'cancelled';
    case 'onRoute':
    case 'shipped':
    case 'driverOnTheWay':
    case 'arrivedPickup':
    case 'pickedUp':
    case 'nearCustomer':
      return 'onTheWay';
    case 'driverAssigned':
      return 'accepted';
    case 'companyAccepted':
    default:
      return 'waiting';
  }
}

function formatOrderWhen(iso: string | null, locale: string): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrderListCard({
  order,
  canDecide = false,
  canCompletePickup = false,
  canAssignDriver = false,
  deciding = null,
  assigning = false,
  onAccept,
  onReject,
  onCompletePickup,
  onAssignDriver,
}: OrderListCardProps) {
  const {t, i18n} = useTranslation();
  const isAr = (i18n.language || 'en').toLowerCase().startsWith('ar');
  const locale: 'ar' | 'en' = isAr ? 'ar' : 'en';
  const tone = statusTone(order.status);
  const fromLabel = formatPublicLocationShort(
    order.pickupLocation,
    locale,
    order.pickupAddress,
  );
  const toLabel = formatPublicLocationShort(
    order.dropoffLocation,
    locale,
    order.dropoffAddress,
  );
  const refLabel = order.reference?.startsWith('#')
    ? order.reference
    : `#${order.reference}`;
  const paymentLabel = order.isCod ? t('cod') : t('paymentCash');
  const personName =
    order.customerName?.trim() ||
    order.createdByName?.trim() ||
    '—';
  const isOnTheWay =
    order.status === 'onRoute' ||
    order.status === 'shipped' ||
    order.status === 'driverOnTheWay' ||
    order.status === 'arrivedPickup' ||
    order.status === 'pickedUp' ||
    order.status === 'nearCustomer';
  const isDelivered =
    order.status === 'delivered' || order.status === 'completed';
  const driverName = order.driverName?.trim() || '';
  const showDriverName = (isOnTheWay || isDelivered) && Boolean(driverName);
  const driverPath = order.driverId?.trim()
    ? `/drivers/${encodeURIComponent(order.driverId.trim())}`
    : null;
  const detailsPath = `/orders/${order.id}`;
  const decisionBusy = deciding != null || assigning;
  const senderPath = order.createdByUserId?.trim()
    ? orderPlacerDetailsPath(order)
    : null;
  const whenLabel = formatOrderWhen(order.createdAt, locale);

  const onCall = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const cleaned = order.customerPhone?.replace(/\s+/g, '') ?? '';
    if (!cleaned) {
      return;
    }
    window.location.href = `tel:${cleaned}`;
  };

  const onRejectClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onReject?.();
  };

  const onAcceptClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onAccept?.();
  };

  const onCompletePickupClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onCompletePickup?.();
  };

  const onAssignDriverClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onAssignDriver?.();
  };

  return (
    <article className={`order-list-card tone-${tone}`}>
      <div className="order-list-row">
        <Link to={detailsPath} className="order-list-identity">
          <strong className="order-list-ref">{refLabel}</strong>
          <span className="order-list-when muted">{whenLabel}</span>
          <div className="order-list-person">
            <span className="order-list-avatar" aria-hidden>
              <UserRound size={14} strokeWidth={2.3} />
            </span>
            <span className="order-list-person-name">{personName}</span>
            <button
              type="button"
              className="order-list-icon-btn"
              onClick={onCall}
              aria-label={t('callContact')}>
              <Phone size={14} strokeWidth={2.2} />
            </button>
            {senderPath ? (
              <Link
                to={senderPath}
                className="order-list-icon-btn"
                onClick={event => event.stopPropagation()}
                aria-label={t('senderDetailsTitle')}>
                <MessageCircle size={14} strokeWidth={2.2} />
              </Link>
            ) : null}
          </div>
        </Link>

        <div className="order-list-status-col">
          <span className={`order-list-status tone-${tone}`}>
            {t(statusBucketKey(order.status), {defaultValue: order.status})}
          </span>
        </div>

        <div className="order-list-specs">
          <div>
            <span className="muted">{t('ordersSpecWeight')}</span>
            <strong>—</strong>
          </div>
          <div>
            <span className="muted">{t('ordersSpecQty')}</span>
            <strong>—</strong>
          </div>
        </div>

        <Link to={detailsPath} className="order-list-route">
          <div className="order-list-stop">
            <span className="pin pin-from" aria-hidden />
            <span>{fromLabel}</span>
          </div>
          <div className="order-list-rail" aria-hidden />
          <div className="order-list-stop">
            <span className="pin pin-to" aria-hidden />
            <span>{toLabel}</span>
          </div>
        </Link>

        <div className="order-list-price-col">
          <strong className="order-list-amount">
            {order.amountJod.toFixed(2)} {t('jod')}
          </strong>
          <span className="muted">{paymentLabel}</span>
          <div className="order-list-actions">
            {canDecide ? (
              <>
                <button
                  type="button"
                  className="order-list-tool accept"
                  disabled={decisionBusy}
                  aria-label={t('acceptOrder')}
                  onClick={onAcceptClick}>
                  <Check size={16} strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  className="order-list-tool reject"
                  disabled={decisionBusy}
                  aria-label={t('rejectOrder')}
                  onClick={onRejectClick}>
                  <X size={16} strokeWidth={2.6} />
                </button>
              </>
            ) : null}
            {canCompletePickup ? (
              <button
                type="button"
                className="order-list-tool accept"
                disabled={decisionBusy}
                aria-label={t('completePickup')}
                title={t('completePickup')}
                onClick={onCompletePickupClick}>
                <Check size={16} strokeWidth={2.6} />
              </button>
            ) : null}
            {canAssignDriver ? (
              <button
                type="button"
                className="order-list-assign"
                disabled={decisionBusy}
                aria-label={t('assignDriver')}
                onClick={onAssignDriverClick}>
                <UserPlus size={14} strokeWidth={2.4} />
                <span>{t('assignDriver')}</span>
              </button>
            ) : null}
            {showDriverName ? (
              driverPath ? (
                <Link
                  to={driverPath}
                  className="order-list-driver"
                  onClick={event => event.stopPropagation()}
                  aria-label={t('viewDriverDetails')}>
                  <Truck size={14} strokeWidth={2.4} />
                  <span>{driverName}</span>
                </Link>
              ) : (
                <span className="order-list-driver is-disabled">
                  <Truck size={14} strokeWidth={2.4} />
                  <span>{driverName}</span>
                </span>
              )
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
