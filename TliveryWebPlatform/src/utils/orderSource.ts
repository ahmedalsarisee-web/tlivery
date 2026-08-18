import type {TFunction} from 'i18next';
import type {OrderDto} from '../models/workflow';

export type OrderSource = 'account' | 'company';

/** Issued client/merchant vs company staff. */
export function resolveOrderSource(
  createdByRole?: string | null,
): OrderSource {
  if (createdByRole === 'client' || createdByRole === 'merchant') {
    return 'account';
  }
  return 'company';
}

export function orderSourceI18nKey(source: OrderSource): string {
  return source === 'account' ? 'orderSourceAccount' : 'orderSourceCompany';
}

export function orderSourceBadgeClass(source: OrderSource): string {
  return source === 'account'
    ? 'badge badge-source-account'
    : 'badge badge-source-company';
}

export function placerRoleLabel(
  createdByRole: string | null | undefined,
  t: TFunction,
): string {
  const source = resolveOrderSource(createdByRole);
  if (source === 'company') {
    return t('orderSourceCompany');
  }
  if (createdByRole === 'merchant') {
    return t('orderSourceMerchant');
  }
  return t('orderSourceClient');
}

/** Display value for مؤكد الطلب — company shows recipient client name only. */
export function formatOrderPlacerLine(
  order: Pick<
    OrderDto,
    'createdByRole' | 'createdByName' | 'customerName' | 'companyName'
  >,
  t: TFunction,
): string {
  const source = resolveOrderSource(order.createdByRole);
  if (source === 'company') {
    return order.customerName?.trim() || t('orderSourceCompany');
  }
  const role = placerRoleLabel(order.createdByRole, t);
  const name = order.createdByName?.trim() || '';
  return name ? `${role} ${name}` : role;
}

export function canOpenOrderPlacer(
  order: Pick<OrderDto, 'createdByRole' | 'createdByUserId'>,
): boolean {
  return (
    resolveOrderSource(order.createdByRole) === 'account' &&
    Boolean(order.createdByUserId?.trim())
  );
}

export function orderPlacerDetailsPath(
  order: Pick<
    OrderDto,
    | 'createdByUserId'
    | 'createdByRole'
    | 'createdByName'
    | 'clientId'
    | 'companyId'
    | 'companyName'
  >,
): string {
  const userId = order.createdByUserId.trim();
  const params = new URLSearchParams();
  params.set('role', order.createdByRole || '');
  if (order.createdByName?.trim()) {
    params.set('displayName', order.createdByName.trim());
  }
  if (order.companyId) {
    params.set('companyId', order.companyId);
  }
  if (order.companyName?.trim()) {
    params.set('companyName', order.companyName.trim());
  }
  const accountId = (order.clientId || order.createdByUserId || '').trim();
  if (accountId) {
    params.set('accountId', accountId);
  }
  return `/orders/placer/${encodeURIComponent(userId)}?${params.toString()}`;
}
