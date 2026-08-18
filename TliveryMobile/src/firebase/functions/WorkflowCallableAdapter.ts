import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import {getAuth, getIdTokenResult} from 'firebase/auth';
import {firebaseApp} from '@app/firebase/firebaseApp';
import type {
  AcceptDriverInviteInput,
  CreateCompanyEmployeeInput,
  CreateCompanyIssuedAccountInput,
  CreateDriverInput,
  ListCompanyEmployeesInput,
  ListCompanyEmployeesResult,
  ListCompanyIssuedAccountsInput,
  SubmitCompanyApplicationInput,
  SubmitDriverApplicationInput,
  UpdateCompanyEmployeeInput,
  UpdateCompanyDriverInput,
  UpdateMyVehicleInput,
} from '@app/models/workflow.model';
import {apiLogger} from '@app/utils/apiLogger';
import {measureApiCall} from '@app/utils/apiPerf';
import {withApiLoading} from '@app/utils/apiLoadingVisibility';

export type CallableResult = {id: string};

export interface ReviewApplicationInput {
  applicationId: string;
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

export interface CreateDriverInviteInput {
  phoneNumber?: string;
}

type CallablePayloads = {
  submitCompanyApplication: SubmitCompanyApplicationInput;
  approveCompanyApplication: {applicationId: string};
  rejectCompanyApplication: {applicationId: string; reason: string};
  createDriverInvite: CreateDriverInviteInput;
  createClientInvite: {
    phoneNumber?: string;
    expiresInDays?: number;
    note?: string;
    role?: 'client' | 'merchant';
  };
  getClientInvite: {inviteCode: string};
  registerClientWithInvite: {
    inviteCode: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
    password: string;
    defaultLocation?: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
  };
  joinCompanyWithClientInvite: {
    inviteCode: string;
    fullName?: string;
    defaultLocation?: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
  };
  listMyCompanyMemberships: Record<string, never>;
  switchActiveCompany: {companyId: string};
  listCompanyClientInvites: Record<string, never>;
  revokeClientInvite: {inviteCode: string};
  createDriverByPhone: CreateDriverInput;
  acceptDriverInvite: AcceptDriverInviteInput;
  submitDriverApplication: SubmitDriverApplicationInput;
  approveDriverApplication: {applicationId: string};
  rejectDriverApplication: {applicationId: string; reason: string};
  createCompanyEmployee: CreateCompanyEmployeeInput;
  listCompanyEmployees: ListCompanyEmployeesInput;
  listCompanyDrivers: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  };
  listCompanyDriverInvites: Record<string, never>;
  getCompanyDriver: {driverId: string};
  updateCompanyDriver: UpdateCompanyDriverInput;
  updateMyVehicle: UpdateMyVehicleInput;
  revokeDriverInvite: {inviteCode: string};
  removeCompanyDriver: {driverId: string};
  updateCompanyEmployee: UpdateCompanyEmployeeInput;
  deleteCompanyEmployee: {employeeId: string};
  createCompanyClient: CreateCompanyIssuedAccountInput;
  createCompanyMerchant: CreateCompanyIssuedAccountInput;
  listCompanyClients: ListCompanyIssuedAccountsInput;
  listCompanyMerchants: ListCompanyIssuedAccountsInput;
  deleteCompanyClient: {clientId: string};
  deleteCompanyMerchant: {merchantId: string};
  recordDriverOrderOutcome: {
    driverId: string;
    outcome: 'delivered' | 'cancelled';
  };
  createOrder: {
    customerName?: string;
    customerPhone?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    pickupLocation?: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
    dropoffLocation?: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
  amountJod?: number;
  isCod?: boolean;
  notes?: string;
};
  listOrders: {
    pageSize?: number;
    accountId?: string;
    status?: string;
    q?: string;
  };
  getOrder: {orderId: string};
  acceptOrder: {orderId: string};
  cancelOrder: {orderId: string};
  assignDriverToOrder: {orderId: string; driverId: string};
  unassignDriverFromOrder: {orderId: string};
  deleteOrder: {orderId: string};
  driverReceiveOrder: {orderId: string};
  driverDeliverOrder: {orderId: string};
  listFinanceHub: Record<string, never>;
  listFinanceParties: {
    kind: 'driver' | 'client';
    q?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  };
  listFinanceTransactions: {
    partyUserId?: string;
    partyType?: 'driver' | 'client';
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  };
  addFinanceEntry: {
    partyUserId: string;
    partyType: 'driver' | 'client';
    amountJod: number;
    note?: string;
    type?: 'settlement' | 'adjustment';
  };
  requestProfilePhoneOtp: {phoneNumber: string};
  verifyProfilePhoneOtp: {phoneNumber: string; code: string};
  completeIssuedProfile: {
    fullName: string;
    phoneNumber: string;
    defaultLocation: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
    locationNote?: string;
    altPhoneNumber?: string;
  };
};

type CallableResponses = {
  submitCompanyApplication: {applicationId: string};
  approveCompanyApplication: {applicationId: string};
  rejectCompanyApplication: {applicationId: string};
  createDriverInvite: {
    inviteId: string;
    inviteCode: string;
    code: string;
    phoneNumber: string | null;
  };
  createClientInvite: {
    inviteId: string;
    inviteCode: string;
    code: string;
    phoneNumber: string | null;
    expiresInDays: number;
    inviteUrl?: string;
  };
  getClientInvite: {
    inviteCode: string;
    companyName: string;
    status: string;
    available: boolean;
    expiresAt: number | null;
    suggestedPhone: string | null;
  };
  registerClientWithInvite: {
    uid: string;
    email: string;
    phoneNumber: string;
    companyId: string;
    role?: 'client' | 'merchant';
    fullName: string;
    profileComplete: boolean;
    emailVerified: boolean;
    emailVerificationLink: string | null;
    joinedExisting?: boolean;
  };
  joinCompanyWithClientInvite: {
    uid: string;
    companyId: string;
    companyName: string;
    role: 'client' | 'merchant';
    joinedExisting: boolean;
  };
  listMyCompanyMemberships: {
    memberships: Array<{
      companyId: string;
      role: 'client' | 'merchant';
      status: string;
      companyName: string;
      active: boolean;
    }>;
  };
  switchActiveCompany: {
    companyId: string;
    companyName: string;
    role: 'client' | 'merchant';
  };
  listCompanyClientInvites: {
    invites: Array<{
      id: string;
      companyId: string;
      code: string;
      phone: string | null;
      phoneNumber: string | null;
      status: string;
      claimedBy: string | null;
      createdAt: unknown;
    }>;
  };
  revokeClientInvite: {inviteId: string; status: string};
  createDriverByPhone: {driverId: string};
  acceptDriverInvite: {driverId: string; companyId: string; status: string};
  submitDriverApplication: {applicationId: string};
  approveDriverApplication: {applicationId: string};
  rejectDriverApplication: {applicationId: string};
  createCompanyEmployee: {employeeId: string; username: string};
  listCompanyEmployees: ListCompanyEmployeesResult;
  listCompanyDrivers: {
    drivers: Array<{
      id: string;
      companyId: string;
      fullName: string;
      phone: string;
      phoneNumber?: string;
      status: string;
      vehicleType?: string;
      plateNumber?: string;
      licenseNumber?: string;
      vehicleModel?: string | null;
      vehicleColor?: string | null;
      modelYear?: number | null;
      insuranceValidUntil?: string | null;
      photoUrl?: string | null;
      licenseImageUrl?: string | null;
      registrationImageUrl?: string | null;
      insuranceImageUrl?: string | null;
      activeOrders?: number;
      rating?: number;
      completedOrders?: number;
      cancelledOrders?: number;
      successRate?: number;
      badges?: string[];
      experienceStartedAt?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    }>;
    total: number;
    page?: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  listCompanyDriverInvites: {
    invites: Array<{
      id: string;
      companyId: string;
      code: string;
      phone: string | null;
      phoneNumber: string | null;
      status: string;
      createdAt: unknown;
    }>;
  };
  getCompanyDriver: {
    driver: {
      id: string;
      companyId: string;
      fullName: string;
      phone: string;
      phoneNumber?: string;
      status: string;
      vehicleType?: string;
      plateNumber?: string;
      licenseNumber?: string;
      vehicleModel?: string | null;
      vehicleColor?: string | null;
      modelYear?: number | null;
      insuranceValidUntil?: string | null;
      photoUrl?: string | null;
      licenseImageUrl?: string | null;
      registrationImageUrl?: string | null;
      insuranceImageUrl?: string | null;
      activeOrders?: number;
      rating?: number;
      completedOrders?: number;
      cancelledOrders?: number;
      successRate?: number;
      badges?: string[];
      experienceStartedAt?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    };
  };
  updateCompanyDriver: {
    driverId: string;
    status: string;
    driver: {
      id: string;
      companyId: string;
      fullName: string;
      phone: string;
      phoneNumber?: string;
      status: string;
      vehicleType?: string;
      plateNumber?: string;
      licenseNumber?: string;
      vehicleModel?: string | null;
      vehicleColor?: string | null;
      modelYear?: number | null;
      insuranceValidUntil?: string | null;
      photoUrl?: string | null;
      licenseImageUrl?: string | null;
      registrationImageUrl?: string | null;
      insuranceImageUrl?: string | null;
      activeOrders?: number;
      rating?: number;
      completedOrders?: number;
      cancelledOrders?: number;
      successRate?: number;
      badges?: string[];
      experienceStartedAt?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    };
  };
  revokeDriverInvite: {inviteId: string; status: string};
  removeCompanyDriver: {driverId: string; status: string};
  updateCompanyEmployee: {employeeId: string};
  deleteCompanyEmployee: {employeeId: string};
  createCompanyClient: {clientId: string; username: string; status: string};
  createCompanyMerchant: {
    merchantId: string;
    username: string;
    status: string;
  };
  listCompanyClients: {
    clients: Array<{
      id: string;
      username: string;
      displayName: string;
      email: string | null;
      phoneNumber: string | null;
      status: string;
      permissions: string[];
      companyId: string;
    }>;
    total: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  listCompanyMerchants: {
    merchants: Array<{
      id: string;
      username: string;
      displayName: string;
      email: string | null;
      phoneNumber: string | null;
      status: string;
      permissions: string[];
      companyId: string;
    }>;
    total: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  deleteCompanyClient: {clientId: string; status: string};
  deleteCompanyMerchant: {merchantId: string; status: string};
  recordDriverOrderOutcome: {
    driverId: string;
    profile: {
      rating: number;
      completedOrders: number;
      cancelledOrders: number;
      successRate: number;
      badges: string[];
      experienceStartedAt: string | null;
    };
  };
  createOrder: {
    orderId: string;
    status: string;
    order: OrderDto;
  };
  listOrders: {orders: OrderDto[]; total: number};
  getOrder: {order: OrderDto};
  acceptOrder: {orderId: string; status: string; order: OrderDto};
  cancelOrder: {orderId: string; status: string; order: OrderDto};
  assignDriverToOrder: {orderId: string; status: string; order: OrderDto};
  unassignDriverFromOrder: {
    orderId: string;
    status: string;
    order: OrderDto;
  };
  deleteOrder: {orderId: string; status: string};
  driverReceiveOrder: {orderId: string; status: string; order: OrderDto};
  driverDeliverOrder: {orderId: string; status: string; order: OrderDto};
  listFinanceHub: {
    drivers: {count: number; totalJod: number};
    clients: {count: number; totalJod: number};
  };
  listFinanceParties: {
    parties: Array<{
      id: string;
      companyId: string;
      partyType: 'driver' | 'client';
      partyUserId: string;
      partyName: string;
      balanceJod: number;
      displayBalanceJod: number;
      updatedAt: string | null;
    }>;
    total: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  listFinanceTransactions: {
    account: {
      id: string;
      companyId: string;
      partyType: 'driver' | 'client';
      partyUserId: string;
      partyName: string;
      balanceJod: number;
      displayBalanceJod: number;
      updatedAt: string | null;
    };
    invertForViewer: boolean;
    transactions: Array<{
      id: string;
      companyId: string;
      accountId: string;
      partyType: 'driver' | 'client';
      partyUserId: string;
      amountJod: number;
      displayAmountJod: number;
      type: 'order_delivery' | 'settlement' | 'adjustment';
      orderId: string | null;
      orderReference: string | null;
      note: string;
      createdByUserId: string;
      createdAt: string | null;
    }>;
    pageSize: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
  addFinanceEntry: {
    transactionId: string;
    account: {
      id: string;
      companyId: string;
      partyType: 'driver' | 'client';
      partyUserId: string;
      partyName: string;
      balanceJod: number;
      updatedAt: string | null;
    };
  };
  requestProfilePhoneOtp: {
    ok: boolean;
    phoneNumber: string;
    expiresInSec: number;
    delivery: 'whatsapp' | 'debug';
    debugCode?: string;
  };
  verifyProfilePhoneOtp: {
    ok: boolean;
    phoneNumber: string;
    verified: boolean;
  };
  completeIssuedProfile: {
    ok: boolean;
    profileComplete: boolean;
    fullName: string;
    phoneNumber: string;
    defaultLocation: {
      countryCode: 'JO';
      governorateId: string;
      areaId: string;
      note?: string | null;
      lat?: number | null;
      lng?: number | null;
      areaAr?: string | null;
      areaEn?: string | null;
      governorateAr?: string | null;
      governorateEn?: string | null;
      placeNameAr?: string | null;
      placeNameEn?: string | null;
      mapboxId?: string | null;
    };
  };
};

export type OrderDto = {
  id: string;
  reference: string;
  companyId: string;
  createdByUserId: string;
  createdByRole: string;
  createdByName?: string | null;
  clientId: string | null;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLocation: {
    countryCode: 'JO';
    governorateId: string;
    areaId: string;
    note?: string | null;
    lat?: number | null;
    lng?: number | null;
    areaAr?: string | null;
    areaEn?: string | null;
    governorateAr?: string | null;
    governorateEn?: string | null;
    placeNameAr?: string | null;
    placeNameEn?: string | null;
    mapboxId?: string | null;
  } | null;
  dropoffLocation: {
    countryCode: 'JO';
    governorateId: string;
    areaId: string;
    note?: string | null;
    lat?: number | null;
    lng?: number | null;
    areaAr?: string | null;
    areaEn?: string | null;
    governorateAr?: string | null;
    governorateEn?: string | null;
    placeNameAr?: string | null;
    placeNameEn?: string | null;
    mapboxId?: string | null;
  } | null;
  amountJod: number;
  isCod: boolean;
  notes?: string | null;
  status: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  companyName: string | null;
  companyCode: string | null;
  timeline: Array<{status: string; at: string; note?: string}>;
  createdAt: string | null;
  updatedAt: string | null;
};

export class WorkflowCallableAdapter {
  private readonly functions = getFunctions(firebaseApp, 'me-central1');

  submitCompanyApplication(input: SubmitCompanyApplicationInput) {
    return this.call('submitCompanyApplication', input);
  }

  reviewCompanyApplication(input: ReviewApplicationInput) {
    return input.decision === 'approve'
      ? this.call('approveCompanyApplication', {
          applicationId: input.applicationId,
        })
      : this.call('rejectCompanyApplication', {
          applicationId: input.applicationId,
          reason: input.rejectionReason ?? 'Rejected by administrator',
        });
  }

  createDriverInvite(input: CreateDriverInviteInput) {
    return this.call('createDriverInvite', input);
  }

  createClientInvite(input: {
    phoneNumber?: string;
    expiresInDays?: number;
    note?: string;
    role?: 'client' | 'merchant';
  }) {
    return this.call('createClientInvite', input);
  }

  getClientInvite(inviteCode: string) {
    return this.call('getClientInvite', {inviteCode}, {quiet: true});
  }

  registerClientWithInvite(input: {
    inviteCode: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
    password: string;
    defaultLocation?: CallablePayloads['registerClientWithInvite']['defaultLocation'];
  }) {
    return this.call('registerClientWithInvite', input);
  }

  joinCompanyWithClientInvite(input: {
    inviteCode: string;
    fullName?: string;
    defaultLocation?: CallablePayloads['joinCompanyWithClientInvite']['defaultLocation'];
  }) {
    return this.call('joinCompanyWithClientInvite', input);
  }

  listMyCompanyMemberships() {
    return this.call('listMyCompanyMemberships', {});
  }

  switchActiveCompany(companyId: string) {
    return this.call('switchActiveCompany', {companyId});
  }

  listCompanyClientInvites() {
    return this.call('listCompanyClientInvites', {});
  }

  revokeClientInvite(inviteCode: string) {
    return this.call('revokeClientInvite', {inviteCode});
  }

  createDriverDirect(input: CreateDriverInput) {
    return this.call('createDriverByPhone', input);
  }

  acceptDriverInvite(input: AcceptDriverInviteInput) {
    return this.call('acceptDriverInvite', input);
  }

  submitDriverApplication(input: SubmitDriverApplicationInput) {
    return this.call('submitDriverApplication', input);
  }

  reviewDriverApplication(input: ReviewApplicationInput) {
    return input.decision === 'approve'
      ? this.call('approveDriverApplication', {
          applicationId: input.applicationId,
        })
      : this.call('rejectDriverApplication', {
          applicationId: input.applicationId,
          reason: input.rejectionReason ?? 'Rejected by administrator',
        });
  }

  createCompanyEmployee(input: CreateCompanyEmployeeInput) {
    return this.call('createCompanyEmployee', input);
  }

  listCompanyEmployees(input: ListCompanyEmployeesInput = {}) {
    return this.call(
      'listCompanyEmployees',
      {
        q: input.q?.trim() || undefined,
        status: input.status && input.status !== 'all' ? input.status : undefined,
        page: input.page,
        pageSize: input.pageSize,
        cursor: input.cursor ?? undefined,
      },
      {quiet: true},
    );
  }

  listCompanyDrivers(input: CallablePayloads['listCompanyDrivers'] = {}) {
    return this.call(
      'listCompanyDrivers',
      {
        q: input.q?.trim() || undefined,
        status: input.status && input.status !== 'all' ? input.status : undefined,
        pageSize: input.pageSize,
        cursor: input.cursor ?? undefined,
      },
      {quiet: true},
    );
  }

  listCompanyDriverInvites() {
    return this.call('listCompanyDriverInvites', {}, {quiet: true});
  }

  revokeDriverInvite(inviteCode: string) {
    return this.call('revokeDriverInvite', {
      inviteCode: inviteCode.trim().toUpperCase(),
    });
  }

  removeCompanyDriver(driverId: string) {
    return this.call('removeCompanyDriver', {driverId});
  }

  getCompanyDriver(driverId: string) {
    return this.call('getCompanyDriver', {driverId});
  }

  updateCompanyDriver(input: UpdateCompanyDriverInput) {
    return this.call('updateCompanyDriver', input);
  }

  updateMyVehicle(input: UpdateMyVehicleInput) {
    return this.call('updateMyVehicle', input);
  }

  updateCompanyEmployee(input: UpdateCompanyEmployeeInput) {
    return this.call('updateCompanyEmployee', input);
  }

  deleteCompanyEmployee(employeeId: string) {
    return this.call('deleteCompanyEmployee', {employeeId});
  }

  createCompanyClient(input: CreateCompanyIssuedAccountInput) {
    return this.call('createCompanyClient', input);
  }

  createCompanyMerchant(input: CreateCompanyIssuedAccountInput) {
    return this.call('createCompanyMerchant', input);
  }

  listCompanyClients(input: ListCompanyIssuedAccountsInput = {}) {
    return this.call(
      'listCompanyClients',
      {
        q: input.q?.trim() || undefined,
        status: input.status && input.status !== 'all' ? input.status : undefined,
        pageSize: input.pageSize,
        cursor: input.cursor ?? undefined,
      },
      {quiet: true},
    );
  }

  listCompanyMerchants(input: ListCompanyIssuedAccountsInput = {}) {
    return this.call(
      'listCompanyMerchants',
      {
        q: input.q?.trim() || undefined,
        status: input.status && input.status !== 'all' ? input.status : undefined,
        pageSize: input.pageSize,
        cursor: input.cursor ?? undefined,
      },
      {quiet: true},
    );
  }

  deleteCompanyClient(clientId: string) {
    return this.call('deleteCompanyClient', {clientId});
  }

  deleteCompanyMerchant(merchantId: string) {
    return this.call('deleteCompanyMerchant', {merchantId});
  }

  recordDriverOrderOutcome(
    input: {driverId: string; outcome: 'delivered' | 'cancelled'},
  ) {
    return this.call('recordDriverOrderOutcome', input);
  }

  requestProfilePhoneOtp(phoneNumber: string) {
    return this.call('requestProfilePhoneOtp', {phoneNumber});
  }

  verifyProfilePhoneOtp(phoneNumber: string, code: string) {
    return this.call('verifyProfilePhoneOtp', {phoneNumber, code});
  }

  completeIssuedProfile(input: CallablePayloads['completeIssuedProfile']) {
    return this.call('completeIssuedProfile', input);
  }

  createOrder(input: CallablePayloads['createOrder']) {
    return this.call('createOrder', input);
  }

  listOrders(input: CallablePayloads['listOrders'] = {}) {
    return this.call('listOrders', input, {quiet: true});
  }

  getOrder(orderId: string) {
    return this.call('getOrder', {orderId}, {quiet: true});
  }

  acceptOrder(orderId: string) {
    return this.call('acceptOrder', {orderId});
  }

  cancelOrder(orderId: string) {
    return this.call('cancelOrder', {orderId});
  }

  assignDriverToOrder(orderId: string, driverId: string) {
    return this.call('assignDriverToOrder', {orderId, driverId});
  }

  unassignDriverFromOrder(orderId: string) {
    return this.call('unassignDriverFromOrder', {orderId});
  }

  deleteOrder(orderId: string) {
    return this.call('deleteOrder', {orderId});
  }

  driverReceiveOrder(orderId: string) {
    return this.call('driverReceiveOrder', {orderId}, {quiet: true});
  }

  driverDeliverOrder(orderId: string) {
    return this.call('driverDeliverOrder', {orderId});
  }

  listFinanceHub() {
    return this.call('listFinanceHub', {});
  }

  listFinanceParties(input: CallablePayloads['listFinanceParties']) {
    return this.call('listFinanceParties', {
      kind: input.kind,
      q: input.q?.trim() || undefined,
      page: input.page,
      pageSize: input.pageSize,
      cursor: input.cursor ?? undefined,
    });
  }

  listFinanceTransactions(input: CallablePayloads['listFinanceTransactions'] = {}) {
    return this.call('listFinanceTransactions', {
      partyUserId: input.partyUserId,
      partyType: input.partyType,
      page: input.page,
      pageSize: input.pageSize,
      cursor: input.cursor ?? undefined,
    });
  }

  addFinanceEntry(input: CallablePayloads['addFinanceEntry']) {
    return this.call('addFinanceEntry', input);
  }

  private async call<Name extends keyof CallablePayloads>(
    name: Name,
    payload: CallablePayloads[Name],
    options?: {quiet?: boolean},
  ): Promise<CallableResponses[Name]> {
    const run = async () => {
      apiLogger.info(`functions.${name}.started`);
      try {
        return await this.invoke(name, payload);
      } catch (error) {
        if (!isPermissionDenied(error)) {
          apiLogger.error(`functions.${name}.failed`, error);
          throw error;
        }
        apiLogger.info(`functions.${name}.refreshing-token`);
        try {
          const user = getAuth().currentUser;
          if (user) {
            await getIdTokenResult(user, true);
          }
          return await this.invoke(name, payload);
        } catch (retryError) {
          apiLogger.error(`functions.${name}.failed`, error);
          apiLogger.error(`functions.${name}.retry-failed`, retryError);
          throw retryError;
        }
      }
    };
    return options?.quiet ? run() : withApiLoading(run);
  }

  private async invoke<Name extends keyof CallablePayloads>(
    name: Name,
    payload: CallablePayloads[Name],
  ): Promise<CallableResponses[Name]> {
    return measureApiCall(
      `functions.${name}`,
      async () => {
        const callable = httpsCallable<
          CallablePayloads[Name],
          CallableResponses[Name]
        >(this.functions, name);
        const result = await callable(payload);
        apiLogger.info(`functions.${name}.succeeded`);
        return result.data;
      },
      {method: 'CALLABLE', payload},
    );
  }
}

function isPermissionDenied(error: unknown): boolean {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as {code?: unknown}).code ?? '')
      : '';
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : '';
  return (
    code.includes('permission-denied') ||
    message.toLowerCase().includes('permission-denied') ||
    message.toLowerCase().includes('company staff required')
  );
}
