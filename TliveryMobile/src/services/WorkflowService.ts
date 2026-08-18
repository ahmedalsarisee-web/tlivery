import type {WorkflowCallableAdapter} from '@app/firebase/functions/WorkflowCallableAdapter';
import type {
  AcceptDriverInviteInput,
  CreateCompanyEmployeeInput,
  CreateCompanyIssuedAccountInput,
  CreateDriverInput,
  Driver,
  DriverStatus,
  ListCompanyEmployeesInput,
  ListCompanyIssuedAccountsInput,
  SubmitCompanyApplicationInput,
  SubmitDriverApplicationInput,
  UpdateCompanyDriverInput,
  UpdateCompanyEmployeeInput,
  UpdateMyVehicleInput,
} from '@app/models/workflow.model';
import type {WorkflowRepository} from '@app/repositories/WorkflowRepository';
import type {VehicleType} from '@app/features/company/types';

const required = (value: string, code: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(code);
  }
  return normalized;
};

const mapDriverDto = (row: {
  id: string;
  companyId: string;
  fullName: string;
  phone?: string;
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
}): Driver => ({
  id: row.id,
  userId: row.id,
  companyId: row.companyId,
  fullName: row.fullName,
  phoneNumber: row.phoneNumber ?? row.phone ?? '',
  vehicleType: (row.vehicleType as VehicleType) ?? 'car',
  plateNumber: row.plateNumber ?? '',
  licenseNumber: row.licenseNumber ?? '',
  vehicleModel: row.vehicleModel?.trim() || '',
  vehicleColor: row.vehicleColor?.trim() || '',
  modelYear:
    typeof row.modelYear === 'number' && Number.isFinite(row.modelYear)
      ? row.modelYear
      : null,
  insuranceValidUntil: row.insuranceValidUntil?.trim() || null,
  photoUrl: row.photoUrl?.trim() || null,
  licenseImageUrl: row.licenseImageUrl?.trim() || null,
  registrationImageUrl: row.registrationImageUrl?.trim() || null,
  insuranceImageUrl: row.insuranceImageUrl?.trim() || null,
  status: (row.status as DriverStatus) ?? 'active',
  activeOrders: row.activeOrders ?? 0,
  rating: row.rating ?? 0,
  completedOrders: row.completedOrders ?? 0,
  cancelledOrders: row.cancelledOrders ?? 0,
  successRate: row.successRate ?? 0,
  badges: row.badges ?? [],
  experienceStartedAt: row.experienceStartedAt ?? null,
  createdAt: row.createdAt ? new Date(row.createdAt) : new Date(0),
  updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(0),
});

export class WorkflowService {
  constructor(
    readonly repository: WorkflowRepository,
    private readonly callables: WorkflowCallableAdapter,
  ) {}

  submitCompanyApplication(input: SubmitCompanyApplicationInput) {
    return this.callables.submitCompanyApplication({
      companyName: required(input.companyName, 'workflow/missing-company-name'),
      commercialRegistrationNumber: required(
        input.commercialRegistrationNumber,
        'workflow/missing-commercial-registration',
      ),
      contactName: required(input.contactName, 'workflow/missing-contact-name'),
      phoneNumber: required(input.phoneNumber, 'workflow/missing-phone'),
      email: required(input.email, 'workflow/missing-email').toLowerCase(),
      city: required(input.city, 'workflow/missing-city'),
    });
  }

  acceptDriverInvite(input: AcceptDriverInviteInput) {
    return this.callables.acceptDriverInvite({
      ...input,
      inviteCode: required(input.inviteCode, 'workflow/missing-invite-code').toUpperCase(),
      fullName: required(input.fullName, 'workflow/missing-driver-name'),
      phoneNumber: required(input.phoneNumber, 'workflow/missing-phone'),
      plateNumber: required(input.plateNumber, 'workflow/missing-plate'),
      licenseNumber: required(input.licenseNumber, 'workflow/missing-license'),
    });
  }

  submitDriverApplication(input: SubmitDriverApplicationInput) {
    return this.callables.submitDriverApplication({
      ...input,
      inviteCode: required(input.inviteCode, 'workflow/missing-invite-code').toUpperCase(),
      fullName: required(input.fullName, 'workflow/missing-driver-name'),
      phoneNumber: required(input.phoneNumber, 'workflow/missing-phone'),
      plateNumber: required(input.plateNumber, 'workflow/missing-plate'),
      licenseNumber: required(input.licenseNumber, 'workflow/missing-license'),
    });
  }

  createDriverDirect(input: CreateDriverInput) {
    return this.callables.createDriverDirect({
      ...input,
      fullName: required(input.fullName, 'workflow/missing-driver-name'),
      phoneNumber: required(input.phoneNumber, 'workflow/missing-phone'),
      plateNumber: required(input.plateNumber, 'workflow/missing-plate'),
      licenseNumber: required(input.licenseNumber, 'workflow/missing-license'),
    });
  }

  createDriverInvite(phoneNumber?: string) {
    return this.callables.createDriverInvite({
      phoneNumber: phoneNumber?.trim() || undefined,
    });
  }

  createClientInvite(phoneNumber?: string, role?: 'client' | 'merchant') {
    return this.callables.createClientInvite({
      phoneNumber: phoneNumber?.trim() || undefined,
      role,
    });
  }

  getClientInvite(inviteCode: string) {
    return this.callables.getClientInvite(inviteCode);
  }

  registerClientWithInvite(input: {
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
  }) {
    return this.callables.registerClientWithInvite(input);
  }

  joinCompanyWithClientInvite(input: {
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
  }) {
    return this.callables.joinCompanyWithClientInvite(input);
  }

  listMyCompanyMemberships() {
    return this.callables.listMyCompanyMemberships();
  }

  switchActiveCompany(companyId: string) {
    return this.callables.switchActiveCompany(companyId);
  }

  listCompanyClientInvites() {
    return this.callables.listCompanyClientInvites();
  }

  revokeClientInvite(inviteCode: string) {
    return this.callables.revokeClientInvite(inviteCode);
  }

  reviewDriverApplication(
    applicationId: string,
    decision: 'approve' | 'reject',
    rejectionReason?: string,
  ) {
    return this.callables.reviewDriverApplication({
      applicationId,
      decision,
      rejectionReason: rejectionReason?.trim() || undefined,
    });
  }

  createCompanyEmployee(input: CreateCompanyEmployeeInput) {
    return this.callables.createCompanyEmployee({
      username: required(input.username, 'workflow/missing-username').toLowerCase(),
      password: required(input.password, 'workflow/missing-password'),
      displayName: input.displayName?.trim() || undefined,
      permissions: input.permissions ?? [],
    });
  }

  listCompanyEmployees(input: ListCompanyEmployeesInput = {}) {
    return this.callables.listCompanyEmployees(input);
  }

  async listCompanyDrivers(
    input: {
      q?: string;
      status?: string;
      page?: number;
      pageSize?: number;
      cursor?: string | null;
    } = {},
  ) {
    const result = await this.callables.listCompanyDrivers(input);
    return {
      drivers: result.drivers.map(mapDriverDto),
      total:
        typeof result.total === 'number'
          ? result.total
          : result.drivers.length,
      page: result.page ?? input.page ?? 1,
      pageSize: result.pageSize ?? input.pageSize ?? result.drivers.length,
      hasMore: Boolean(result.hasMore),
      nextCursor: result.nextCursor ?? null,
    };
  }

  async getCompanyDriver(driverId: string) {
    const result = await this.callables.getCompanyDriver(driverId);
    return mapDriverDto(result.driver);
  }

  updateCompanyDriver(input: UpdateCompanyDriverInput) {
    return this.callables.updateCompanyDriver({
      driverId: required(input.driverId, 'workflow/missing-driver-id'),
      fullName: input.fullName?.trim() || undefined,
      vehicleType: input.vehicleType,
      plateNumber: input.plateNumber?.trim() || undefined,
      licenseNumber: input.licenseNumber?.trim() || undefined,
      vehicleModel: input.vehicleModel?.trim() || undefined,
      vehicleColor: input.vehicleColor?.trim() || undefined,
      modelYear: input.modelYear,
      insuranceValidUntil: input.insuranceValidUntil,
      status: input.status,
      photoUrl: input.photoUrl,
      licenseImageUrl: input.licenseImageUrl,
      registrationImageUrl: input.registrationImageUrl,
      insuranceImageUrl: input.insuranceImageUrl,
    });
  }

  updateMyVehicle(input: UpdateMyVehicleInput) {
    return this.callables.updateMyVehicle({
      vehicleType: input.vehicleType,
      plateNumber: input.plateNumber?.trim() || undefined,
      licenseNumber: input.licenseNumber?.trim() || undefined,
      vehicleModel: input.vehicleModel?.trim() || undefined,
      vehicleColor: input.vehicleColor?.trim() || undefined,
      modelYear: input.modelYear,
      insuranceValidUntil: input.insuranceValidUntil,
      photoUrl: input.photoUrl,
      licenseImageUrl: input.licenseImageUrl,
      registrationImageUrl: input.registrationImageUrl,
      insuranceImageUrl: input.insuranceImageUrl,
    });
  }

  async listCompanyDriverInvites() {
    const result = await this.callables.listCompanyDriverInvites();
    return result.invites.map(row => ({
      id: row.id,
      companyId: row.companyId,
      code: row.code,
      phoneNumber: row.phoneNumber ?? row.phone,
      status: (row.status as 'pending' | 'accepted' | 'revoked' | 'expired') ?? 'pending',
      expiresAt: null,
      createdAt: new Date(0),
    }));
  }

  revokeDriverInvite(inviteCode: string) {
    return this.callables.revokeDriverInvite(inviteCode);
  }

  removeCompanyDriver(driverId: string) {
    return this.callables.removeCompanyDriver(driverId);
  }

  updateCompanyEmployee(input: UpdateCompanyEmployeeInput) {
    return this.callables.updateCompanyEmployee({
      employeeId: required(input.employeeId, 'workflow/missing-employee-id'),
      displayName: input.displayName?.trim() || undefined,
      permissions: input.permissions,
      status: input.status,
    });
  }

  deleteCompanyEmployee(employeeId: string) {
    return this.callables.deleteCompanyEmployee(
      required(employeeId, 'workflow/missing-employee-id'),
    );
  }

  createCompanyClient(input: CreateCompanyIssuedAccountInput) {
    return this.callables.createCompanyClient({
      username: required(input.username, 'workflow/missing-username').toLowerCase(),
      password: required(input.password, 'workflow/missing-password'),
      displayName: input.displayName?.trim() || undefined,
    });
  }

  createCompanyMerchant(input: CreateCompanyIssuedAccountInput) {
    return this.callables.createCompanyMerchant({
      username: required(input.username, 'workflow/missing-username').toLowerCase(),
      password: required(input.password, 'workflow/missing-password'),
      displayName: input.displayName?.trim() || undefined,
    });
  }

  listCompanyClients(input: ListCompanyIssuedAccountsInput = {}) {
    return this.callables.listCompanyClients(input).then(result => ({
      items: result.clients,
      total: result.total,
      page: input.page ?? 1,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor ?? null,
    }));
  }

  listCompanyMerchants(input: ListCompanyIssuedAccountsInput = {}) {
    return this.callables.listCompanyMerchants(input).then(result => ({
      items: result.merchants,
      total: result.total,
      page: input.page ?? 1,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor ?? null,
    }));
  }

  deleteCompanyClient(clientId: string) {
    return this.callables.deleteCompanyClient(
      required(clientId, 'workflow/missing-client-id'),
    );
  }

  deleteCompanyMerchant(merchantId: string) {
    return this.callables.deleteCompanyMerchant(
      required(merchantId, 'workflow/missing-merchant-id'),
    );
  }

  recordDriverOrderOutcome(driverId: string, outcome: 'delivered' | 'cancelled') {
    return this.callables.recordDriverOrderOutcome({driverId, outcome});
  }

  createOrder(input: {
    customerName?: string;
    customerPhone?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    pickupLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
    dropoffLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
    amountJod?: number;
    isCod?: boolean;
    notes?: string;
  }) {
    return this.callables.createOrder({
      customerName: input.customerName?.trim() ?? '',
      customerPhone: input.customerPhone?.trim() ?? '',
      pickupAddress: input.pickupAddress?.trim() ?? '',
      dropoffAddress: input.dropoffAddress?.trim() ?? '',
      ...(input.pickupLocation ? {pickupLocation: input.pickupLocation} : {}),
      ...(input.dropoffLocation ? {dropoffLocation: input.dropoffLocation} : {}),
      amountJod: input.amountJod,
      isCod: input.isCod,
      notes: input.notes?.trim() || undefined,
    }).then(result => ({
      orderId: result.orderId,
      status: result.status,
      order: mapOrderDto(result.order),
    }));
  }

  listOrders(pageSize = 50, accountId?: string, status?: string, q?: string) {
    return this.callables
      .listOrders({
        pageSize,
        ...(accountId ? {accountId} : {}),
        ...(status && status !== 'all' ? {status} : {}),
        ...(q?.trim() ? {q: q.trim()} : {}),
      })
      .then(result => ({
        orders: result.orders.map(mapOrderDto),
        total: result.total,
      }));
  }

  getOrder(orderId: string) {
    return this.callables
      .getOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => mapOrderDto(result.order));
  }

  acceptOrder(orderId: string) {
    return this.callables
      .acceptOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  cancelOrder(orderId: string) {
    return this.callables
      .cancelOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  assignDriverToOrder(orderId: string, driverId: string) {
    return this.callables
      .assignDriverToOrder(
        required(orderId, 'workflow/missing-order-id'),
        required(driverId, 'workflow/missing-driver-id'),
      )
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  unassignDriverFromOrder(orderId: string) {
    return this.callables
      .unassignDriverFromOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  deleteOrder(orderId: string) {
    return this.callables
      .deleteOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
      }));
  }

  driverReceiveOrder(orderId: string) {
    return this.callables
      .driverReceiveOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  driverDeliverOrder(orderId: string) {
    return this.callables
      .driverDeliverOrder(required(orderId, 'workflow/missing-order-id'))
      .then(result => ({
        orderId: result.orderId,
        status: result.status,
        order: mapOrderDto(result.order),
      }));
  }

  listFinanceHub() {
    return this.callables.listFinanceHub();
  }

  listFinanceParties(input: {
    kind: 'driver' | 'client';
    q?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  }) {
    return this.callables.listFinanceParties(input);
  }

  listFinanceTransactions(input?: {
    partyUserId?: string;
    partyType?: 'driver' | 'client';
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  }) {
    return this.callables.listFinanceTransactions(input ?? {});
  }

  addFinanceEntry(input: {
    partyUserId: string;
    partyType: 'driver' | 'client';
    amountJod: number;
    note?: string;
    type?: 'settlement' | 'adjustment';
  }) {
    return this.callables.addFinanceEntry(input);
  }

  requestProfilePhoneOtp(phoneNumber: string) {
    return this.callables.requestProfilePhoneOtp(phoneNumber);
  }

  verifyProfilePhoneOtp(phoneNumber: string, code: string) {
    return this.callables.verifyProfilePhoneOtp(phoneNumber, code);
  }

  completeIssuedProfile(input: {
    fullName: string;
    phoneNumber: string;
    defaultLocation: import('@app/constants/jordanLocations').PublicOrderLocation;
    locationNote?: string;
    altPhoneNumber?: string;
  }) {
    return this.callables.completeIssuedProfile({
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      defaultLocation: input.defaultLocation,
      locationNote: input.locationNote?.trim() || undefined,
      altPhoneNumber: input.altPhoneNumber?.trim() || undefined,
    });
  }
}

function mapOrderDto(order: {
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
  pickupLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  dropoffLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  amountJod: number;
  isCod: boolean;
  notes?: string | null;
  status: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone?: string | null;
  companyName: string | null;
  companyCode: string | null;
  timeline: Array<{status: string; at: string; note?: string}>;
  createdAt: string | null;
  updatedAt: string | null;
}): import('@app/features/orders/types').WaselOrder {
  return {
    id: order.id,
    reference: order.reference,
    companyId: order.companyId,
    createdByUserId: order.createdByUserId,
    createdByRole: order.createdByRole,
    createdByName: order.createdByName ?? null,
    clientId: order.clientId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    pickupAddress: order.pickupAddress,
    dropoffAddress: order.dropoffAddress,
    pickupLocation: order.pickupLocation ?? null,
    dropoffLocation: order.dropoffLocation ?? null,
    amountJod: order.amountJod,
    isCod: order.isCod,
    notes: order.notes ?? null,
    status: order.status as import('@app/features/orders/types').OrderStatus,
    driverId: order.driverId,
    driverName: order.driverName,
    driverPhone: order.driverPhone ?? null,
    companyName: order.companyName ?? undefined,
    companyCode: order.companyCode ?? undefined,
    createdAt: order.createdAt ?? new Date(0).toISOString(),
    updatedAt: order.updatedAt,
    timeline: order.timeline.map(event => ({
      status: event.status as import('@app/features/orders/types').OrderStatus,
      at: event.at,
      noteKey: event.note,
    })),
  };
}
