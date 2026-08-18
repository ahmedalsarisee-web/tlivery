import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Store, User} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {employeeHasAnyPermission} from '../utils/shareCredentials';

export function MerchantsHubPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const permissions =
    (user?.profile as {permissions?: string[]} | null)?.permissions ?? [];
  const isAdmin = user?.role === 'company_admin';
  const canMerchants =
    isAdmin ||
    employeeHasAnyPermission(permissions, [
      'merchants:read',
      'merchants:manage',
    ]);
  const canCustomers =
    isAdmin || employeeHasAnyPermission(permissions, 'customers:manage');

  return (
    <div className="page">
      <p className="page-lead">{t('merchantsHubLead')}</p>
      <div className="form-grid">
        {canMerchants ? (
          <Link to="/accounts/merchants" className="card" style={{textDecoration: 'none'}}>
            <div className="toolbar" style={{marginBottom: 0}}>
              <Store size={22} />
              <strong>{t('navMerchantAccounts')}</strong>
            </div>
            <p className="muted" style={{margin: '8px 0 0'}}>
              {t('merchantsLead')}
            </p>
          </Link>
        ) : null}
        {canCustomers ? (
          <Link to="/accounts/customers" className="card" style={{textDecoration: 'none'}}>
            <div className="toolbar" style={{marginBottom: 0}}>
              <User size={22} />
              <strong>{t('navCustomerAccounts')}</strong>
            </div>
            <p className="muted" style={{margin: '8px 0 0'}}>
              {t('clientsLead')}
            </p>
          </Link>
        ) : null}
        {!canMerchants && !canCustomers ? (
          <div className="card muted">{t('sectionComingSoon')}</div>
        ) : null}
      </div>
    </div>
  );
}
