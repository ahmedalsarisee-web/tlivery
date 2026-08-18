import type {WaselOrder} from '@app/features/orders/types';
import type {UserRole} from '@app/types/user';
import {
  isDriverDistanceSort,
  ORDER_STATUS_FILTERS,
  statusesForListFilter,
} from '@app/features/orders/orderStatus';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {distanceMeters} from '@app/utils/geo';

type Coord = {latitude: number; longitude: number};

export type ApplyOrderListFilterOptions = {
  role?: UserRole | null;
  driverCoord?: Coord | null;
};

const terminalStatuses = new Set([
  ...ORDER_STATUS_FILTERS.delivered,
  ...ORDER_STATUS_FILTERS.cancelled,
]);

const destinationForDriver = (order: WaselOrder): Coord | null => {
  const loc = isOrderInDeliveryTracking(order.status)
    ? order.dropoffLocation
    : order.pickupLocation;
  if (loc == null || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
    return null;
  }
  return {latitude: loc.lat, longitude: loc.lng};
};

const distanceOrInfinity = (order: WaselOrder, from: Coord | null): number => {
  if (!from) {
    return Number.POSITIVE_INFINITY;
  }
  const dest = destinationForDriver(order);
  if (!dest) {
    return Number.POSITIVE_INFINITY;
  }
  return distanceMeters(from, dest);
};

/**
 * Defensive client apply after listOrders.
 * Status chips are usually filtered by API; this keeps lists correct before
 * Cloud Functions redeploy and handles driver `nearest` sort.
 */
export function applyOrderListFilter(
  orders: WaselOrder[],
  filter: string,
  options: ApplyOrderListFilterOptions = {},
): WaselOrder[] {
  if (!filter || filter === 'all') {
    return orders;
  }

  if (isDriverDistanceSort(filter)) {
    const active = orders.filter(order => !terminalStatuses.has(order.status));
    const from = options.driverCoord ?? null;
    return [...active].sort((a, b) => {
      const da = distanceOrInfinity(a, from);
      const db = distanceOrInfinity(b, from);
      return filter === 'nearest' ? da - db : db - da;
    });
  }

  const bucket = statusesForListFilter(filter, options.role);
  if (bucket) {
    return orders.filter(order => bucket.includes(order.status));
  }

  return orders;
}

/** @deprecated Use applyOrderListFilter */
export function applyDriverOrderFilter(
  orders: WaselOrder[],
  filter: string,
  driverCoord: Coord | null,
): WaselOrder[] {
  return applyOrderListFilter(orders, filter, {
    role: 'driver',
    driverCoord,
  });
}
