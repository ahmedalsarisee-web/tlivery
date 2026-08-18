import {useState, type FormEvent} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {Modal} from '../components/Modal';
import {useAddFinanceEntry, useFinanceLedger} from '../hooks/useFinance';
import {employeeHasAnyPermission} from '../utils/shareCredentials';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {
  companyPositionI18nKey,
  debitCreditOf,
  financeTxLabelKey,
  formatFinanceDate,
  formatFinanceFigure,
  formatFinanceFigureOrDash,
  formatFinanceMoney,
  partyDeltaForAction,
  partyPositionI18nKey,
  recommendedCashAction,
  suggestedCollectAmount,
  suggestedPayoutAmount,
  withRunningBalances,
  type FinanceCashAction,
} from '../utils/financeModel';

type FinanceLedgerPageProps = {
  ownAccount?: boolean;
};

export function FinanceLedgerPage({ownAccount}: FinanceLedgerPageProps = {}) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const params = useParams<{kind?: string; partyUserId?: string}>();
  const role = user?.role;
  const isCompanyStaff =
    role === 'company_admin' || role === 'company_employee';
  const partyBlocked =
    Boolean(params.partyUserId) &&
    (role === 'driver' || role === 'client' || role === 'merchant');
  const isOwn =
    ownAccount ||
    role === 'driver' ||
    role === 'client' ||
    role === 'merchant' ||
    !params.partyUserId ||
    partyBlocked;

  const partyType: 'driver' | 'client' | undefined = isOwn
    ? undefined
    : params.kind === 'clients' || params.kind === 'client'
      ? 'client'
      : 'driver';
  const partyUserId = isOwn ? undefined : params.partyUserId;
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const jod = t('jod');

  const ledgerQuery = useFinanceLedger(
    partyUserId && partyType
      ? {partyUserId, partyType, pageSize: 25, page}
      : {pageSize: 25, page},
    !partyBlocked,
  );

  const permissions =
    (user?.profile as {permissions?: string[]} | null)?.permissions ?? [];
  const canWrite =
    role === 'company_admin' ||
    employeeHasAnyPermission(permissions, 'accounts:write');

  const addEntry = useAddFinanceEntry();
  const [action, setAction] = useState<FinanceCashAction | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');

  if (partyBlocked) {
    return <Navigate to="/accounts" replace />;
  }

  const account = ledgerQuery.data?.account;
  const invert = ledgerQuery.data?.invertForViewer ?? false;
  const balance = account?.displayBalanceJod ?? 0;
  const listPath =
    partyType === 'client' ? '/accounts/clients' : '/accounts/drivers';
  const positionKey = invert
    ? companyPositionI18nKey(balance)
    : partyPositionI18nKey(balance);
  const filtered = (ledgerQuery.data?.transactions ?? []).filter(tx =>
    typeFilter === 'all' ? true : tx.type === typeFilter,
  );
  const showRunning = typeFilter === 'all' && page === 1;
  const rows = showRunning
    ? withRunningBalances(filtered, balance)
    : filtered.map(tx => ({...tx, runningBalanceJod: 0}));
  const recommended = invert ? recommendedCashAction(balance) : null;
  const settled = Math.abs(balance) < 0.0005;
  const collectTone = invert ? balance > 0 : balance < 0;
  const toneClass = settled ? 'is-settled' : collectTone ? 'is-ar' : 'is-ap';

  const openAction = (next: FinanceCashAction) => {
    const suggested =
      next === 'collect'
        ? suggestedCollectAmount(balance)
        : next === 'payout'
          ? suggestedPayoutAmount(balance)
          : 0;
    setAmountText(suggested > 0 ? suggested.toFixed(2) : '');
    setNote('');
    setAction(next);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!partyUserId || !partyType || !action) {
      return;
    }
    const entered = Number(amountText.replace(',', '.'));
    if (!Number.isFinite(entered) || entered === 0) {
      showToast(ToastType.error, t('financeAmountRequired'));
      return;
    }
    if (action !== 'adjustment' && entered < 0) {
      showToast(ToastType.error, t('financeAmountRequired'));
      return;
    }
    const amountJod =
      action === 'adjustment'
        ? entered
        : partyDeltaForAction(action, entered);
    addEntry.mutate(
      {
        partyUserId,
        partyType,
        amountJod,
        note: note.trim() || undefined,
        type: action === 'adjustment' ? 'adjustment' : 'settlement',
      },
      {
        onSuccess: () => {
          setAction(null);
          setAmountText('');
          setNote('');
          setPage(1);
          void ledgerQuery.refetch();
          const toastKey =
            action === 'collect'
              ? 'financeCollectedToast'
              : action === 'payout'
                ? 'financePaidToast'
                : 'financeEntryAddedToast';
          showToast(ToastType.success, t(toastKey));
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  const modalTitle =
    action === 'collect'
      ? t('financeCollectTitle')
      : action === 'payout'
        ? t('financePayoutTitle')
        : t('financeAdjustTitle');
  const modalHint =
    action === 'collect'
      ? t('financeCollectHint')
      : action === 'payout'
        ? t('financePayoutHint')
        : t('financeAdjustHint');

  return (
    <div className="page finance-desk">
      {!isOwn ? (
        <div className="toolbar">
          <Link to={listPath} className="btn btn-secondary">
            {t('goBack')}
          </Link>
          <h2 style={{margin: 0}}>
            {account?.partyName || t('financeLedgerTitle')}
          </h2>
        </div>
      ) : (
        <div className="toolbar">
          <h2 style={{margin: 0}}>{t('navAccounts')}</h2>
        </div>
      )}

      <section className={`finance-statement ${toneClass}`}>
        <span className="finance-kicker">
          {invert
            ? t('financeCompanyBalanceLabel')
            : t('financeYourBalanceLabel')}
        </span>
        <strong className="finance-statement-value">
          {formatFinanceMoney(Math.abs(balance), jod)}
        </strong>
        <span className="finance-pill">{t(positionKey)}</span>
      </section>

      {canWrite && isCompanyStaff && partyUserId ? (
        <>
          <div className={`finance-recommend ${toneClass}`}>
            {recommended === 'collect'
              ? t('financeRecommendCollect', {
                  amount: formatFinanceMoney(
                    suggestedCollectAmount(balance),
                    jod,
                  ),
                })
              : recommended === 'payout'
                ? t('financeRecommendPayout', {
                    amount: formatFinanceMoney(
                      suggestedPayoutAmount(balance),
                      jod,
                    ),
                  })
                : t('financeSettledBanner')}
          </div>
          <div className="toolbar finance-voucher-bar">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openAction('collect')}>
              {t('financeCollect')}
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openAction('payout')}>
              {t('financePayout')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => openAction('adjustment')}>
              {t('financeAdjust')}
            </button>
          </div>
        </>
      ) : null}

      <div className="finance-filters">
        {(
          [
            ['all', 'financeFilterAll'],
            ['order_delivery', 'financeTxDelivery'],
            ['settlement', 'financeTxSettlement'],
            ['adjustment', 'financeTxAdjustment'],
          ] as const
        ).map(([value, key]) => (
          <button
            key={value}
            type="button"
            className={`chip ${typeFilter === value ? 'is-active' : ''}`}
            onClick={() => setTypeFilter(value)}>
            {t(key)}
          </button>
        ))}
      </div>

      {ledgerQuery.isLoading ? (
        <div className="card">{t('loading')}</div>
      ) : rows.length === 0 ? (
        <div className="finance-journal muted">{t('financeNoTransactions')}</div>
      ) : (
        <div className="finance-journal">
          <table>
            <thead>
              <tr>
                <th>{t('financeColMemo')}</th>
                <th className="is-ar">{t('financeColDebit')}</th>
                <th className="is-ap">{t('financeColCredit')}</th>
                {showRunning ? <th>{t('financeColBalance')}</th> : null}
                <th>{t('financeColDate')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(tx => {
                const {debit, credit} = debitCreditOf(
                  tx.displayAmountJod,
                  invert,
                );
                return (
                  <tr key={tx.id}>
                    <td>
                      <div className="finance-memo">
                        {tx.note ||
                          t(
                            financeTxLabelKey(
                              tx.type,
                              tx.displayAmountJod,
                              invert,
                            ),
                          )}
                      </div>
                      <div className="muted">
                        {t(
                          financeTxLabelKey(
                            tx.type,
                            tx.displayAmountJod,
                            invert,
                          ),
                        )}
                        {tx.orderReference ? ` · ${tx.orderReference}` : ''}
                      </div>
                    </td>
                    <td className="finance-num is-ar">
                      {formatFinanceFigureOrDash(debit)}
                    </td>
                    <td className="finance-num is-ap">
                      {formatFinanceFigureOrDash(credit)}
                    </td>
                    {showRunning ? (
                      <td className="finance-num finance-num-balance">
                        {formatFinanceFigure(tx.runningBalanceJod)}
                      </td>
                    ) : null}
                    <td className="finance-date">
                      {formatFinanceDate(tx.createdAt)}
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
              disabled={!ledgerQuery.data?.hasMore}
              onClick={() => setPage(prev => prev + 1)}>
              {t('nextPage')}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={action != null}
        title={modalTitle}
        onClose={() => setAction(null)}>
        <p className="muted">{modalHint}</p>
        <form className="company-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="finance-amount">{t('financeAmountPlaceholder')}</label>
            <input
              id="finance-amount"
              type="number"
              step="0.001"
              min={action === 'adjustment' ? undefined : 0}
              value={amountText}
              onChange={e => setAmountText(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="finance-note">{t('financeNotePlaceholder')}</label>
            <input
              id="finance-note"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={addEntry.isPending}
              onClick={() => setAction(null)}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addEntry.isPending}>
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
