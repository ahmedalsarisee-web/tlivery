import {Link, useParams, useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {useAccountOrders} from '../hooks/useOrders';
import {isCompanyStaffRole} from '../utils/orderFilters';
import {
  canOpenOrderPlacer,
  formatOrderPlacerLine,
  orderPlacerDetailsPath,
  orderSourceBadgeClass,
  orderSourceI18nKey,
  placerRoleLabel,
  resolveOrderSource,
} from '../utils/orderSource';

export function OrderPlacerDetailsPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {userId = ''} = useParams<{userId: string}>();
  const [search] = useSearchParams();

  const role = search.get('role') ?? '';
  const displayNameParam = search.get('displayName')?.trim() || '';
  const companyName = search.get('companyName')?.trim() || '';
  const accountId = (search.get('accountId') || userId).trim();

  const isStaff = isCompanyStaffRole(user?.role);
  const source = resolveOrderSource(role);
  const isIssuedAccount = role === 'client' || role === 'merchant';
  const roleLabel = placerRoleLabel(role, t);
  const displayName =
    displayNameParam ||
    (source === 'company' ? companyName : '') ||
    roleLabel;

  const ordersQuery = useAccountOrders(
    isStaff && isIssuedAccount && accountId ? accountId : '',
  );
  const orders = accountId && isStaff && isIssuedAccount ? ordersQuery.data ?? [] : [];

  const canManage = isStaff && Boolean(userId) && isIssuedAccount;
  const manageTo =
    role === 'merchant'
      ? `/merchants/merchant/${encodeURIComponent(accountId)}`
      : `/merchants/client/${encodeURIComponent(accountId)}`;

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/orders" className="btn btn-secondary">
          {t('goBack')}
        </Link>
        {canManage ? (
          <Link to={manageTo} className="btn btn-primary">
            {t('orderPlacerManage')}
          </Link>
        ) : null}
      </div>

      <div className="card company-form">
        <strong>{t('senderDetailsTitle')}</strong>
        <p style={{margin: '8px 0 0'}}>
          {displayName}
          <span className="muted"> · {roleLabel}</span>
        </p>
        <p style={{margin: '8px 0 0'}}>
          <span className={orderSourceBadgeClass(source)}>
            {t(orderSourceI18nKey(source))}
          </span>
        </p>
        {companyName && source === 'account' ? (
          <p className="muted" style={{margin: '8px 0 0'}}>
            {companyName}
          </p>
        ) : null}
      </div>

      {isStaff && isIssuedAccount ? (
        <>
          <p className="page-lead" style={{marginTop: 20}}>
            {t('accountOrderHistory')} —{' '}
            {t('accountOrderHistoryHint', {count: orders.length})}
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('colOrder')}</th>
                  <th>{t('orderPartyPlacer')}</th>
                  <th>{t('orderPartyRecipient')}</th>
                  <th>{t('colStatus')}</th>
                  <th>{t('colDriver')}</th>
                  <th>{t('colAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {ordersQuery.isLoading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">{t('loading')}</div>
                    </td>
                  </tr>
                ) : null}
                {!ordersQuery.isLoading &&
                  orders.map(order => {
                    const openPlacer = canOpenOrderPlacer(order);
                    return (
                      <tr key={order.id}>
                        <td>
                          <Link to={`/orders/${order.id}`}>
                            {order.reference}
                          </Link>
                        </td>
                        <td>
                          {openPlacer ? (
                            <Link
                              className="order-placer-link"
                              to={orderPlacerDetailsPath(order)}>
                              {formatOrderPlacerLine(order, t)}
                              <span className="order-placer-chevron" aria-hidden>
                                ›
                              </span>
                            </Link>
                          ) : (
                            formatOrderPlacerLine(order, t)
                          )}
                        </td>
                        <td>{order.customerName}</td>
                        <td>
                          {t(`orderStatus_${order.status}`, {
                            defaultValue: order.status,
                          })}
                        </td>
                        <td>{order.driverName ?? '—'}</td>
                        <td>
                          {order.amountJod.toFixed(1)} {t('jod')}
                        </td>
                      </tr>
                    );
                  })}
                {!ordersQuery.isLoading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">{t('emptyAccountOrdersTitle')}</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
