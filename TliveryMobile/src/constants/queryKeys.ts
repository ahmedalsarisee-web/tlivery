export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  users: {
    profile: (userId: string) => ['users', 'profile', userId] as const,
  },
  companyApplications: {
    byUser: (userId: string) =>
      ['companyApplications', 'byUser', userId] as const,
  },
  companies: {
    detail: (companyId: string) => ['companies', 'detail', companyId] as const,
  },
  driverApplications: {
    byUser: (userId: string) =>
      ['driverApplications', 'byUser', userId] as const,
    pendingByCompany: (companyId: string) =>
      ['driverApplications', 'pendingByCompany', companyId] as const,
  },
  drivers: {
    byCompany: (companyId: string, q = '', status = 'all') =>
      ['drivers', 'byCompany', companyId, q, status] as const,
    detail: (driverId: string) => ['drivers', 'detail', driverId] as const,
  },
  driverInvites: {
    byCompany: (companyId: string) =>
      ['driverInvites', 'byCompany', companyId] as const,
  },
  clientInvites: {
    byCompany: (companyId: string) =>
      ['clientInvites', 'byCompany', companyId] as const,
  },
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
} as const;
