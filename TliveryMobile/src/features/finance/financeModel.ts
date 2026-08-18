export type FinanceTxType = 'order_delivery' | 'settlement' | 'adjustment';
export type FinanceCashAction = 'collect' | 'payout' | 'adjustment';
export type FinancePartyKind = 'driver' | 'client';

const EPS = 0.0005;

export const formatFinanceMoney = (value: number, jodLabel: string) =>
  `${value.toFixed(2)} ${jodLabel}`;

export const formatFinanceFigure = (value: number) => value.toFixed(2);

export const formatFinanceFigureOrDash = (value: number) =>
  Math.abs(value) < EPS ? '—' : formatFinanceFigure(value);

export const formatFinanceDate = (iso: string | null) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
};

export const partyInitial = (name: string) => {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : '—';
};

export const financeTxI18nKey = (type: string): string => {
  switch (type) {
    case 'order_delivery':
      return 'financeTxDelivery';
    case 'settlement':
      return 'financeTxSettlement';
    default:
      return 'financeTxAdjustment';
  }
};

/** Company-staff display: + company is owed, − company owes. */
export const companyPositionI18nKey = (displayBalance: number): string => {
  if (displayBalance > EPS) {
    return 'financeCompanyOwed';
  }
  if (displayBalance < -EPS) {
    return 'financeCompanyOwes';
  }
  return 'financeSettled';
};

/** Party own display: + they are owed, − they owe. */
export const partyPositionI18nKey = (displayBalance: number): string => {
  if (displayBalance > EPS) {
    return 'financeYouAreOwed';
  }
  if (displayBalance < -EPS) {
    return 'financeYouOwe';
  }
  return 'financeSettled';
};

/**
 * Aged AR/AP lists keep outstanding as a positive amount:
 * drivers + = collect, clients + = pay out.
 */
export const partyListPositionI18nKey = (
  kind: FinancePartyKind,
  displayBalance: number,
): string => {
  if (Math.abs(displayBalance) < EPS) {
    return 'financeSettled';
  }
  if (kind === 'driver') {
    return displayBalance > 0 ? 'financeCompanyOwed' : 'financeCompanyOwes';
  }
  return displayBalance > 0 ? 'financeCompanyOwes' : 'financeCompanyOwed';
};

/** True when the company should collect cash from this listed party. */
export const partyListIsCollectDue = (
  kind: FinancePartyKind,
  displayBalance: number,
): boolean =>
  kind === 'driver' ? displayBalance > EPS : displayBalance < -EPS;

export const suggestedCollectAmount = (displayBalance: number): number =>
  displayBalance > EPS ? displayBalance : 0;

export const suggestedPayoutAmount = (displayBalance: number): number =>
  displayBalance < -EPS ? Math.abs(displayBalance) : 0;

export const recommendedCashAction = (
  displayBalance: number,
): Exclude<FinanceCashAction, 'adjustment'> | null => {
  if (displayBalance > EPS) {
    return 'collect';
  }
  if (displayBalance < -EPS) {
    return 'payout';
  }
  return null;
};

/** Convert a cash action + absolute amount into party-ledger delta. */
export const partyDeltaForAction = (
  action: FinanceCashAction,
  amount: number,
): number => {
  const abs = Math.abs(amount);
  if (action === 'collect') {
    return abs;
  }
  if (action === 'payout') {
    return -abs;
  }
  return amount;
};

/**
 * Company view (inverted): + debit / − credit.
 * Party view: they owe = debit, they are owed = credit.
 */
export const debitCreditOf = (
  displayAmount: number,
  invertForViewer: boolean,
): {debit: number; credit: number} => {
  if (Math.abs(displayAmount) < EPS) {
    return {debit: 0, credit: 0};
  }
  const abs = Math.abs(displayAmount);
  const isDebit = invertForViewer ? displayAmount > 0 : displayAmount < 0;
  return isDebit ? {debit: abs, credit: 0} : {debit: 0, credit: abs};
};

export const settlementLabelKey = (
  displayAmount: number,
  invertForViewer: boolean,
): string => {
  const isCollect = invertForViewer ? displayAmount < 0 : displayAmount > 0;
  return isCollect ? 'financeTxCollect' : 'financeTxPayout';
};

export const financeTxLabelKey = (
  type: string,
  displayAmount: number,
  invertForViewer: boolean,
): string => {
  if (type === 'settlement') {
    return settlementLabelKey(displayAmount, invertForViewer);
  }
  return financeTxI18nKey(type);
};

export const withRunningBalances = <T extends {displayAmountJod: number}>(
  rows: T[],
  currentBalance: number,
): Array<T & {runningBalanceJod: number}> => {
  let running = currentBalance;
  return rows.map(row => {
    const next = {...row, runningBalanceJod: running};
    running -= row.displayAmountJod;
    return next;
  });
};
