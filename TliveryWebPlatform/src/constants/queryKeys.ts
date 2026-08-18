export const queryKeys = {
  companyApplications: ['companyApplications'] as const,
  companies: ['companies'] as const,
  drivers: (companyId: string, q = '', status = 'all') =>
    ['drivers', companyId, q, status] as const,
  driverDetail: (driverId: string) => ['drivers', 'detail', driverId] as const,
  driverInvites: (companyId: string) => ['driverInvites', companyId] as const,
  clientInvites: (companyId: string) => ['clientInvites', companyId] as const,
  driverApplications: (companyId: string) =>
    ['driverApplications', companyId] as const,
  myCompanyApplication: (uid: string) =>
    ['companyApplications', 'mine', uid] as const,
  employees: (companyId: string) => ['employees', companyId] as const,
  merchants: (companyId: string) => ['merchants', companyId] as const,
  clients: (companyId: string) => ['clients', companyId] as const,
  orders: {
    lists: ['orders', 'list'] as const,
    list: (status = 'all', q = '') =>
      ['orders', 'list', status, q] as const,
    byAccount: (accountId: string) =>
      ['orders', 'byAccount', accountId] as const,
    detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  },
  finance: {
    hub: ['finance', 'hub'] as const,
    parties: (kind: 'driver' | 'client') =>
      ['finance', 'parties', kind] as const,
    ledger: (partyType: string, partyUserId: string) =>
      ['finance', 'ledger', partyType, partyUserId] as const,
    myLedger: ['finance', 'ledger', 'me'] as const,
  },
};
