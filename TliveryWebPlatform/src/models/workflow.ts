import type {Timestamp} from 'firebase/firestore';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type AccountStatus = ApplicationStatus | 'active' | 'suspended';

export type UserProfile = {
  uid: string;
  displayName: string;
  fullName?: string | null;
  email: string;
  phone?: string;
  phoneNumber?: string | null;
  altPhoneNumber?: string | null;
  status?: AccountStatus;
  permissions?: string[];
  role?: string;
  companyId?: string | null;
  profileComplete?: boolean;
  defaultLocation?: PublicOrderLocation | null;
};

export type CompanyApplication = {
  id: string;
  applicantUid: string;
  userId: string;
  companyName: string;
  companyCode?: string;
  commercialRegister: string;
  city: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  maxDrivers?: number;
  notes?: string;
  status: ApplicationStatus;
  submittedAt?: Timestamp | string;
  createdAt?: Timestamp | string;
  reviewNote?: string;
};

export type Company = {
  id: string;
  companyName: string;
  companyCode?: string;
  status: AccountStatus;
  activeDrivers?: number;
  maxDrivers?: number;
};

export type VehicleType = 'motorcycle' | 'car' | 'van';

export type DriverApplication = {
  id: string;
  applicantUid?: string;
  userId?: string;
  companyId: string;
  fullName: string;
  phone: string;
  vehicleType?: VehicleType;
  plateNumber?: string;
  licenseNumber?: string;
  status: ApplicationStatus;
  submittedAt?: Timestamp | string;
  createdAt?: Timestamp | string;
  reviewNote?: string;
};

export type DriverStatus = 'active' | 'offline' | 'busy' | 'suspended' | 'removed';

export type Driver = {
  id: string;
  companyId: string;
  fullName: string;
  phone: string;
  phoneNumber?: string;
  status: DriverStatus | AccountStatus | string;
  vehicleType?: VehicleType;
  plateNumber?: string;
  licenseNumber?: string;
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

export type UpdateCompanyDriverInput = {
  driverId: string;
  fullName?: string;
  vehicleType?: VehicleType;
  plateNumber?: string;
  licenseNumber?: string;
  status?: Exclude<DriverStatus, 'removed'>;
  photoUrl?: string | null;
  licenseImageUrl?: string | null;
  registrationImageUrl?: string | null;
  insuranceImageUrl?: string | null;
};

export type DriverInvite = {
  id: string;
  companyId: string;
  code?: string;
  phone?: string;
  phoneNumber?: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt?: Timestamp | string;
};

export type ClientInvite = {
  id: string;
  companyId: string;
  code: string;
  phone?: string | null;
  phoneNumber?: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked' | 'open';
  claimedBy?: string | null;
  createdAt?: Timestamp | string | null;
};

export type CreateClientInviteInput = {
  phoneNumber?: string;
  expiresInDays?: number;
  note?: string;
  role?: 'client' | 'merchant';
};

export type RegisterClientWithInviteInput = {
  inviteCode: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  password: string;
  defaultLocation?: PublicOrderLocation;
};

export type GetClientInviteResult = {
  inviteCode: string;
  companyName: string;
  status: string;
  available: boolean;
  expiresAt: number | null;
  suggestedPhone: string | null;
};

export type SubmitCompanyApplicationInput = Omit<
  CompanyApplication,
  | 'id'
  | 'applicantUid'
  | 'userId'
  | 'status'
  | 'submittedAt'
  | 'createdAt'
  | 'reviewNote'
>;

export type CreateDriverInviteInput = {phone: string};
export type CreateDriverDirectInput = {phone: string; fullName: string};

export type AcceptDriverInviteInput = {
  inviteCode: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: string;
  plateNumber: string;
  licenseNumber: string;
};

export type CompanyEmployee = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  permissions: string[];
  companyId: string;
};

export type CompanyIssuedAccount = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  permissions: string[];
  companyId: string;
};

export type CreateCompanyEmployeeInput = {
  username: string;
  password: string;
  displayName?: string;
  permissions: string[];
};

export type CreateCompanyIssuedAccountInput = {
  username: string;
  password: string;
  displayName?: string;
};

export type UpdateCompanyEmployeeInput = {
  employeeId: string;
  displayName?: string;
  permissions?: string[];
  status?: 'active' | 'suspended' | 'disabled';
};

export type ListCompanyEmployeesInput = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  cursor?: string | null;
};

export type ListCompanyEmployeesResult = {
  employees: CompanyEmployee[];
  total: number;
  page?: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export type ListCompanyIssuedAccountsInput = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  cursor?: string | null;
};

export type ListCompanyIssuedAccountsResult = {
  items: CompanyIssuedAccount[];
  total: number;
  page?: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export type OrderStatus =
  | 'pendingCompany'
  | 'companyAccepted'
  | 'driverAssigned'
  | 'onRoute'
  | 'shipped'
  | 'cancelled'
  | 'delivered';

export type OrderTimelineEvent = {
  status: string;
  at: string;
  note?: string;
};

export type PublicOrderLocation = {
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
  pickupLocation?: PublicOrderLocation | null;
  dropoffLocation?: PublicOrderLocation | null;
  amountJod: number;
  isCod: boolean;
  notes?: string | null;
  status: string;
  driverId: string | null;
  driverName: string | null;
  companyName: string | null;
  companyCode: string | null;
  timeline: OrderTimelineEvent[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateOrderInput = {
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLocation?: PublicOrderLocation | null;
  dropoffLocation?: PublicOrderLocation | null;
  amountJod?: number;
  isCod?: boolean;
  notes?: string;
};

export type CompleteIssuedProfileInput = {
  fullName: string;
  phoneNumber: string;
  defaultLocation: PublicOrderLocation;
  locationNote?: string;
  altPhoneNumber?: string;
};
