import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {
  LiveTrackingMap,
  type RouteStats,
} from '../components/live-tracking/LiveTrackingMap';
import {useDriverLiveLocation} from '../hooks/useDriverLiveLocation';
import {useOrder} from '../hooks/useOrders';
import {isOrderInDeliveryTracking} from '../models/tracking.model';
import {formatDistanceLabel, type LatLng} from '../utils/geo';
import {OrderTrackingCard} from '../components/live-tracking/OrderTrackingCard';
import '../components/live-tracking/liveTrackingMaps.css';

/**
 * Watch-only live map for company / client / merchant.
 * Drivers are redirected to Order Details (device maps — no in-app map cost).
 */
export function LiveTrackingPage() {
  const {t, i18n} = useTranslation();
  const navigate = useNavigate();
  const {orderId = ''} = useParams<{orderId: string}>();
  const {user} = useAuth();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const driverId = order?.driverId ?? null;
  const tripStarted = Boolean(order && isOrderInDeliveryTracking(order.status));
  const goingToPickup = Boolean(order && !tripStarted && driverId);
  const isAssignedDriver =
    user?.role === 'driver' &&
    Boolean(user?.id) &&
    order?.driverId === user?.id;

  useEffect(() => {
    if (isAssignedDriver && orderId) {
      navigate(`/orders/${orderId}`, {replace: true});
    }
  }, [isAssignedDriver, orderId, navigate]);

  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  const {location, loading, error, isListening} = useDriverLiveLocation(
    driverId,
    {enabled: Boolean(driverId) && !isAssignedDriver},
  );

  const tripLocation =
    location &&
    (!location.orderId || location.orderId === orderId || !tripStarted)
      ? location
      : null;

  const pickup = useMemo((): LatLng | null => {
    const loc = order?.pickupLocation;
    if (loc == null || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      return null;
    }
    return {lat: loc.lat, lng: loc.lng};
  }, [order?.pickupLocation]);

  const dropoff = useMemo((): LatLng | null => {
    const loc = order?.dropoffLocation;
    if (loc == null || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      return null;
    }
    return {lat: loc.lat, lng: loc.lng};
  }, [order?.dropoffLocation]);

  const showPickup = !tripStarted && Boolean(pickup);
  const showDropoff = tripStarted && Boolean(dropoff);
  const routeTo = tripStarted ? dropoff : pickup;

  const onRouteStats = useCallback((stats: RouteStats | null) => {
    setRouteStats(stats);
  }, []);

  const etaMinutes = useMemo(() => {
    if (!routeStats?.durationSeconds) {
      return null;
    }
    return Math.max(1, Math.round(routeStats.durationSeconds / 60));
  }, [routeStats?.durationSeconds]);

  const distanceLabel = useMemo(() => {
    if (routeStats?.distanceMeters == null) {
      return '—';
    }
    return formatDistanceLabel(routeStats.distanceMeters);
  }, [routeStats?.distanceMeters]);

  const arrivalLabel = useMemo(() => {
    if (etaMinutes == null) {
      return '—';
    }
    const at = new Date(Date.now() + etaMinutes * 60_000);
    return at.toLocaleTimeString(
      i18n.language?.startsWith('ar') ? 'ar-JO' : 'en-US',
      {hour: 'numeric', minute: '2-digit'},
    );
  }, [etaMinutes, i18n.language]);

  const addressTitle = tripStarted
    ? order?.dropoffAddress?.split('·')[0]?.trim() ||
      order?.dropoffAddress ||
      t('dropoffAddress')
    : order?.pickupAddress?.split('·')[0]?.trim() ||
      order?.pickupAddress ||
      t('pickupAddress');

  const roleHint = useMemo(() => {
    if (!order) {
      return t('liveTracking');
    }
    if (!tripStarted) {
      return t('trackingWaitingReceive');
    }
    if (user?.role === 'client' || user?.role === 'merchant') {
      return t('trackingCustomerHint');
    }
    return t('trackingCompanyHint');
  }, [order, tripStarted, user?.role, t]);

  if (orderQuery.isLoading && !order) {
    return (
      <div className="page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="card">{t('orderNotFound')}</div>
        <Link to="/orders">{t('goBack')}</Link>
      </div>
    );
  }

  if (isAssignedDriver) {
    return null;
  }

  if (order.status === 'delivered' || order.status === 'completed') {
    return (
      <div className="page">
        <div className="page-lead">
          <p className="muted">
            <Link to={`/orders/${order.id}`}>{t('backToOrder')}</Link>
          </p>
          <h2>{t('tripSummary')}</h2>
        </div>
        <OrderTrackingCard order={order} />
      </div>
    );
  }

  if (
    order.status === 'cancelled' ||
    order.status === 'refunded' ||
    order.status === 'failedDelivery' ||
    order.status === 'returned'
  ) {
    return (
      <div className="page">
        <div className="page-lead">
          <p className="muted">
            <Link to={`/orders/${order.id}`}>{t('backToOrder')}</Link>
          </p>
          <h2>{t('tripSummary')}</h2>
        </div>
        <OrderTrackingCard order={order} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-lead">
        <p className="muted">
          <Link to={`/orders/${order.id}`}>{t('backToOrder')}</Link>
        </p>
        <h2>{t('liveTracking')}</h2>
        <p className="muted">
          {order.driverName
            ? t('trackingDriver', {name: order.driverName})
            : t('liveTracking')}
          {isListening ? ` · ${t('live')}` : ''}
        </p>
      </div>

      {error ? <p className="muted">{error.message}</p> : null}

      <div className="tracking-live-layout">
        <LiveTrackingMap
          location={tripLocation}
          loading={loading}
          showDriver={Boolean(tripLocation) || tripStarted || goingToPickup}
          showPickup={showPickup}
          showDropoff={showDropoff}
          pickup={pickup}
          dropoff={dropoff}
          routeTo={routeTo}
          driverLabel={order.driverName ?? undefined}
          statusHint={
            order.driverName
              ? `${t('trackingDriver', {name: order.driverName})}${
                  isListening ? ` · ${t('live')}` : ''
                }`
              : undefined
          }
          onRouteStats={onRouteStats}
        />

        <aside className="tracking-live-sheet">
          <div className="tracking-live-stats">
            <div className="tracking-live-stat">
              <span className="muted">{t('trackingEta')}</span>
              <strong>
                {etaMinutes != null
                  ? t('etaMinShort', {minutes: etaMinutes})
                  : t('etaPending')}
              </strong>
            </div>
            <div className="tracking-live-stat">
              <span className="muted">{t('trackingDistance')}</span>
              <strong>{distanceLabel}</strong>
            </div>
            <div className="tracking-live-stat">
              <span className="muted">{t('trackingArrival')}</span>
              <strong>{arrivalLabel}</strong>
            </div>
          </div>

          <div className="tracking-live-address">
            <span className="muted">
              {tripStarted ? t('dropoffAddress') : t('pickupAddress')}
            </span>
            <p>{addressTitle}</p>
            <p className="muted tracking-live-hint">{roleHint}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
