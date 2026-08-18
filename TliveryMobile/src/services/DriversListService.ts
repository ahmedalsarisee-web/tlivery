import type {Driver, DriverStatus} from '@app/models/workflow.model';
import type {ListPageResult, ListQueryParams} from '@app/types/listQuery';
import {matchesSearch, paginateItems} from '@app/utils/listQuery';

/**
 * Clear listDrivers contract over an already-fetched company fleet.
 * Keeps API shape stable when moving to server-side paging later.
 */
export function listDrivers(
  source: Driver[],
  params: ListQueryParams = {},
): ListPageResult<Driver> {
  const status = params.status as DriverStatus | undefined;
  const filtered = source.filter(driver => {
    const matchesStatus = !status || driver.status === status;
    const matchesQ = matchesSearch(params.q, [
      driver.fullName,
      driver.phoneNumber,
      driver.plateNumber,
      driver.licenseNumber,
    ]);
    return matchesStatus && matchesQ;
  });
  return paginateItems(filtered, params);
}
