import {useTranslation} from 'react-i18next';
import {useCompanies, useCompanyApplications} from '../hooks/useWorkflow';

export function DashboardPage() {
  const {t} = useTranslation();
  const applications = useCompanyApplications();
  const companies = useCompanies();
  const pendingCompanies = (applications.data ?? []).filter(c => c.status === 'pending').length;
  const approvedCompanies = (companies.data ?? []).filter(c => c.status === 'active' || c.status === 'approved').length;
  const isLoading = applications.isLoading || companies.isLoading;
  const isError = applications.isError || companies.isError;

  return (
    <div className="page">
      <div>
        <p className="page-lead">{t('dashboardLead')}</p>
      </div>
      {isLoading ? <div className="card">{t('loading')}</div> : null}
      {isError ? <div className="card login-error">{t('workflowLoadError')}</div> : null}

      <div className="grid-kpi">
        <div className="card">
          <p className="kpi-label">{t('kpiPendingCompanies')}</p>
          <p className="kpi-value">{pendingCompanies}</p>
          <p className="kpi-meta">{t('kpiPendingCompaniesMeta')}</p>
        </div>
        <div className="card">
          <p className="kpi-label">{t('kpiPendingDrivers')}</p>
          <p className="kpi-value">—</p>
          <p className="kpi-meta">{t('kpiPendingDriversMeta')}</p>
        </div>
        <div className="card">
          <p className="kpi-label">{t('kpiActiveCarriers')}</p>
          <p className="kpi-value">{approvedCompanies}</p>
          <p className="kpi-meta">{t('kpiActiveCarriersMeta')}</p>
        </div>
        <div className="card">
          <p className="kpi-label">{t('kpiOpenOrders')}</p>
          <p className="kpi-value">—</p>
          <p className="kpi-meta">{t('kpiOpenOrdersMeta')}</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{margin: '0 0 8px', fontSize: '1.05rem'}}>
          {t('opsSnapshotTitle')}
        </h2>
        <p className="muted" style={{margin: 0}}>
          {t('opsSnapshotBody')}
        </p>
      </div>
    </div>
  );
}
