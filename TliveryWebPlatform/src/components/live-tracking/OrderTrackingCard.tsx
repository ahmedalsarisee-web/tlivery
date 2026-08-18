import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import type {OrderDto} from '../../models/workflow';
import {isOrderInDeliveryTracking} from '../../models/tracking.model';
import {openGoogleMapsDirections} from '../../services/google/googleDirectionsService';
import {showToast} from '../../utils/showToast';
import {ToastType} from '../../enums/ToastType';
import './OrderTrackingCard.css';

type Props = {
  order: OrderDto;
  /** Assigned driver: Google Maps only (no in-app live map — cost). */
  isAssignedDriver?: boolean;
};

const TERMINAL_DONE = new Set(['delivered', 'completed']);
const TERMINAL_STOP = new Set([
  'cancelled',
  'failedDelivery',
  'refunded',
  'returned',
]);

const shortAddress = (value?: string | null): string => {
  if (!value?.trim()) {
    return '—';
  }
  return value.split('·')[0]?.trim() || value.trim();
};

const formatWhen = (
  iso: string | null | undefined,
  locale: string,
): string | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Track card on Order Details for every role (mirrors mobile).
 * Drivers use device/Google Maps only — no in-app map billing for them.
 */
export function OrderTrackingCard({
  order,
  isAssignedDriver = false,
}: Props) {
  const {t, i18n} = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? 'ar-JO' : 'en-US';

  const isDone = TERMINAL_DONE.has(order.status);
  const isStopped = TERMINAL_STOP.has(order.status);
  const tripStarted = isOrderInDeliveryTracking(order.status);
  const canTrack =
    !isDone &&
    !isStopped &&
    Boolean(order.driverId) &&
    (order.status === 'driverAssigned' || tripStarted);

  const destinationAddress = tripStarted
    ? order.dropoffAddress
    : order.pickupAddress;

  const deliveredAt = useMemo(() => {
    const events = order.timeline ?? [];
    let hitAt: string | undefined;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const entry = events[i];
      if (entry.status === 'delivered' || entry.status === 'completed') {
        hitAt = entry.at;
        break;
      }
    }
    if (!hitAt && events.length > 0) {
      hitAt = events[events.length - 1]?.at;
    }
    return formatWhen(hitAt, locale);
  }, [order.timeline, locale]);

  const onOpenDeviceMaps = () => {
    const loc = tripStarted ? order.dropoffLocation : order.pickupLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      showToast(ToastType.info, t('trackingOrderCoordsMissing'));
      return;
    }
    openGoogleMapsDirections({lat: loc.lat, lng: loc.lng});
  };

  if (isDone) {
    return (
      <section className="order-tracking-card">
        <h3 className="order-tracking-card__title">{t('tripSummary')}</h3>
        <p className="order-tracking-card__meta">
          {t('orderStatus_delivered')}
          {deliveredAt ? ` · ${deliveredAt}` : ''}
        </p>
        {order.driverName ? (
          <div className="order-tracking-card__row">
            <span className="order-tracking-card__label">{t('driver')}</span>
            <p className="order-tracking-card__value">{order.driverName}</p>
          </div>
        ) : null}
        <div className="order-tracking-card__row">
          <span className="order-tracking-card__label">{t('pickupAddress')}</span>
          <p className="order-tracking-card__value">
            {shortAddress(order.pickupAddress)}
          </p>
        </div>
        <div className="order-tracking-card__row">
          <span className="order-tracking-card__label">{t('dropoffAddress')}</span>
          <p className="order-tracking-card__value">
            {shortAddress(order.dropoffAddress)}
          </p>
        </div>
      </section>
    );
  }

  if (isStopped) {
    return (
      <section className="order-tracking-card">
        <h3 className="order-tracking-card__title">{t('tripSummary')}</h3>
        <p className="order-tracking-card__meta">
          {t(`orderStatus_${order.status}`, {defaultValue: order.status})}
        </p>
        {order.driverName ? (
          <p className="order-tracking-card__value">
            {t('trackingDriver', {name: order.driverName})}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="order-tracking-card">
      <h3 className="order-tracking-card__title">{t('trackingSection')}</h3>
      <p className="order-tracking-card__meta">
        {isAssignedDriver
          ? tripStarted
            ? t('driverTripPhaseDropoff')
            : t('driverTripPhasePickup')
          : canTrack
            ? t('trackingEtaHintShort')
            : t('etaPending')}
      </p>

      {isAssignedDriver ? (
        <div className="order-tracking-card__row">
          <span className="order-tracking-card__label">
            {tripStarted ? t('dropoffAddress') : t('pickupAddress')}
          </span>
          <p className="order-tracking-card__value">
            {shortAddress(destinationAddress)}
          </p>
        </div>
      ) : (
        <p className="order-tracking-card__meta">
          {order.driverName
            ? t('trackingDriver', {name: order.driverName})
            : t('awaitingDriver')}
        </p>
      )}

      {canTrack && isAssignedDriver ? (
        <div className="order-tracking-card__actions">
          <button
            type="button"
            className="order-tracking-card__btn order-tracking-card__btn--primary"
            onClick={onOpenDeviceMaps}>
            {tripStarted ? t('navigateToDropoff') : t('navigateToPickup')}
          </button>
        </div>
      ) : null}

      {canTrack && !isAssignedDriver ? (
        <div className="order-tracking-card__actions">
          <Link
            to={`/orders/${order.id}/live`}
            className="order-tracking-card__btn">
            {t('viewOnMap')}
          </Link>
        </div>
      ) : null}

      {isAssignedDriver && canTrack ? (
        <p className="order-tracking-card__meta">{t('driverNavigateHint')}</p>
      ) : null}
    </section>
  );
}
