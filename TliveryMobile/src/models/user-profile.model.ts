import type {PublicOrderLocation} from '@app/constants/jordanLocations';
import type {UserRole} from '@app/types/user';

export type UserAccountStatus = 'pending' | 'active' | 'suspended' | 'disabled';

export interface UserProfile {
  id: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  altPhoneNumber: string | null;
  role: UserRole | null;
  status: UserAccountStatus;
  companyId: string | null;
  permissions?: string[];
  profileComplete: boolean;
  defaultLocation: PublicOrderLocation | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
