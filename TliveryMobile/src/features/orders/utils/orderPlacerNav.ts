import type {RootStackParamList} from '@app/types/navigation';
import type {WaselOrder} from '../types';

export function orderPlacerNavParams(
  order: WaselOrder,
): RootStackParamList['OrderPlacerDetails'] | null {
  const userId = order.createdByUserId?.trim();
  if (!userId) {
    return null;
  }
  return {
    userId,
    role: order.createdByRole ?? '',
    displayName: order.createdByName ?? undefined,
    companyId: order.companyId,
    companyName: order.companyName,
    accountId: order.clientId ?? userId,
  };
}
