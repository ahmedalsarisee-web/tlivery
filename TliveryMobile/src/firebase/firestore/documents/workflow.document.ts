import type {Timestamp} from 'firebase/firestore';
import type {
  ApplicationStatus,
  DriverStatus,
} from '@app/models/workflow.model';
import type {VehicleType} from '@app/features/company/types';

export interface CompanyApplicationDocument {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DriverInviteDocument {
  companyId: string;
  code: string;
  phoneNumber: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface DriverApplicationDocument {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DriverDocument {
  userId: string;
  companyId: string;
  fullName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  modelYear?: number | null;
  insuranceValidUntil?: string | null;
  /** Compressed profile photo download URL. */
  photoUrl?: string | null;
  licenseImageUrl?: string | null;
  registrationImageUrl?: string | null;
  insuranceImageUrl?: string | null;
  status: DriverStatus;
  activeOrders: number;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
