import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {useFinanceHub} from '../hooks/useFinance';
import {formatFinanceMoney} from '../utils/financeModel';
import {FinanceLedgerPage} from './FinanceLedgerPage';

export function AccountsHubPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const role = user?.role;
  const isParty =
    role === 'driver' || role === 'client' || role === 'merchant';
  const hubQuery = useFinanceHub(!isParty);
  const jod = t('jod');

  if (isParty) {
    return <FinanceLedgerPage />;
  }

  if (hubQuery.isLoading) {
    return (
      <div className="page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (hubQuery.isError) {
    return (
      <div className="page">
        <div className="card">{t('sectionComingSoon')}</div>
      </div>
    );
  }

  const driversTotal = hubQuery.data?.drivers.totalJod ?? 0;
  const clientsTotal = hubQuery.data?.clients.totalJod ?? 0;
  const net = driversTotal - clientsTotal;

  return (
    <div className="page finance-desk">
      <p className="page-lead">{t('financeHubSubtitle')}</p>

      <section className="finance-tb">
        <div className="finance-tb-col is-ar">
          <span>{t('financeArShort')}</span>
          <strong>{formatFinanceMoney(driversTotal, jod)}</strong>
        </div>
        <div className="finance-tb-col is-ap">
          <span>{t('financeApShort')}</span>
          <strong>{formatFinanceMoney(clientsTotal, jod)}</strong>
        </div>
        <div className={`finance-tb-col ${net >= 0 ? 'is-ar' : 'is-neg'}`}>
          <span>{t('financeKpiNet')}</span>
          <strong>{formatFinanceMoney(net, jod)}</strong>
        </div>
      </section>

      <div className="finance-legend">
        <span>
          <i className="finance-swatch is-ar" />
          {t('financeLegendDebit')}
        </span>
        <span>
          <i className="finance-swatch is-ap" />
          {t('financeLegendCredit')}
        </span>
      </div>

      <p className="muted">{t('financeBooksHint')}</p>

      <div className="finance-folios">
        <Link to="/accounts/drivers" className="finance-folio is-ar">
          <div className="finance-folio-body">
            <div className="finance-folio-top">
              <div>
                <strong>{t('financeDriversCard')}</strong>
                <p>
                  {t('financePartiesCount', {
                    count: hubQuery.data?.drivers.count ?? 0,
                  })}
                </p>
              </div>
            </div>
            <div className="finance-folio-amount">
              {formatFinanceMoney(driversTotal, jod)}
            </div>
            <p className="muted">{t('financeDriversTotalHint')}</p>
          </div>
        </Link>
        <Link to="/accounts/clients" className="finance-folio is-ap">
          <div className="finance-folio-body">
            <div className="finance-folio-top">
              <div>
                <strong>{t('financeClientsCard')}</strong>
                <p>
                  {t('financePartiesCount', {
                    count: hubQuery.data?.clients.count ?? 0,
                  })}
                </p>
              </div>
            </div>
            <div className="finance-folio-amount">
              {formatFinanceMoney(clientsTotal, jod)}
            </div>
            <p className="muted">{t('financeClientsTotalHint')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
