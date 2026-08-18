/**
 * Live driver tracking types — keep the hot path (current position) separate
 * from route history so map clients only subscribe to one small document.
 */

export type GeoPointLite = {
  latitude: number;
  longitude: number;
};

export type DriverLiveLocation = {
  driverId: string;
  /** Empty when driver is online but not on a delivery trip. */
  orderId: string;
  companyId: string;
  driverName: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  /** ISO string on the client; Firestore Timestamp on the wire. */
  updatedAt: string | null;
};

export type RouteHistoryPoint = {
  lat: number;
  lng: number;
  /** Unix ms */
  timestamp: number;
};

export type RouteHistoryBatch = {
  driverId: string;
  orderId: string;
  points: RouteHistoryPoint[];
  createdAt: string | null;
};

export type LocationTrackerConfig = {
  /** Minimum ms between live writes (default 15_000). */
  timeIntervalMs?: number;
  /** Minimum meters moved before a live write (default 30). */
  distanceFilterMeters?: number;
  /** Flush buffered route points at this interval (default 5 minutes). */
  routeFlushIntervalMs?: number;
  /** Max points kept in the local buffer before a forced flush. */
  maxBufferedPoints?: number;
};

export type StartTrackingInput = {
  driverId: string;
  companyId: string;
  /** Omit / empty for fleet presence without an active trip. */
  orderId?: string;
  driverName?: string | null;
};

/** Order statuses where the assigned driver's live pin is shown on the order map. */
export const ORDER_DELIVERY_TRACKING_STATUSES = [
  'shipped',
  'driverOnTheWay',
  'arrivedPickup',
  'pickedUp',
  'onRoute',
  'nearCustomer',
] as const;

export type OrderDeliveryTrackingStatus =
  (typeof ORDER_DELIVERY_TRACKING_STATUSES)[number];

export const isOrderInDeliveryTracking = (status: string): boolean =>
  (ORDER_DELIVERY_TRACKING_STATUSES as readonly string[]).includes(status);
