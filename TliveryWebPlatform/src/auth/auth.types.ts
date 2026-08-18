import type {AccountStatus, UserProfile} from '../models/workflow';

export type AuthRole =
  | 'applicant'
  | 'super_admin'
  | 'company_admin'
  | 'company_employee'
  | 'client'
  | 'merchant'
  | 'driver';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: AuthRole;
  companyId: string | null;
  status?: AccountStatus;
  profile: UserProfile | null;
};

export type LoginResult =
  | {ok: true; user: AuthUser}
  | {ok: false; error: 'invalid_credentials' | 'unauthorized' | 'unknown'};

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthUser>;
  register(
    displayName: string,
    email: string,
    password: string,
  ): Promise<AuthUser>;
  resendVerificationEmail(): Promise<void>;
  refreshUser(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  observe(listener: (user: AuthUser | null) => void): () => void;
}
