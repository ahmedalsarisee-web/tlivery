import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useCompanyClients, useCompanyMerchants} from '../hooks/useWorkflow';
import {useAccountOrders} from '../hooks/useOrders';
import {useAuth} from '../auth/AuthContext';

export function IssuedAccountDetailsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {kind = 'client', accountId = ''} = useParams<{
    kind: 'client' | 'merchant';
    accountId: string;
  }>();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';

  const clientsQuery = useCompanyClients(
    companyId,
    {page: 1, pageSize: 100},
    kind === 'client',
  );
  const merchantsQuery = useCompanyMerchants(
    companyId,
    {page: 1, pageSize: 100},
    kind === 'merchant',
  );
  const ordersQuery = useAccountOrders(accountId);

  const account =
    (kind === 'merchant'
      ? merchantsQuery.data?.items
      : clientsQuery.data?.items
    )?.find(item => item.id === accountId) ?? null;

  const orders = ordersQuery.data ?? [];
  const title =
    kind === 'merchant' ? t('merchantDetails') : t('clientDetails');
  const typeLabel =
    kind === 'merchant'
      ? t('accountTypeMerchant')
      : t('accountTypeCustomer');
  const displayName =
    account?.displayName || account?.username || '—';

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/merchants" className="btn btn-secondary">
          {t('goBack')}
        </Link>
      </div>

      <div className="card company-form">
        <strong>{title}</strong>
        <p style={{margin: '8px 0 0'}}>
          {displayName}
          <span className="muted"> · @{account?.username ?? '—'} · {typeLabel}</span>
        </p>
        {account ? (
          <p className="muted" style={{margin: '4px 0 0'}}>
            {account.status}
            {account.email ? ` · ${account.email}` : ''}
          </p>
        ) : null}
      </div>

      <p className="page-lead" style={{marginTop: 20}}>
        {t('accountOrderHistory')} —{' '}
        {t('accountOrderHistoryHint', {count: orders.length})}
      </p>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('colOrder')}</th>
              <th>{t('colCustomer')}</th>
              <th>{t('colStatus')}</th>
              <th>{t('colDriver')}</th>
              <th>{t('colAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty">{t('loading')}</div>
                </td>
              </tr>
            ) : null}
            {!ordersQuery.isLoading &&
              orders.map(order => (
                <tr
                  key={order.id}
                  style={{cursor: 'pointer'}}
                  onClick={() => navigate(`/orders/${order.id}`)}>
                  <td>
                    <Link to={`/orders/${order.id}`}>{order.reference}</Link>
                  </td>
                  <td>{order.customerName}</td>
                  <td>
                    <span className="badge badge-active">
                      {t(`orderStatus_${order.status}`, {
                        defaultValue: order.status,
                      })}
                    </span>
                  </td>
                  <td>{order.driverName ?? '—'}</td>
                  <td>
                    {order.amountJod.toFixed(2)} {t('jod')}
                  </td>
                </tr>
              ))}
            {!ordersQuery.isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty">{t('emptyAccountOrdersDesc')}</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
