import {Navigate, Outlet, Route, Routes, useLocation} from 'react-router-dom';
import type {ReactNode} from 'react';
import {useAuth} from './auth/AuthContext';
import {useCountry} from './providers/CountryContext';
import {AdminLayout} from './layout/AdminLayout';
import {PageLoading} from './components/PageLoading';
import {LoginPage} from './pages/LoginPage';
import {CompanyRegisterPage} from './pages/CompanyRegisterPage';
import {VerifyEmailPage} from './pages/VerifyEmailPage';
import {DashboardPage} from './pages/DashboardPage';
import {CompaniesPage} from './pages/CompaniesPage';
import {DriversPage} from './pages/DriversPage';
import {OrdersPage} from './pages/OrdersPage';
import {CreateOrderPage} from './pages/CreateOrderPage';
import {OrderDetailsPage} from './pages/OrderDetailsPage';
import {ShipmentDetailsPage} from './pages/ShipmentDetailsPage';
import {OrderPlacerDetailsPage} from './pages/OrderPlacerDetailsPage';
import {LiveTrackingPage} from './pages/LiveTrackingPage';
import {SettingsPage} from './pages/SettingsPage';
import {CompanyApplicationPage} from './pages/CompanyApplicationPage';
import {SelectCountryPage} from './pages/SelectCountryPage';
import {ComingSoonPage} from './pages/ComingSoonPage';
import {DriverDetailsPage} from './pages/DriverDetailsPage';
import {FleetDriversMapPage} from './pages/FleetDriversMapPage';
import {EmployeesPage} from './pages/EmployeesPage';
import {UnifiedIssuedAccountsPage} from './pages/UnifiedIssuedAccountsPage';
import {IssuedAccountDetailsPage} from './pages/IssuedAccountDetailsPage';
import {AccountsHubPage} from './pages/AccountsHubPage';
import {FinancePartyListPage} from './pages/FinancePartyListPage';
import {FinanceLedgerPage} from './pages/FinanceLedgerPage';
import {ClientInviteRegisterPage} from './pages/ClientInviteRegisterPage';
import {CustomerRegisterPage} from './pages/CustomerRegisterPage';
import type {AuthRole} from './auth/auth.types';

function CountryGate({children}: {children: ReactNode}) {
  const {hasSelectedCountry} = useCountry();
  const location = useLocation();
  if (!hasSelectedCountry && location.pathname !== '/select-country') {
    return <Navigate to="/select-country" replace />;
  }
  return children;
}

function ProtectedRoute() {
  const {isAuthenticated, isLoading} = useAuth();
  if (isLoading) {
    return <PageLoading />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RoleRoute({
  roles,
  requireActive = false,
  permission,
}: {
  roles: AuthRole[];
  requireActive?: boolean;
  permission?: string | string[];
}) {
  const {user} = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (requireActive && user.status !== 'active' && user.status !== 'approved') {
    return <div className="page"><div className="card">{user.status}</div></div>;
  }
  if (permission && user.role === 'company_employee') {
    const permissions =
      (user.profile as {permissions?: string[]} | null)?.permissions ?? [];
    const needed = Array.isArray(permission) ? permission : [permission];
    if (!needed.some(item => permissions.includes(item))) {
      return <Navigate to="/orders" replace />;
    }
  }
  return <Outlet />;
}

function RoleHome() {
  const {user} = useAuth();
  if (!user?.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (user?.role === 'applicant') {
    return <Navigate to="/application" replace />;
  }
  if (user?.role === 'company_admin' || user?.role === 'company_employee') {
    return <Navigate to="/orders" replace />;
  }
  if (user?.role === 'client' || user?.role === 'merchant' || user?.role === 'driver') {
    return <Navigate to="/orders" replace />;
  }
  return <DashboardPage />;
}

function OrdersReadRoute() {
  const {user} = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const allowedRoles: AuthRole[] = [
    'super_admin',
    'company_admin',
    'company_employee',
    'client',
    'merchant',
    'driver',
  ];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (
    user.role === 'company_employee' &&
    !(user.profile?.permissions ?? []).includes('orders:read') &&
    !(user.profile?.permissions ?? []).includes('orders:write')
  ) {
    return <Navigate to="/settings" replace />;
  }
  return <Outlet />;
}

function OrdersWriteRoute() {
  const {user} = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (user.role === 'client' || user.role === 'merchant') {
    if (!user.companyId) {
      return <Navigate to="/orders" replace />;
    }
    return <Outlet />;
  }
  if (user.role === 'company_admin') {
    return <Outlet />;
  }
  if (
    user.role === 'company_employee' &&
    (user.profile?.permissions ?? []).includes('orders:write')
  ) {
    return <Outlet />;
  }
  return <Navigate to="/orders" replace />;
}

function AccountsRoute() {
  const {user} = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  const partyRoles: AuthRole[] = ['driver', 'client', 'merchant'];
  if (partyRoles.includes(user.role)) {
    return <Outlet />;
  }
  if (user.role === 'company_admin') {
    return <Outlet />;
  }
  if (
    user.role === 'company_employee' &&
    ((user.profile?.permissions ?? []).includes('accounts:read') ||
      (user.profile?.permissions ?? []).includes('accounts:write'))
  ) {
    return <Outlet />;
  }
  return <Navigate to="/orders" replace />;
}

const companyRoles: AuthRole[] = ['company_admin', 'company_employee'];

export default function App() {
  return (
    <CountryGate>
      <Routes>
        <Route path="/select-country" element={<SelectCountryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-company" element={<CompanyRegisterPage />} />
        <Route path="/register-customer" element={<CustomerRegisterPage />} />
        <Route
          path="/invite/client/:code"
          element={<ClientInviteRegisterPage />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route element={<AdminLayout />}>
            <Route index element={<RoleHome />} />
            <Route element={<RoleRoute roles={['applicant']} />}>
              <Route path="application" element={<CompanyApplicationPage />} />
            </Route>
            <Route element={<RoleRoute roles={['super_admin']} />}>
              <Route path="companies" element={<CompaniesPage />} />
            </Route>
            <Route element={<OrdersReadRoute />}>
              <Route path="orders" element={<OrdersPage />} />
              <Route element={<OrdersWriteRoute />}>
                <Route path="orders/new" element={<CreateOrderPage />} />
              </Route>
              <Route
                path="orders/placer/:userId"
                element={<OrderPlacerDetailsPage />}
              />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
              <Route
                path="orders/:orderId/shipment"
                element={<ShipmentDetailsPage />}
              />
              <Route
                path="orders/:orderId/live"
                element={<LiveTrackingPage />}
              />
            </Route>
            <Route element={<RoleRoute roles={companyRoles} requireActive />}>
              <Route path="drivers" element={<DriversPage />} />
              <Route path="drivers/map" element={<FleetDriversMapPage />} />
              <Route path="drivers/:driverId" element={<DriverDetailsPage />} />
              <Route
                path="reports"
                element={
                  <ComingSoonPage
                    titleKey="navReports"
                    leadKey="systemSettlementFooter"
                  />
                }
              />
            </Route>
            <Route element={<AccountsRoute />}>
              <Route path="accounts" element={<AccountsHubPage />} />
              <Route
                path="accounts/merchants"
                element={<Navigate to="/merchants" replace />}
              />
              <Route
                path="accounts/customers"
                element={<Navigate to="/merchants" replace />}
              />
              <Route
                path="accounts/:kind"
                element={<FinancePartyListPage />}
              />
              <Route
                path="accounts/:kind/:partyUserId"
                element={<FinanceLedgerPage />}
              />
            </Route>
            <Route
              element={
                <RoleRoute
                  roles={companyRoles}
                  requireActive
                  permission={[
                    'merchants:read',
                    'merchants:manage',
                    'customers:manage',
                  ]}
                />
              }>
              <Route path="merchants" element={<UnifiedIssuedAccountsPage />} />
              <Route
                path="merchants/:kind/:accountId"
                element={<IssuedAccountDetailsPage />}
              />
            </Route>
            <Route
              element={
                <RoleRoute
                  roles={['company_admin', 'company_employee']}
                  requireActive
                  permission="employees:manage"
                />
              }>
              <Route path="employees" element={<EmployeesPage />} />
            </Route>
            <Route
              element={
                <RoleRoute
                  roles={['super_admin', 'company_admin', 'company_employee', 'client', 'merchant', 'driver']}
                />
              }>
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="settings/country"
                element={<SelectCountryPage mode="change" />}
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CountryGate>
  );
}
