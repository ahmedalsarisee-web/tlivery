/**
 * Live driver tracking types — hot path (`driver_locations`) separate from route history.
 */

export type DriverLiveLocation = {
  driverId: string;
  /** Empty when online but not on a delivery trip. */
  orderId: string;
  companyId: string;
  driverName: string | null;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  updatedAt: string | null;
};

export const ORDER_DELIVERY_TRACKING_STATUSES = [
  'shipped',
  'driverOnTheWay',
  'arrivedPickup',
  'pickedUp',
  'onRoute',
  'nearCustomer',
] as const;

export const isOrderInDeliveryTracking = (status: string): boolean =>
  (ORDER_DELIVERY_TRACKING_STATUSES as readonly string[]).includes(status);
