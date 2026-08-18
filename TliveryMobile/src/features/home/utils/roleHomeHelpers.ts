import {toLocalIsoDate} from '@app/utils/calendarDateUtils';
import {
  ACCOUNT_ACTIVE_ORDER_STATUSES,
  ACCOUNT_PENDING_ORDER_STATUSES,
  COMPANY_ACTIVE_ORDER_STATUSES,
  COMPANY_PENDING_ORDER_STATUSES,
  DONE_ORDER_STATUSES,
} from '@app/features/orders/orderStatus';

export {
  ACCOUNT_ACTIVE_ORDER_STATUSES,
  ACCOUNT_PENDING_ORDER_STATUSES,
  COMPANY_ACTIVE_ORDER_STATUSES,
  COMPANY_PENDING_ORDER_STATUSES,
  DONE_ORDER_STATUSES,
};

/** @deprecated Prefer ACCOUNT_* / COMPANY_* sets aligned with list filters. */
export const ACTIVE_ORDER_STATUSES = COMPANY_ACTIVE_ORDER_STATUSES;
/** @deprecated Prefer ACCOUNT_* / COMPANY_* sets aligned with list filters. */
export const PENDING_ORDER_STATUSES = COMPANY_PENDING_ORDER_STATUSES;

export const formatJod = (value: number): string =>
  `${value.toFixed(2)} JOD`;

export const greetingKeyForHour = (hour: number): string => {
  if (hour < 12) {
    return 'driverHomeGoodMorning';
  }
  if (hour < 17) {
    return 'driverHomeGoodAfternoon';
  }
  return 'driverHomeGoodEvening';
};

export const firstNameOf = (full?: string | null): string => {
  const trimmed = full?.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

export const isSameLocalDay = (
  iso: string | null | undefined,
  dayIso: string,
): boolean => {
  if (!iso) {
    return false;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return false;
  }
  return toLocalIsoDate(d) === dayIso;
};

export const sparkHeightsFromValues = (values: number[]): number[] => {
  if (values.length === 0) {
    return [18, 28, 22, 36, 30, 42, 26, 34];
  }
  const max = Math.max(...values, 1);
  return values.map(v => Math.max(8, Math.round((v / max) * 40)));
};
