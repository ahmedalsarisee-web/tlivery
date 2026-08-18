import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useOrder} from '../hooks/useOrders';
import {
  orderSourceBadgeClass,
  orderSourceI18nKey,
  resolveOrderSource,
} from '../utils/orderSource';

function formatOrderDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ShipmentDetailsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {orderId = ''} = useParams<{orderId: string}>();
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <div className="page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="page">
        <div className="toolbar">
          <Link to="/orders" className="btn btn-secondary">
            {t('goBack')}
          </Link>
        </div>
        <div className="card">{t('orderNotFound')}</div>
      </div>
    );
  }

  const source = resolveOrderSource(order.createdByRole);
  const lastUpdate = order.timeline[order.timeline.length - 1]?.at ?? null;
  const senderName =
    order.createdByName?.trim() ||
    (source === 'company' ? order.companyName?.trim() : '') ||
    t('orderPartyPlacer');

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/orders" className="btn btn-secondary">
          {t('goBack')}
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/orders/${order.id}`)}>
          {t('trackOrder')}
        </button>
      </div>

      <div className="card">
        <h2 style={{marginTop: 0}}>{order.reference}</h2>
        <p className="muted">{formatOrderDate(order.createdAt)}</p>
      </div>

      <div className="card company-form">
        <strong>{t('shipmentDetails')}</strong>
        <div className="field">
          <label>{t('colSource')}</label>
          <p style={{margin: 0}}>
            <span className={orderSourceBadgeClass(source)}>
              {t(orderSourceI18nKey(source))}
            </span>
          </p>
        </div>
        <div className="field">
          <label>{t('orderPartyPlacer')}</label>
          <p style={{margin: 0}}>{senderName}</p>
        </div>
        <div className="field">
          <label>{t('orderPartyRecipient')}</label>
          <p style={{margin: 0}}>{order.customerName}</p>
        </div>
        <div className="field">
          <label>{t('customerPhone')}</label>
          <p style={{margin: 0}}>{order.customerPhone}</p>
        </div>
        {order.notes?.trim() ? (
          <div className="field">
            <label>{t('shipmentNotes')}</label>
            <p style={{margin: 0, whiteSpace: 'pre-wrap'}}>{order.notes.trim()}</p>
          </div>
        ) : null}
        <div className="field">
          <label>{t('pickupAddress')}</label>
          <p style={{margin: 0}}>{order.pickupAddress}</p>
        </div>
        <div className="field">
          <label>{t('dropoffAddress')}</label>
          <p style={{margin: 0}}>{order.dropoffAddress}</p>
        </div>
        {order.companyName ? (
          <div className="field">
            <label>{t('colCompany')}</label>
            <p style={{margin: 0}}>{order.companyName}</p>
          </div>
        ) : null}
        <div className="field">
          <label>{t('colDriver')}</label>
          <p style={{margin: 0}}>{order.driverName ?? '—'}</p>
        </div>
        <div className="field">
          <label>{t('colAmount')}</label>
          <p style={{margin: 0}}>
            {order.amountJod.toFixed(2)} {t('jod')}
            {order.isCod ? ` · ${t('cod')}` : ''}
          </p>
        </div>
        <div className="field">
          <label>{t('lastUpdate')}</label>
          <p style={{margin: 0}}>
            {lastUpdate ? formatOrderDate(lastUpdate) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
