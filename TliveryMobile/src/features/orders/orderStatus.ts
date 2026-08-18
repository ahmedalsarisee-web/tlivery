import type {StatusChipTone} from '@app/components/status-chip';
import type {UserRole} from '@app/types/user';
import type {OrderStatus} from '@app/features/orders/types';

/** Who created the order — issued account (client/merchant) vs company staff. */
export type OrderSource = 'account' | 'company';

export const resolveOrderSource = (
  createdByRole?: string | null,
): OrderSource => {
  if (createdByRole === 'client' || createdByRole === 'merchant') {
    return 'account';
  }
  return 'company';
};

export const orderSourceI18nKey = (source: OrderSource): string =>
  source === 'account' ? 'orderSourceAccount' : 'orderSourceCompany';

/** Canonical statuses used in the live workflow (detail chips / labels). */
export const ORDER_WORKFLOW_STATUSES: OrderStatus[] = [
  'pendingCompany',
  'companyAccepted',
  'driverAssigned',
  'onRoute',
  'cancelled',
  'delivered',
];

/**
 * Role-specific list chips — fewer, action-oriented buckets.
 * Values are sent to listOrders (except `nearest`, which sorts client-side).
 */
export const ACCOUNT_ORDER_FILTERS = [
  'all',
  'pending',
  'active',
  'delivered',
  'cancelled',
] as const;

export const COMPANY_ORDER_FILTERS = [
  'all',
  'pending',
  'toReceive',
  'needsDriver',
  'onTheWay',
  'delivered',
  'cancelled',
] as const;

export const DRIVER_ORDER_FILTERS = [
  'all',
  'onTheWay',
  'nearest',
  'delivered',
] as const;

export type AccountOrderFilter = (typeof ACCOUNT_ORDER_FILTERS)[number];
export type CompanyOrderFilter = (typeof COMPANY_ORDER_FILTERS)[number];
export type DriverOrderFilter = (typeof DRIVER_ORDER_FILTERS)[number];
export type OrderListFilter =
  | AccountOrderFilter
  | CompanyOrderFilter
  | DriverOrderFilter;

export const orderFilterI18nKey = (filter: string): string =>
  `orderFilter_${filter}`;

/** @deprecated Use orderFilterI18nKey */
export const driverOrderFilterI18nKey = (filter: string): string =>
  orderFilterI18nKey(filter);

export const isCompanyStaffRole = (
  role: UserRole | null | undefined,
): boolean => role === 'company_admin' || role === 'company_employee';

export const orderFiltersForRole = (
  role: UserRole | null | undefined,
): readonly OrderListFilter[] => {
  if (role === 'driver') {
    return DRIVER_ORDER_FILTERS;
  }
  if (isCompanyStaffRole(role)) {
    return COMPANY_ORDER_FILTERS;
  }
  return ACCOUNT_ORDER_FILTERS;
};

/**
 * Map a list chip to the status/bucket sent to listOrders.
 * `undefined` = no server status filter (all / nearest).
 *
 * Single-status chips send exact Firestore statuses (works on older backends).
 * Multi-status chips send bucket keys (`active`, company `onTheWay`).
 * Driver `onTheWay` → `onRoute` (in-transit only).
 */
export const orderFilterToApiStatus = (
  filter: string,
  role?: UserRole | null,
): string | undefined => {
  switch (filter) {
    case 'pending':
      return 'pendingCompany';
    case 'needsDriver':
      return 'driverAssigned';
    case 'toReceive':
      return 'companyAccepted';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    case 'active':
      return 'active';
    case 'onTheWay':
      return role === 'driver' ? 'onRoute' : 'onTheWay';
    case 'nearest':
    case 'farthest':
    case 'all':
    default:
      return undefined;
  }
};

/** @deprecated Use orderFilterToApiStatus(filter, 'driver') */
export const driverFilterToApiStatus = (
  filter: string,
): string | undefined => orderFilterToApiStatus(filter, 'driver');

export const isDriverDistanceSort = (filter: string): boolean =>
  filter === 'nearest' || filter === 'farthest';

/** Shared status buckets — API apply, client apply, and home counts. */
export const ORDER_STATUS_FILTERS: Record<string, OrderStatus[]> = {
  pending: ['draft', 'pendingApproval', 'pendingCompany'],
  waiting: ['draft', 'pendingApproval', 'pendingCompany'],
  needsDriver: ['driverAssigned'],
  accepted: ['companyAccepted', 'driverAssigned'],
  toReceive: ['companyAccepted'],
  active: [
    'companyAccepted',
    'driverAssigned',
    'onRoute',
    'shipped',
    'driverOnTheWay',
    'arrivedPickup',
    'pickedUp',
    'nearCustomer',
  ],
  onTheWay: [
    'onRoute',
    'shipped',
    'driverOnTheWay',
    'arrivedPickup',
    'pickedUp',
    'nearCustomer',
  ],
  /** Company “on the way” includes assigned, not-yet-received orders. */
  companyOnTheWay: [
    'onRoute',
    'shipped',
    'driverOnTheWay',
    'arrivedPickup',
    'pickedUp',
    'nearCustomer',
  ],
  delivered: ['delivered', 'completed'],
  cancelled: ['cancelled', 'failedDelivery', 'refunded', 'returned'],
};

/** Resolve which statuses a list chip means for a given role. */
export const statusesForListFilter = (
  filter: string,
  role?: UserRole | null,
): OrderStatus[] | null => {
  if (!filter || filter === 'all' || isDriverDistanceSort(filter)) {
    return null;
  }
  // Company “on the way” is delivery only — assignment/pickup have own tabs.
  if (filter === 'onTheWay' && isCompanyStaffRole(role)) {
    return ORDER_STATUS_FILTERS.onTheWay;
  }
  return ORDER_STATUS_FILTERS[filter] ?? null;
};

/** Home KPI sets — aligned with list filter buckets. */
export const ACCOUNT_PENDING_ORDER_STATUSES = new Set<OrderStatus>(
  ORDER_STATUS_FILTERS.pending,
);
export const ACCOUNT_ACTIVE_ORDER_STATUSES = new Set<OrderStatus>(
  ORDER_STATUS_FILTERS.active,
);
export const COMPANY_PENDING_ORDER_STATUSES = new Set<OrderStatus>([
  'pendingCompany',
]);
export const COMPANY_ACTIVE_ORDER_STATUSES = new Set<OrderStatus>(
  ORDER_STATUS_FILTERS.onTheWay,
);
export const DONE_ORDER_STATUSES = new Set<OrderStatus>(
  ORDER_STATUS_FILTERS.delivered,
);

export const orderStatusI18nKey = (status: OrderStatus | string): string =>
  `orderStatus_${status}`;

export const orderStatusTone = (status: OrderStatus): StatusChipTone => {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'failedDelivery':
    case 'refunded':
    case 'returned':
      return 'cancelled';
    case 'shipped':
    case 'driverOnTheWay':
    case 'arrivedPickup':
    case 'pickedUp':
    case 'onRoute':
    case 'nearCustomer':
      return 'onTheWay';
    case 'companyAccepted':
      return 'waiting';
    case 'driverAssigned':
      return 'accepted';
    case 'pendingCompany':
    case 'pendingApproval':
    case 'draft':
    default:
      return 'waiting';
  }
};
