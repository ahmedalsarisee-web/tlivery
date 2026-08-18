import {OrderStatus} from '@app/features/orders/types';
import type {WaselOrder} from '@app/features/orders/types';
import type {
  Driver,
  DriverApplication,
  DriverStatus,
} from '@app/models/workflow.model';

export type CompanyKpiId =
  | 'activeDrivers'
  | 'pendingDriverApplications'
  | 'driverCapacity'
  | 'sampleOrders';

export interface CompanyDashboardKpi {
  id: CompanyKpiId;
  value: string;
}

export interface DashboardSlice {
  id: string;
  nameKey: string;
  count: number;
  pct: number;
  colorToken: 'info' | 'gold' | 'success' | 'caption';
}

const DRIVER_STATUS_META: Record<
  DriverStatus,
  Pick<DashboardSlice, 'nameKey' | 'colorToken'>
> = {
  active: {nameKey: 'driverStatusActive', colorToken: 'success'},
  busy: {nameKey: 'driverStatusBusy', colorToken: 'gold'},
  offline: {nameKey: 'driverStatusOffline', colorToken: 'caption'},
  suspended: {nameKey: 'driverStatusSuspended', colorToken: 'info'},
};

const percentage = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

export const deriveCompanyKpis = (
  drivers: Driver[],
  applications: DriverApplication[],
  maxDrivers: number,
  orders: WaselOrder[],
): CompanyDashboardKpi[] => {
  const activeDrivers = drivers.filter(
    driver => driver.status === 'active' || driver.status === 'busy',
  ).length;
  const pendingApplications = applications.filter(
    application => application.status === 'pending',
  ).length;

  return [
    {id: 'activeDrivers', value: String(activeDrivers)},
    {id: 'pendingDriverApplications', value: String(pendingApplications)},
    {
      id: 'driverCapacity',
      value: `${drivers.length}/${Math.max(maxDrivers, drivers.length)}`,
    },
    {id: 'sampleOrders', value: String(orders.length)},
  ];
};

export const deriveDriverStatusSlices = (
  drivers: Driver[],
): DashboardSlice[] => {
  const total = drivers.length;
  return (Object.keys(DRIVER_STATUS_META) as DriverStatus[])
    .map(status => {
      const count = drivers.filter(driver => driver.status === status).length;
      return {
        id: status,
        ...DRIVER_STATUS_META[status],
        count,
        pct: percentage(count, total),
      };
    })
    .filter(slice => slice.count > 0);
};

const COMPLETE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'delivered',
  'completed',
]);
const ACTIVE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'driverAssigned',
  'driverOnTheWay',
  'arrivedPickup',
  'pickedUp',
  'onRoute',
  'nearCustomer',
]);

export const deriveSampleOrderSlices = (
  orders: WaselOrder[],
): DashboardSlice[] => {
  const completed = orders.filter(order =>
    COMPLETE_ORDER_STATUSES.has(order.status),
  ).length;
  const active = orders.filter(order =>
    ACTIVE_ORDER_STATUSES.has(order.status),
  ).length;
  const pending = Math.max(orders.length - completed - active, 0);
  const values = [
    {
      id: 'completed',
      nameKey: 'dashboardOrdersCompleted',
      count: completed,
      colorToken: 'success' as const,
    },
    {
      id: 'active',
      nameKey: 'dashboardOrdersActive',
      count: active,
      colorToken: 'gold' as const,
    },
    {
      id: 'pending',
      nameKey: 'dashboardOrdersPending',
      count: pending,
      colorToken: 'info' as const,
    },
  ];
  return values
    .map(value => ({
      ...value,
      pct: percentage(value.count, orders.length),
    }))
    .filter(slice => slice.count > 0);
};

export const filterSampleOrders = (
  orders: WaselOrder[],
  query: string,
  selectedDayIso?: string | null,
): WaselOrder[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return orders.filter(order => {
    const matchesDay =
      !selectedDayIso || order.createdAt.slice(0, 10) === selectedDayIso;
    const matchesQuery =
      !normalizedQuery ||
      [
        order.reference,
        order.customerName,
        order.pickupAddress,
        order.dropoffAddress,
        order.driverName ?? '',
      ].some(value => value.toLocaleLowerCase().includes(normalizedQuery));
    return matchesDay && matchesQuery;
  });
};

export type HomeKpiId = 'revenue' | 'todayOrders' | 'inDelivery' | 'delivered';

export interface HomeKpi {
  id: HomeKpiId;
  value: string;
  trendPct: number;
}

export interface CarrierSlice {
  id: string;
  nameKey: string;
  pct: number;
  colorToken: 'info' | 'gold' | 'success' | 'caption';
}

export interface HomeRecentOrder {
  id: string;
  reference: string;
  customerName: string;
  address: string;
  company: string;
  driver: string;
  status: 'delivered' | 'onRoute' | 'arrivedPickup' | 'pendingCompany';
}

export const HOME_KPIS: HomeKpi[] = [
  {id: 'revenue', value: '2450', trendPct: 15},
  {id: 'todayOrders', value: '120', trendPct: 18},
  {id: 'inDelivery', value: '35', trendPct: 5},
  {id: 'delivered', value: '80', trendPct: 12},
];

export const HOME_ORDERS_SERIES = [
  12, 8, 5, 4, 6, 18, 32, 48, 62, 71, 80, 88, 95, 98, 90, 84, 78, 70, 58, 42, 30,
  22, 16, 14,
];

export const HOME_CARRIER_SLICES: CarrierSlice[] = [
  {id: 'aramex', nameKey: 'carrierAramex', pct: 40, colorToken: 'info'},
  {id: 'go', nameKey: 'carrierGo', pct: 25, colorToken: 'gold'},
  {id: 'smsa', nameKey: 'carrierSmsa', pct: 20, colorToken: 'success'},
  {id: 'other', nameKey: 'carrierOther', pct: 15, colorToken: 'caption'},
];

export const HOME_RECENT_ORDERS: HomeRecentOrder[] = [
  {
    id: '1',
    reference: '#1258',
    customerName: 'أحمد علي',
    address: 'عمان - الشميساني',
    company: 'Aramex',
    driver: 'خالد محمد',
    status: 'delivered',
  },
  {
    id: '2',
    reference: '#1257',
    customerName: 'سارة حسن',
    address: 'عمان - الدوار السابع',
    company: 'Go',
    driver: 'عمر يوسف',
    status: 'onRoute',
  },
  {
    id: '3',
    reference: '#1256',
    customerName: 'محمد خالد',
    address: 'عمان - الجبيهة',
    company: 'SMSA',
    driver: 'رامي س.',
    status: 'arrivedPickup',
  },
  {
    id: '4',
    reference: '#1255',
    customerName: 'ليلى ناصر',
    address: 'عمان - خلدا',
    company: 'Aramex',
    driver: '—',
    status: 'pendingCompany',
  },
];

export type HomeOrderBadge = HomeRecentOrder['status'];

export const toOrderStatus = (s: HomeOrderBadge): OrderStatus => {
  switch (s) {
    case 'delivered':
      return 'delivered';
    case 'onRoute':
      return 'onRoute';
    case 'arrivedPickup':
      return 'arrivedPickup';
    default:
      return 'pendingCompany';
  }
};
