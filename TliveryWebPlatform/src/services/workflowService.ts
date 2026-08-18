import type {
  AcceptDriverInviteInput,
  CreateCompanyEmployeeInput,
  CreateCompanyIssuedAccountInput,
  CreateDriverInviteInput,
  CreateClientInviteInput,
  RegisterClientWithInviteInput,
  SubmitCompanyApplicationInput,
  UpdateCompanyDriverInput,
  UpdateCompanyEmployeeInput,
  ListCompanyEmployeesInput,
  ListCompanyIssuedAccountsInput,
  CompanyEmployee,
  CreateOrderInput,
  CompleteIssuedProfileInput,
} from '../models/workflow';
import {callWorkflowFunction} from '../firebase/workflowCallables';

export const workflowService = {
  submitCompanyApplication: (input: SubmitCompanyApplicationInput) =>
    callWorkflowFunction('submitCompanyApplication', input),
  reviewCompanyApplication: (
    applicationId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ) =>
    decision === 'approved'
      ? callWorkflowFunction('approveCompanyApplication', {applicationId})
      : callWorkflowFunction('rejectCompanyApplication', {
          applicationId,
          reason: reviewNote || 'Rejected by administrator',
        }),
  createDriverInvite: (input: CreateDriverInviteInput) =>
    callWorkflowFunction('createDriverInvite', input),
  createClientInvite: (input: CreateClientInviteInput = {}) =>
    callWorkflowFunction('createClientInvite', input),
  getClientInvite: (inviteCode: string) =>
    callWorkflowFunction('getClientInvite', {inviteCode}),
  registerClientWithInvite: (input: RegisterClientWithInviteInput) =>
    callWorkflowFunction('registerClientWithInvite', input),
  joinCompanyWithClientInvite: (input: {
    inviteCode: string;
    fullName?: string;
    defaultLocation?: RegisterClientWithInviteInput['defaultLocation'];
  }) => callWorkflowFunction('joinCompanyWithClientInvite', input),
  listMyCompanyMemberships: () =>
    callWorkflowFunction('listMyCompanyMemberships', {}),
  switchActiveCompany: (companyId: string) =>
    callWorkflowFunction('switchActiveCompany', {companyId}),
  listCompanyClientInvites: () =>
    callWorkflowFunction('listCompanyClientInvites', {}),
  revokeClientInvite: (inviteCode: string) =>
    callWorkflowFunction('revokeClientInvite', {
      inviteCode: inviteCode.trim().toUpperCase(),
    }),
  listCompanyDrivers: (
    input: {
      q?: string;
      status?: string;
      page?: number;
      pageSize?: number;
      cursor?: string | null;
    } = {},
  ) =>
    callWorkflowFunction('listCompanyDrivers', input),
  getCompanyDriver: (driverId: string) =>
    callWorkflowFunction('getCompanyDriver', {driverId}),
  updateCompanyDriver: (input: UpdateCompanyDriverInput) =>
    callWorkflowFunction('updateCompanyDriver', input),
  listCompanyDriverInvites: () =>
    callWorkflowFunction('listCompanyDriverInvites', {}),
  revokeDriverInvite: (inviteCode: string) =>
    callWorkflowFunction('revokeDriverInvite', {
      inviteCode: inviteCode.trim().toUpperCase(),
    }),
  removeCompanyDriver: (driverId: string) =>
    callWorkflowFunction('removeCompanyDriver', {driverId}),
  acceptDriverInvite: (input: AcceptDriverInviteInput) =>
    callWorkflowFunction('acceptDriverInvite', input),
  reviewDriverApplication: (
    applicationId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ) =>
    decision === 'approved'
      ? callWorkflowFunction('approveDriverApplication', {applicationId})
      : callWorkflowFunction('rejectDriverApplication', {
          applicationId,
          reason: reviewNote || 'Rejected by administrator',
        }),
  createCompanyEmployee: (input: CreateCompanyEmployeeInput) =>
    callWorkflowFunction('createCompanyEmployee', input),
  listCompanyEmployees: (input: ListCompanyEmployeesInput = {}) =>
    callWorkflowFunction('listCompanyEmployees', input),
  updateCompanyEmployee: (input: UpdateCompanyEmployeeInput) =>
    callWorkflowFunction('updateCompanyEmployee', input),
  deleteCompanyEmployee: (employeeId: string) =>
    callWorkflowFunction('deleteCompanyEmployee', {employeeId}),
  createCompanyClient: (input: CreateCompanyIssuedAccountInput) =>
    callWorkflowFunction('createCompanyClient', input),
  createCompanyMerchant: (input: CreateCompanyIssuedAccountInput) =>
    callWorkflowFunction('createCompanyMerchant', input),
  listCompanyClients: (input: ListCompanyIssuedAccountsInput = {}) =>
    callWorkflowFunction('listCompanyClients', input).then(result => ({
      items: result.clients,
      total: result.total,
      page: input.page ?? 1,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor ?? null,
    })),
  listCompanyMerchants: (input: ListCompanyIssuedAccountsInput = {}) =>
    callWorkflowFunction('listCompanyMerchants', input).then(result => ({
      items: result.merchants,
      total: result.total,
      page: input.page ?? 1,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor ?? null,
    })),
  deleteCompanyClient: (clientId: string) =>
    callWorkflowFunction('deleteCompanyClient', {clientId}),
  deleteCompanyMerchant: (merchantId: string) =>
    callWorkflowFunction('deleteCompanyMerchant', {merchantId}),
  createOrder: (input: CreateOrderInput) =>
    callWorkflowFunction('createOrder', input),
  requestProfilePhoneOtp: (phoneNumber: string) =>
    callWorkflowFunction('requestProfilePhoneOtp', {phoneNumber}),
  verifyProfilePhoneOtp: (phoneNumber: string, code: string) =>
    callWorkflowFunction('verifyProfilePhoneOtp', {
      phoneNumber,
      code,
    }),
  completeIssuedProfile: (input: CompleteIssuedProfileInput) =>
    callWorkflowFunction('completeIssuedProfile', input),
  listOrders: (input: {
    pageSize?: number;
    accountId?: string;
    status?: string;
    q?: string;
  } = {}) => callWorkflowFunction('listOrders', input),
  getOrder: (orderId: string) => callWorkflowFunction('getOrder', {orderId}),
  acceptOrder: (orderId: string) =>
    callWorkflowFunction('acceptOrder', {orderId}),
  cancelOrder: (orderId: string) =>
    callWorkflowFunction('cancelOrder', {orderId}),
  assignDriverToOrder: (orderId: string, driverId: string) =>
    callWorkflowFunction('assignDriverToOrder', {orderId, driverId}),
  unassignDriverFromOrder: (orderId: string) =>
    callWorkflowFunction('unassignDriverFromOrder', {orderId}),
  deleteOrder: (orderId: string) =>
    callWorkflowFunction('deleteOrder', {orderId}),
  driverReceiveOrder: (orderId: string) =>
    callWorkflowFunction('driverReceiveOrder', {orderId}),
  driverDeliverOrder: (orderId: string) =>
    callWorkflowFunction('driverDeliverOrder', {orderId}),
  listFinanceHub: () => callWorkflowFunction('listFinanceHub', {}),
  listFinanceParties: (input: {
    kind: 'driver' | 'client';
    q?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  }) => callWorkflowFunction('listFinanceParties', input),
  listFinanceTransactions: (input?: {
    partyUserId?: string;
    partyType?: 'driver' | 'client';
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  }) => callWorkflowFunction('listFinanceTransactions', input ?? {}),
  addFinanceEntry: (input: {
    partyUserId: string;
    partyType: 'driver' | 'client';
    amountJod: number;
    note?: string;
    type?: 'settlement' | 'adjustment';
  }) => callWorkflowFunction('addFinanceEntry', input),
};

export type {CompanyEmployee};
