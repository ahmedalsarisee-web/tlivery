import {httpsCallable} from 'firebase/functions';
import type {
  AcceptDriverInviteInput,
  CreateCompanyEmployeeInput,
  CreateCompanyIssuedAccountInput,
  CreateDriverDirectInput,
  CreateDriverInviteInput,
  CreateClientInviteInput,
  RegisterClientWithInviteInput,
  ClientInvite,
  Driver,
  DriverInvite,
  ListCompanyEmployeesInput,
  ListCompanyEmployeesResult,
  ListCompanyIssuedAccountsInput,
  SubmitCompanyApplicationInput,
  UpdateCompanyDriverInput,
  UpdateCompanyEmployeeInput,
  CreateOrderInput,
  CompleteIssuedProfileInput,
  OrderDto,
} from '../models/workflow';
import {firebaseFunctions} from './firebaseApp';

export type CallableContracts = {
  submitCompanyApplication: {
    request: SubmitCompanyApplicationInput;
    response: {applicationId: string};
  };
  approveCompanyApplication: {
    request: {applicationId: string};
    response: {companyId?: string; status: 'approved' | 'rejected'};
  };
  rejectCompanyApplication: {
    request: {applicationId: string; reason: string};
    response: {status: 'rejected'};
  };
  createDriverInvite: {
    request: CreateDriverInviteInput;
    response: {
      inviteId: string;
      inviteCode: string;
      code: string;
      phoneNumber: string | null;
    };
  };
  createClientInvite: {
    request: CreateClientInviteInput;
    response: {
      inviteId: string;
      inviteCode: string;
      code: string;
      phoneNumber: string | null;
      expiresInDays: number;
      inviteUrl?: string;
    };
  };
  getClientInvite: {
    request: {inviteCode: string};
    response: {
      inviteCode: string;
      companyName: string;
      status: string;
      available: boolean;
      expiresAt: number | null;
      suggestedPhone: string | null;
    };
  };
  registerClientWithInvite: {
    request: RegisterClientWithInviteInput;
    response: {
      uid: string;
      email: string;
      phoneNumber: string;
      companyId: string;
      fullName: string;
      profileComplete: boolean;
      emailVerified: boolean;
      emailVerificationLink: string | null;
      joinedExisting?: boolean;
    };
  };
  joinCompanyWithClientInvite: {
    request: {
      inviteCode: string;
      fullName?: string;
      defaultLocation?: RegisterClientWithInviteInput['defaultLocation'];
    };
    response: {
      uid: string;
      companyId: string;
      companyName: string;
      role: 'client' | 'merchant';
      joinedExisting: boolean;
    };
  };
  listMyCompanyMemberships: {
    request: Record<string, never>;
    response: {
      memberships: Array<{
        companyId: string;
        role: 'client' | 'merchant';
        status: string;
        companyName: string;
        active: boolean;
      }>;
    };
  };
  switchActiveCompany: {
    request: {companyId: string};
    response: {
      companyId: string;
      companyName: string;
      role: 'client' | 'merchant';
    };
  };
  listCompanyClientInvites: {
    request: Record<string, unknown>;
    response: {invites: ClientInvite[]};
  };
  revokeClientInvite: {
    request: {inviteCode: string};
    response: {inviteId: string; status: string};
  };
  listCompanyDrivers: {
    request: {
      q?: string;
      status?: string;
      page?: number;
      pageSize?: number;
      cursor?: string | null;
    };
    response: {
      drivers: Driver[];
      total: number;
      pageSize: number;
      hasMore: boolean;
      nextCursor: string | null;
    };
  };
  getCompanyDriver: {
    request: {driverId: string};
    response: {driver: Driver};
  };
  updateCompanyDriver: {
    request: UpdateCompanyDriverInput;
    response: {driverId: string; status: string; driver: Driver};
  };
  listCompanyDriverInvites: {
    request: Record<string, unknown>;
    response: {invites: DriverInvite[]};
  };
  revokeDriverInvite: {
    request: {inviteCode: string};
    response: {inviteId: string; status: string};
  };
  removeCompanyDriver: {
    request: {driverId: string};
    response: {driverId: string; status: string};
  };
  createDriverByPhone: {
    request: CreateDriverDirectInput;
    response: {driverId: string};
  };
  acceptDriverInvite: {
    request: AcceptDriverInviteInput;
    response: {driverId: string; companyId: string; status: string};
  };
  submitDriverApplication: {
    request: Record<string, unknown>;
    response: {applicationId: string};
  };
  approveDriverApplication: {
    request: {applicationId: string};
    response: {driverId?: string; status: 'approved' | 'rejected'};
  };
  rejectDriverApplication: {
    request: {applicationId: string; reason: string};
    response: {status: 'rejected'};
  };
  createCompanyEmployee: {
    request: CreateCompanyEmployeeInput;
    response: {employeeId: string; username: string};
  };
  listCompanyEmployees: {
    request: ListCompanyEmployeesInput;
    response: ListCompanyEmployeesResult;
  };
  updateCompanyEmployee: {
    request: UpdateCompanyEmployeeInput;
    response: {employeeId: string};
  };
  deleteCompanyEmployee: {
    request: {employeeId: string};
    response: {employeeId: string};
  };
  createCompanyClient: {
    request: CreateCompanyIssuedAccountInput;
    response: {clientId: string; username: string; status: string};
  };
  createCompanyMerchant: {
    request: CreateCompanyIssuedAccountInput;
    response: {merchantId: string; username: string; status: string};
  };
  listCompanyClients: {
    request: ListCompanyIssuedAccountsInput;
    response: {
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
  };
  listCompanyMerchants: {
    request: ListCompanyIssuedAccountsInput;
    response: {
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
  };
  deleteCompanyClient: {
    request: {clientId: string};
    response: {clientId: string; status: string};
  };
  deleteCompanyMerchant: {
    request: {merchantId: string};
    response: {merchantId: string; status: string};
  };
  createOrder: {
    request: CreateOrderInput;
    response: {orderId: string; status: string; order: OrderDto};
  };
  requestProfilePhoneOtp: {
    request: {phoneNumber: string};
    response: {
      ok: boolean;
      phoneNumber: string;
      expiresInSec: number;
      delivery: 'whatsapp' | 'debug';
      debugCode?: string;
    };
  };
  verifyProfilePhoneOtp: {
    request: {phoneNumber: string; code: string};
    response: {
      ok: boolean;
      phoneNumber: string;
      verified: boolean;
    };
  };
  completeIssuedProfile: {
    request: CompleteIssuedProfileInput;
    response: {
      ok: boolean;
      profileComplete: boolean;
      fullName: string;
      phoneNumber: string;
      defaultLocation: CompleteIssuedProfileInput['defaultLocation'];
    };
  };
  listOrders: {
    request: {
      pageSize?: number;
      accountId?: string;
      status?: string;
      q?: string;
    };
    response: {orders: OrderDto[]; total: number};
  };
  getOrder: {
    request: {orderId: string};
    response: {order: OrderDto};
  };
  acceptOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  cancelOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  assignDriverToOrder: {
    request: {orderId: string; driverId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  unassignDriverFromOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  deleteOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string};
  };
  driverReceiveOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  driverDeliverOrder: {
    request: {orderId: string};
    response: {orderId: string; status: string; order: OrderDto};
  };
  listFinanceHub: {
    request: Record<string, never>;
    response: {
      drivers: {count: number; totalJod: number};
      clients: {count: number; totalJod: number};
    };
  };
  listFinanceParties: {
    request: {
      kind: 'driver' | 'client';
      q?: string;
      page?: number;
      pageSize?: number;
      cursor?: string | null;
    };
    response: {
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
  };
  listFinanceTransactions: {
    request: {
      partyUserId?: string;
      partyType?: 'driver' | 'client';
      page?: number;
      pageSize?: number;
      cursor?: string | null;
    };
    response: {
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
  };
  addFinanceEntry: {
    request: {
      partyUserId: string;
      partyType: 'driver' | 'client';
      amountJod: number;
      note?: string;
      type?: 'settlement' | 'adjustment';
    };
    response: {
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
  };
};

export async function callWorkflowFunction<K extends keyof CallableContracts>(
  name: K,
  payload: CallableContracts[K]['request'],
): Promise<CallableContracts[K]['response']> {
  const callable = httpsCallable<
    CallableContracts[K]['request'],
    CallableContracts[K]['response']
  >(firebaseFunctions, name);
  const result = await callable(payload);
  return result.data;
}
