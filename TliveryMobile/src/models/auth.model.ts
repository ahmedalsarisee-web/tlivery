import type {UserRole} from '@app/types/user';

export interface AuthUser {
  id: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  emailVerified: boolean;
  role: UserRole | null;
  companyId: string | null;
  providerIds: string[];
}

export interface AuthSession {
  user: AuthUser;
  issuedAt: string | null;
  expiresAt: string | null;
}
