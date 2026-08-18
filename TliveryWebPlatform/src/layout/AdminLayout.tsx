import {NavLink, Outlet, useNavigate} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Moon,
  MapPinned,
  Package,
  Settings,
  Store,
  Sun,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {useTheme} from '../theme/ThemeContext';
import {BrandLogo} from '../components/BrandLogo';
import {LanguageSwitcher} from '../components/LanguageSwitcher';
import type {AuthRole} from '../auth/auth.types';
import type {CompanyPermission} from '../constants/permissions';
import {workflowService} from '../services/workflowService';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof Truck;
  roles: AuthRole[];
  permission?: CompanyPermission | CompanyPermission[];
};

const NAV: NavItem[] = [
  {to: '/', labelKey: 'navDashboard', icon: LayoutDashboard, roles: ['super_admin']},
  {to: '/application', labelKey: 'navApplication', icon: ClipboardList, roles: ['applicant']},
  {to: '/companies', labelKey: 'navCompanies', icon: Building2, roles: ['super_admin']},
  {
    to: '/orders',
    labelKey: 'navOrders',
    icon: Package,
    roles: [
      'super_admin',
      'company_admin',
      'company_employee',
      'client',
      'merchant',
      'driver',
    ],
    permission: 'orders:read',
  },
  {
    to: '/drivers',
    labelKey: 'navDrivers',
    icon: Truck,
    roles: ['company_admin', 'company_employee'],
    permission: 'drivers:manage',
  },
  {
    to: '/drivers/map',
    labelKey: 'navDriversMap',
    icon: MapPinned,
    roles: ['company_admin', 'company_employee'],
    permission: 'drivers:manage',
  },
  {
    to: '/merchants',
    labelKey: 'navMerchants',
    icon: Store,
    roles: ['company_admin', 'company_employee'],
    permission: ['merchants:read', 'merchants:manage', 'customers:manage'],
  },
  {
    to: '/accounts',
    labelKey: 'navAccounts',
    icon: Wallet,
    roles: [
      'company_admin',
      'company_employee',
      'driver',
      'client',
      'merchant',
    ],
    permission: 'accounts:read',
  },
  {
    to: '/reports',
    labelKey: 'navReports',
    icon: BarChart3,
    roles: ['company_admin', 'company_employee'],
    permission: 'reports:read',
  },
  {
    to: '/employees',
    labelKey: 'navEmployees',
    icon: Users,
    roles: ['company_admin', 'company_employee'],
    permission: 'employees:manage',
  },
  {
    to: '/settings',
    labelKey: 'navSettings',
    icon: Settings,
    roles: [
      'super_admin',
      'company_admin',
      'company_employee',
      'client',
      'merchant',
      'driver',
    ],
  },
];

function canSeeNav(item: NavItem, role: AuthRole, permissions: string[]): boolean {
  if (!item.roles.includes(role)) {
    return false;
  }
  if (role === 'client' || role === 'merchant' || role === 'driver') {
    return (
      item.to === '/orders' ||
      item.to === '/settings' ||
      item.to === '/accounts'
    );
  }
  if (role !== 'company_employee') {
    return true;
  }
  if (!item.permission) {
    return true;
  }
  const needed = Array.isArray(item.permission)
    ? item.permission
    : [item.permission];
  return needed.some(p => permissions.includes(p));
}

export function AdminLayout() {
  const {t} = useTranslation();
  const {user, logout, refreshUser} = useAuth();
  const {toggleMode, isDark} = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions =
    (user?.profile as {permissions?: string[]} | null)?.permissions ?? [];
  const isIssued = user?.role === 'client' || user?.role === 'merchant';

  const membershipsQuery = useQuery({
    queryKey: ['myCompanyMemberships', user?.id],
    queryFn: () => workflowService.listMyCompanyMemberships(),
    enabled: Boolean(user?.id) && isIssued,
  });
  const memberships = membershipsQuery.data?.memberships ?? [];
  const activeMembership =
    memberships.find(item => item.active) ?? memberships[0] ?? null;

  const switchCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const result = await workflowService.switchActiveCompany(companyId);
      await refreshUser();
      return result;
    },
    onSuccess: async result => {
      showToast(
        ToastType.success,
        t('companySwitchedToast', {company: result.companyName}),
      );
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['orders']}),
        queryClient.invalidateQueries({queryKey: ['finance']}),
        queryClient.invalidateQueries({queryKey: ['myCompanyMemberships']}),
      ]);
    },
    onError: error =>
      showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <BrandLogo tone="onDark" size="header" />
          <div className="brand-sub">{t('adminSubtitle')}</div>
        </div>

        <nav className="nav-list">
          {NAV.filter(
            item => user && canSeeNav(item, user.role, permissions),
          ).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/drivers'}
              className={({isActive}) =>
                `nav-link${isActive ? ' active' : ''}`
              }>
              <item.icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{paddingInline: 10, display: 'grid', gap: 10}}>
          <div className="muted">
            {t('signedInAs', {name: user?.name ?? ''})}
          </div>
          <div className="engine-status" role="status">
            {t('engineStatus')}
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{display: 'grid', gap: 4}}>
            <h1 style={{margin: 0}}>
              {isIssued && activeMembership
                ? activeMembership.companyName
                : t('administration')}
            </h1>
            {isIssued && memberships.length > 1 ? (
              <label className="muted" style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <span>{t('switchCompany')}</span>
                <select
                  value={activeMembership?.companyId ?? ''}
                  disabled={switchCompany.isPending}
                  onChange={event => {
                    const next = event.target.value;
                    if (next && next !== activeMembership?.companyId) {
                      switchCompany.mutate(next);
                    }
                  }}>
                  {memberships.map(item => (
                    <option key={item.companyId} value={item.companyId}>
                      {item.companyName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <button
              type="button"
              className="icon-btn"
              aria-label={t('toggleTheme')}
              onClick={toggleMode}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={t('signOut')}
              onClick={() => {
                void logout().then(() => navigate('/login', {replace: true}));
              }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <Outlet />
        <footer className="app-footer">{t('poweredByWasel')}</footer>
      </div>
    </div>
  );
}
