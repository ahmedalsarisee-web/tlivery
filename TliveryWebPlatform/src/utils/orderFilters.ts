import type {AuthRole} from '../auth/auth.types';

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

export type OrderListFilter =
  | (typeof ACCOUNT_ORDER_FILTERS)[number]
  | (typeof COMPANY_ORDER_FILTERS)[number]
  | (typeof DRIVER_ORDER_FILTERS)[number];

export const orderFilterI18nKey = (filter: string): string =>
  `orderFilter_${filter}`;

export const isCompanyStaffRole = (
  role: AuthRole | null | undefined,
): boolean => role === 'company_admin' || role === 'company_employee';

export const orderFiltersForRole = (
  role: AuthRole | null | undefined,
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
 * Map list filter chip → listOrders status/bucket.
 * `undefined` = no server status filter (all / nearest).
 */
export const orderFilterToApiStatus = (
  filter: string,
  role?: AuthRole | null,
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
