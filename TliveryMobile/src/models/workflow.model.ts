import type {VehicleType} from '@app/features/company/types';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type DriverStatus = 'active' | 'offline' | 'busy' | 'suspended';

export interface CompanyApplication {
  id: string;
  userId: string;
  companyName: string;
  commercialRegistrationNumber: string;
  contactName: string;
  phoneNumber: string;
  email: string;
  city: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  companyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverInvite {
  id: string;
  companyId: string;
  code: string;
  phoneNumber: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ClientInvite {
  id: string;
  companyId: string;
  code: string;
  phoneNumber: string | null;
  phone?: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'open';
  claimedBy?: string | null;
  createdAt: Date | null;
}

export interface CreateClientInviteInput {
  phoneNumber?: string;
  expiresInDays?: number;
  note?: string;
}

export interface RegisterClientWithInviteInput {
  inviteCode: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface GetClientInviteResult {
  inviteCode: string;
  companyName: string;
  status: string;
  available: boolean;
  expiresAt: number | null;
  suggestedPhone: string | null;
}

export interface DriverApplication {
  id: string;
  userId: string;
  companyId: string;
  inviteCode: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  driverId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  userId: string;
  companyId: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
  /** Display name e.g. "Honda PCX" / "Toyota Corolla". */
  vehicleModel: string;
  vehicleColor: string;
  /** Calendar year, e.g. 2020. */
  modelYear: number | null;
  /** ISO date YYYY-MM-DD when insurance expires. */
  insuranceValidUntil: string | null;
  /** Compressed profile photo (Firebase Storage download URL). */
  photoUrl: string | null;
  licenseImageUrl: string | null;
  registrationImageUrl: string | null;
  insuranceImageUrl: string | null;
  status: DriverStatus;
  activeOrders: number;
  rating: number;
  completedOrders: number;
  cancelledOrders: number;
  successRate: number;
  badges: string[];
  experienceStartedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DriverBadge = 'featured' | 'gold';

export interface CompanyIssuedAccount {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  permissions: string[];
  companyId: string;
}

export interface CreateCompanyIssuedAccountInput {
  username: string;
  password: string;
  displayName?: string;
}

export interface ListCompanyIssuedAccountsInput {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  cursor?: string | null;
}

export interface ListCompanyIssuedAccountsResult {
  items: CompanyIssuedAccount[];
  total: number;
  page?: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface SubmitCompanyApplicationInput {
  companyName: string;
  commercialRegistrationNumber: string;
  contactName: string;
  phoneNumber: string;
  email: string;
  city: string;
}

export interface SubmitDriverApplicationInput {
  inviteCode: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
}

export type AcceptDriverInviteInput = SubmitDriverApplicationInput;

export interface CreateDriverInput {
  fullName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
}

export interface CompanyEmployee {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  status: string;
  permissions: string[];
  companyId: string;
}

export interface CreateCompanyEmployeeInput {
  username: string;
  password: string;
  displayName?: string;
  permissions: string[];
}

export interface UpdateCompanyEmployeeInput {
  employeeId: string;
  displayName?: string;
  permissions?: string[];
  status?: 'active' | 'suspended' | 'disabled';
}

export interface UpdateCompanyDriverInput {
  driverId: string;
  fullName?: string;
  vehicleType?: VehicleType;
  plateNumber?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  modelYear?: number | null;
  insuranceValidUntil?: string | null;
  status?: DriverStatus;
  photoUrl?: string | null;
  licenseImageUrl?: string | null;
  registrationImageUrl?: string | null;
  insuranceImageUrl?: string | null;
}

/** Driver self-service vehicle update (authenticated driver only). */
export interface UpdateMyVehicleInput {
  vehicleType?: VehicleType;
  plateNumber?: string;
  licenseNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  modelYear?: number | null;
  insuranceValidUntil?: string | null;
  photoUrl?: string | null;
  licenseImageUrl?: string | null;
  registrationImageUrl?: string | null;
  insuranceImageUrl?: string | null;
}

export interface ListCompanyEmployeesInput {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  cursor?: string | null;
}

export interface ListCompanyEmployeesResult {
  employees: CompanyEmployee[];
  total: number;
  page?: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
}
