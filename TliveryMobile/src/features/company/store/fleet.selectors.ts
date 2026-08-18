import type {FleetStore} from './fleet.store';

export const selectFleetCompany = (state: FleetStore) => state.company;
export const selectFleetDrivers = (state: FleetStore) => state.drivers;
export const selectFleetOrders = (state: FleetStore) => state.orders;

export const selectFleetDriverById = (id: string) => (state: FleetStore) =>
  state.drivers.find(driver => driver.id === id);

export const selectFleetOrderById = (id: string) => (state: FleetStore) =>
  state.orders.find(order => order.id === id);

export const selectActiveDrivers = (state: FleetStore) =>
  state.drivers.filter(
    driver => driver.status === 'active' || driver.status === 'busy',
  );

export const selectFleetKpis = (state: FleetStore) => {
  const {orders, drivers, company} = state;
  return {
    openOrders: orders.filter(
      o => !['delivered', 'completed', 'cancelled', 'refunded'].includes(o.status),
    ).length,
    pendingAssign: orders.filter(
      o =>
        o.status === 'pendingCompany' ||
        o.status === 'companyAccepted' ||
        (!o.driverId &&
          !['delivered', 'completed', 'cancelled'].includes(o.status)),
    ).length,
    driversOnline: drivers.filter(
      d => d.status === 'active' || d.status === 'busy',
    ).length,
    driverCapacity: company?.maxDrivers ?? 0,
    driversTotal: drivers.length,
  };
};
