import type {Timestamp} from 'firebase/firestore';
import type {PublicOrderLocation} from '@app/constants/jordanLocations';
import type {UserAccountStatus} from '@app/models/user-profile.model';
import type {UserRole} from '@app/types/user';

export interface UserDocument {
  displayName: string;
  fullName?: string | null;
  email: string | null;
  phoneNumber: string | null;
  altPhoneNumber?: string | null;
  role: UserRole | null;
  status: UserAccountStatus;
  companyId: string | null;
  permissions?: string[];
  profileComplete?: boolean;
  defaultLocation?: PublicOrderLocation | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
}
