import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {ApplicationStatus} from '../models/workflow';
import {
  useCompanyApplications,
  useReviewCompanyApplication,
} from '../hooks/useWorkflow';

function StatusBadge({status}: {status: ApplicationStatus}) {
  const {t} = useTranslation();
  const label = t(
    status === 'approved'
      ? 'statusApproved'
      : status === 'rejected'
        ? 'statusRejected'
        : 'statusPending',
  );
  return <span className={`badge badge-${status}`}>{label}</span>;
}

export function CompaniesPage() {
  const {t} = useTranslation();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('pending');
  const applications = useCompanyApplications();
  const review = useReviewCompanyApplication();

  const visible = useMemo(
    () =>
      filter === 'all'
        ? applications.data ?? []
        : (applications.data ?? []).filter(row => row.status === filter),
    [applications.data, filter],
  );

  return (
    <div className="page">
      <div className="toolbar">
        <p className="page-lead" style={{margin: 0}}>
          {t('companiesLead')}
        </p>
        <select
          value={filter}
          onChange={e =>
            setFilter(e.target.value as 'all' | ApplicationStatus)
          }
          aria-label={t('colStatus')}>
            <option value="all">{t('filterAll')}</option>
            <option value="pending">{t('filterPending')}</option>
            <option value="approved">{t('filterApproved')}</option>
            <option value="rejected">{t('filterRejected')}</option>
          </select>
      </div>

      {applications.isLoading ? <div className="card">{t('loading')}</div> : null}
      {applications.isError ? (
        <div className="card login-error">{t('workflowLoadError')}</div>
      ) : null}
      {!applications.isLoading && !applications.isError ? (
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('colCompany')}</th>
              <th>{t('colLocation')}</th>
              <th>{t('colContact')}</th>
              <th>{t('colStatus')}</th>
              <th>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(row => (
              <tr key={row.id}>
                <td>
                  <div>{row.companyName}</div>
                  <div className="muted">
                    {row.companyCode || '—'} · {row.commercialRegister}
                  </div>
                </td>
                <td>
                  <div>{row.city}</div>
                  <div className="muted">{row.address}</div>
                </td>
                <td>
                  <div>{row.contactName}</div>
                  <div className="muted">
                    {row.phone}
                    <br />
                    {row.email}
                  </div>
                </td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>
                  <div className="row-actions">
                    {row.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={review.isPending}
                        onClick={() =>
                          review.mutate({id: row.id, decision: 'approved'})
                        }>
                        {t('approve')}
                      </button>
                    ) : null}
                    {row.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={review.isPending}
                        onClick={() =>
                          review.mutate({id: row.id, decision: 'rejected'})
                        }>
                        {t('reject')}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty">{t('emptyCompanies')}</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      ) : null}
      {review.isError ? <p className="login-error">{t('workflowActionError')}</p> : null}
    </div>
  );
}
