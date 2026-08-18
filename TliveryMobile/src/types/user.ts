export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'company_employee'
  | 'driver'
  | 'client'
  | 'merchant';

export interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole | null;
  companyCode: string | null;
  companyId: string | null;
  /** Company employee permission keys from Firestore (admins ignore — full access). */
  permissions: string[];
  status: 'pending' | 'active' | 'suspended' | 'disabled' | null;
  emailVerified: boolean;
  profileReady: boolean;
  authReady: boolean;
  profileComplete: boolean;
  fullName: string | null;
}
