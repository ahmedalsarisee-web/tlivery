export const firestoreCollections = {
  users: 'users',
  companyApplications: 'companyApplications',
  companies: 'companies',
  driverInvites: 'driverInvites',
  driverApplications: 'driverApplications',
  drivers: 'drivers',
  /** Hot path: one small doc per active driver for map listeners. */
  driverLocations: 'driver_locations',
  orders: 'orders',
  /** Subcollection under orders/{orderId}. */
  routeHistory: 'route_history',
} as const;
