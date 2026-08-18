import type {WaselOrder, OrderStatus} from '@app/features/orders/types';
import type {ListPageResult, ListQueryParams} from '@app/types/listQuery';
import {
  matchesDateRange,
  paginateItems,
} from '@app/utils/listQuery';

export {ORDER_STATUS_FILTERS} from '@app/features/orders/orderStatus';

/**
 * Client-side date window + pagination over orders already fetched from API.
 * Status and free-text search (`q`) are applied by listOrders on the server.
 */
export function listOrders(
  source: WaselOrder[],
  params: ListQueryParams = {},
): ListPageResult<WaselOrder> {
  const filtered = source.filter(order =>
    matchesDateRange(order.createdAt, params.from, params.to),
  );

  return paginateItems(filtered, params);
}

export type {OrderStatus};
