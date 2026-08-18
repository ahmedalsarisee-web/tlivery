import type {CompanyPermission} from '@app/constants/permissions';
import type {UserStore} from './user.store';

export const selectUserId = (state: UserStore) => state.id;
export const selectUserName = (state: UserStore) => state.name;
export const selectUserFullName = (state: UserStore) => state.fullName;
export const selectUserEmail = (state: UserStore) => state.email;
export const selectUserPhoneNumber = (state: UserStore) => state.phoneNumber;
export const selectUserRole = (state: UserStore) => state.role;
export const selectUserCompanyCode = (state: UserStore) => state.companyCode;
export const selectUserCompanyId = (state: UserStore) => state.companyId;
export const selectUserPermissions = (state: UserStore) => state.permissions;
export const selectUserStatus = (state: UserStore) => state.status;
export const selectProfileComplete = (state: UserStore) => state.profileComplete;
export const selectEmailVerified = (state: UserStore) => state.emailVerified;
export const selectProfileReady = (state: UserStore) => state.profileReady;
export const selectAuthReady = (state: UserStore) => state.authReady;
export const selectIsLoggedIn = (state: UserStore) => state.id !== null;
export const selectIsCompanyAdmin = (state: UserStore) =>
  state.profileReady && state.role === 'company_admin';
export const selectIsCompanyEmployee = (state: UserStore) =>
  state.profileReady && state.role === 'company_employee';
export const selectIsCompanyStaff = (state: UserStore) =>
  state.profileReady &&
  (state.role === 'company_admin' || state.role === 'company_employee');

/** Admins (and super admins) bypass permission checks. */
export const selectHasPermission =
  (permission: CompanyPermission) => (state: UserStore) => {
    if (state.role === 'company_admin' || state.role === 'super_admin') {
      return true;
    }
    return state.permissions.includes(permission);
  };

export const selectCanManageDrivers = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  selectHasPermission('drivers:manage')(state);

export const selectCanManageEmployees = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  selectHasPermission('employees:manage')(state);

export const selectCanViewMerchants = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  (selectHasPermission('merchants:read')(state) ||
    selectHasPermission('merchants:manage')(state));

export const selectCanManageMerchants = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  selectHasPermission('merchants:manage')(state);

export const selectCanManageCustomers = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  selectHasPermission('customers:manage')(state);

export const selectCanViewOrders = (state: UserStore) => {
  if (!state.profileReady) {
    return false;
  }
  if (state.role === 'driver' || state.role === 'client' || state.role === 'merchant') {
    return true;
  }
  return (
    selectHasPermission('orders:read')(state) ||
    selectHasPermission('orders:write')(state)
  );
};

export const selectCanManageOrders = (state: UserStore) =>
  state.profileReady &&
  selectIsCompanyStaff(state) &&
  selectHasPermission('orders:write')(state);

export const selectCanEnterMain = (state: UserStore) =>
  state.profileReady &&
  state.status === 'active' &&
  (state.role === 'company_admin' ||
    state.role === 'company_employee' ||
    state.role === 'driver' ||
    state.role === 'client' ||
    state.role === 'merchant');
