import type {AuthUser} from '../auth/auth.types';
import type {CompanyPermission} from '../constants/permissions';

function employeePermissions(user: AuthUser): string[] {
  return (user.profile as {permissions?: string[]} | null)?.permissions ?? [];
}

function hasEmployeePermission(
  user: AuthUser,
  permission: CompanyPermission,
): boolean {
  return employeePermissions(user).includes(permission);
}

export function canReadOrders(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  if (
    user.role === 'client' ||
    user.role === 'merchant' ||
    user.role === 'driver' ||
    user.role === 'super_admin'
  ) {
    return true;
  }
  if (user.role === 'company_admin') {
    return true;
  }
  if (user.role === 'company_employee') {
    return (
      hasEmployeePermission(user, 'orders:read') ||
      hasEmployeePermission(user, 'orders:write')
    );
  }
  return false;
}

export function canCreateOrder(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  if (user.role === 'client' || user.role === 'merchant') {
    return Boolean(user.companyId);
  }
  if (user.role === 'company_admin') {
    return true;
  }
  if (user.role === 'company_employee') {
    return hasEmployeePermission(user, 'orders:write');
  }
  return false;
}

export function canManageOrders(user: AuthUser | null): boolean {
  if (!user) {
    return false;
  }
  if (user.role === 'company_admin') {
    return true;
  }
  if (user.role === 'company_employee') {
    return hasEmployeePermission(user, 'orders:write');
  }
  return false;
}
