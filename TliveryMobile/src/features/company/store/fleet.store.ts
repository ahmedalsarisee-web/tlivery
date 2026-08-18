import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import type {WaselOrder} from '@app/features/orders/types';
import {
  MOCK_COMPANY_DRIVERS,
  MOCK_COMPANY_ORDERS,
  MOCK_COMPANY_PROFILE,
} from '../data/mockCompany';
import type {AddDriverInput, CompanyDriver, CompanyProfile} from '../types';

export type FleetState = {
  company: CompanyProfile | null;
  drivers: CompanyDriver[];
  orders: WaselOrder[];
};

type FleetActions = {
  resetFleet: () => void;
  addDriver: (input: AddDriverInput) => void;
  removeDriver: (driverId: string) => void;
  setDriverStatus: (
    driverId: string,
    status: CompanyDriver['status'],
  ) => void;
  addOrder: (order: WaselOrder) => void;
  removeOrder: (orderId: string) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  unassignDriver: (orderId: string) => void;
  acceptOrder: (orderId: string) => void;
};

export type FleetStore = FleetState & FleetActions;

const createInitialState = (): FleetState => ({
  company: {...MOCK_COMPANY_PROFILE},
  drivers: MOCK_COMPANY_DRIVERS.map(driver => ({...driver})),
  orders: MOCK_COMPANY_ORDERS.map(order => ({
    ...order,
    timeline: order.timeline.map(event => ({...event})),
  })),
});

const nowTime = () => {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
};

export const useFleetStore = create<FleetStore>()(
  immer(set => ({
    ...createInitialState(),

    resetFleet: () => set(createInitialState()),

    addDriver: input =>
      set(state => {
        state.drivers.unshift({
          id: `drv_${Date.now()}`,
          ...input,
          status: 'active',
          activeOrders: 0,
          rating: 5,
          joinedAt: new Date().toISOString().slice(0, 10),
        });
      }),

    removeDriver: driverId =>
      set(state => {
        state.drivers = state.drivers.filter(driver => driver.id !== driverId);
        state.orders = state.orders.map(order =>
          order.driverId === driverId
            ? {
                ...order,
                driverId: undefined,
                driverName: undefined,
                status:
                  order.status === 'driverAssigned'
                    ? 'companyAccepted'
                    : order.status,
              }
            : order,
        );
      }),

    setDriverStatus: (driverId, status) =>
      set(state => {
        const driver = state.drivers.find(item => item.id === driverId);
        if (driver) {
          driver.status = status;
        }
      }),

    addOrder: order =>
      set(state => {
        state.orders.unshift(order);
      }),

    removeOrder: orderId =>
      set(state => {
        const order = state.orders.find(item => item.id === orderId);
        if (order?.driverId) {
          const driver = state.drivers.find(
            item => item.id === order.driverId,
          );
          if (driver && driver.activeOrders > 0) {
            driver.activeOrders -= 1;
          }
        }
        state.orders = state.orders.filter(item => item.id !== orderId);
      }),

    assignDriver: (orderId, driverId) =>
      set(state => {
        const order = state.orders.find(item => item.id === orderId);
        const driver = state.drivers.find(item => item.id === driverId);
        if (!order || !driver) {
          return;
        }

        if (order.driverId && order.driverId !== driver.id) {
          const previousDriver = state.drivers.find(
            item => item.id === order.driverId,
          );
          if (previousDriver && previousDriver.activeOrders > 0) {
            previousDriver.activeOrders -= 1;
          }
        }

        order.driverId = driver.id;
        order.driverName = driver.fullName;
        order.companyName = state.company?.companyName ?? order.companyName;
        order.companyCode = state.company?.companyCode ?? order.companyCode;

        if (
          order.status === 'pendingCompany' ||
          order.status === 'companyAccepted' ||
          order.status === 'pendingApproval'
        ) {
          order.status = 'driverAssigned';
          order.timeline.push({status: 'driverAssigned', at: nowTime()});
        }

        if (driver.status === 'offline' || driver.status === 'active') {
          driver.status = 'busy';
        }
        driver.activeOrders += 1;
      }),

    unassignDriver: orderId =>
      set(state => {
        const order = state.orders.find(item => item.id === orderId);
        if (!order?.driverId) {
          return;
        }

        const driver = state.drivers.find(item => item.id === order.driverId);
        if (driver && driver.activeOrders > 0) {
          driver.activeOrders -= 1;
          if (driver.activeOrders === 0 && driver.status === 'busy') {
            driver.status = 'active';
          }
        }

        order.driverId = undefined;
        order.driverName = undefined;
        order.status = 'companyAccepted';
        order.timeline.push({status: 'companyAccepted', at: nowTime()});
      }),

    acceptOrder: orderId =>
      set(state => {
        const order = state.orders.find(item => item.id === orderId);
        if (!order || order.status !== 'pendingCompany') {
          return;
        }
        order.status = 'companyAccepted';
        order.timeline.push({status: 'companyAccepted', at: nowTime()});
      }),
  })),
);
