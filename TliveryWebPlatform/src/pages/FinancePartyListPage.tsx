import {Link, Navigate, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {useFinanceParties} from '../hooks/useFinance';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {
  formatFinanceMoney,
  partyInitial,
  partyListIsCollectDue,
  partyListPositionI18nKey,
} from '../utils/financeModel';

export function FinancePartyListPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {kind = 'drivers'} = useParams<{kind: string}>();
  const role = user?.role;
  const isParty =
    role === 'driver' || role === 'client' || role === 'merchant';
  const validKind = kind === 'drivers' || kind === 'clients';
  const partyKind = kind === 'clients' ? 'client' : 'driver';
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQ = useDebouncedValue(query, 300);
  const partiesQuery = useFinanceParties(
    {kind: partyKind, q: debouncedQ, page, pageSize: 20},
    validKind && !isParty,
  );
  const jod = t('jod');

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, partyKind]);

  if (isParty) {
    return <Navigate to="/accounts" replace />;
  }

  if (!validKind) {
    return <Navigate to="/accounts" replace />;
  }

  const title =
    partyKind === 'driver' ? t('financeDriversCard') : t('financeClientsCard');

  return (
    <div className="page finance-desk">
      <div className="toolbar">
        <Link to="/accounts" className="btn btn-secondary">
          {t('goBack')}
        </Link>
        <h2 style={{margin: 0}}>{title}</h2>
      </div>

      <p className="muted" style={{marginTop: 0}}>
        {partyKind === 'driver'
          ? t('financeListDriversHint')
          : t('financeListClientsHint')}
      </p>

      <div className="toolbar-filters" style={{marginBottom: 16}}>
        <label className="sr-only" htmlFor="finance-party-search">
          {t('financeSearchParties')}
        </label>
        <input
          id="finance-party-search"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('financeSearchParties')}
        />
      </div>

      {partiesQuery.isLoading ? (
        <div className="card">{t('loading')}</div>
      ) : partiesQuery.isError ? (
        <div className="finance-journal muted">{t('financeNoParties')}</div>
      ) : (partiesQuery.data?.parties.length ?? 0) === 0 ? (
        <div className="finance-journal muted">{t('financeNoParties')}</div>
      ) : (
        <div className="finance-journal">
          <table>
            <thead>
              <tr>
                <th>{t('employeeFullName')}</th>
                <th>{t('financeCompanyBalanceLabel')}</th>
                <th>{t('colAmount')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {partiesQuery.data?.parties.map(party => {
                const balance = party.displayBalanceJod;
                const settled = Math.abs(balance) < 0.0005;
                const collectDue = partyListIsCollectDue(partyKind, balance);
                const tone = settled
                  ? 'is-settled'
                  : collectDue
                    ? 'is-ar'
                    : 'is-ap';
                return (
                  <tr key={party.id} className={`finance-party-row ${tone}`}>
                    <td>
                      <div className="finance-party-name">
                        <span className={`finance-avatar ${tone}`}>
                          {partyInitial(party.partyName || party.partyUserId)}
                        </span>
                        {party.partyName || party.partyUserId}
                      </div>
                    </td>
                    <td>
                      <span className={`finance-pill ${tone}`}>
                        {t(partyListPositionI18nKey(partyKind, balance))}
                      </span>
                    </td>
                    <td className={`finance-num ${tone}`}>
                      {formatFinanceMoney(Math.abs(balance), jod)}
                    </td>
                    <td>
                      <Link
                        to={`/accounts/${partyKind === 'driver' ? 'drivers' : 'clients'}/${party.partyUserId}`}
                        className="btn btn-secondary">
                        {t('financeOpenStatement')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="finance-pager">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}>
              {t('previousPage')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!partiesQuery.data?.hasMore}
              onClick={() => setPage(prev => prev + 1)}>
              {t('nextPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
