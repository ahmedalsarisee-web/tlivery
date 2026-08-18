import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onIdTokenChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import type {AuthRepository, AuthRole, AuthUser} from '../auth/auth.types';
import type {UserProfile} from '../models/workflow';
import {firebaseAuth, firestore} from './firebaseApp';

export class UnauthorizedAdminError extends Error {
  constructor() {
    super('The authenticated account has no supported Wasel role');
    this.name = 'UnauthorizedAdminError';
  }
}

const ROLES: AuthRole[] = [
  'applicant',
  'super_admin',
  'company_admin',
  'company_employee',
  'client',
  'merchant',
  'driver',
];

const toAuthUser = async (
  user: User,
  forceRefresh = false,
): Promise<AuthUser> => {
  const token = await getIdTokenResult(user, forceRefresh);
  const claimRole = token.claims.role;
  const role =
    typeof claimRole === 'string' && ROLES.includes(claimRole as AuthRole)
      ? (claimRole as AuthRole)
      : 'applicant';
  const companyId =
    typeof token.claims.companyId === 'string' ? token.claims.companyId : null;
  const snapshot = await getDoc(doc(firestore, 'users', user.uid)).catch(
    () => null,
  );
  const raw = snapshot?.exists() ? snapshot.data() : null;
  const profile = raw
    ? ({
        uid: snapshot!.id,
        displayName:
          typeof raw.displayName === 'string' ? raw.displayName : '',
        fullName:
          typeof raw.fullName === 'string' && raw.fullName.trim()
            ? raw.fullName.trim()
            : null,
        email: typeof raw.email === 'string' ? raw.email : user.email ?? '',
        phone:
          typeof raw.phoneNumber === 'string'
            ? raw.phoneNumber
            : typeof raw.phone === 'string'
              ? raw.phone
              : undefined,
        phoneNumber:
          typeof raw.phoneNumber === 'string' ? raw.phoneNumber : null,
        altPhoneNumber:
          typeof raw.altPhoneNumber === 'string' ? raw.altPhoneNumber : null,
        status: raw.status as UserProfile['status'],
        permissions: Array.isArray(raw.permissions)
          ? (raw.permissions as string[])
          : [],
        role: typeof raw.role === 'string' ? raw.role : undefined,
        companyId:
          typeof raw.companyId === 'string' ? raw.companyId : null,
        profileComplete: raw.profileComplete === true,
        defaultLocation:
          raw.defaultLocation && typeof raw.defaultLocation === 'object'
            ? (raw.defaultLocation as UserProfile['defaultLocation'])
            : null,
      } satisfies UserProfile)
    : null;

  const profileRole =
    typeof profile?.role === 'string' && ROLES.includes(profile.role as AuthRole)
      ? (profile.role as AuthRole)
      : null;
  const resolvedRole = profileRole ?? role;
  const resolvedCompanyId =
    (typeof profile?.companyId === 'string' ? profile.companyId : null) ??
    companyId;

  if (
    (resolvedRole === 'company_admin' || resolvedRole === 'company_employee') &&
    !resolvedCompanyId
  ) {
    throw new UnauthorizedAdminError();
  }

  const displayName =
    profile?.fullName?.trim() ||
    profile?.displayName?.trim() ||
    user.displayName ||
    user.email ||
    'Wasel User';

  return {
    id: user.uid,
    name: displayName,
    email: user.email ?? '',
    emailVerified: user.emailVerified,
    role: resolvedRole,
    companyId: resolvedCompanyId,
    status: profile?.status,
    profile,
  };
};

export class FirebaseAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthUser> {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim().toLowerCase(),
      password,
    );

    try {
      return await toAuthUser(credential.user);
    } catch (error) {
      await signOut(firebaseAuth);
      throw error;
    }
  }

  async register(
    displayName: string,
    email: string,
    password: string,
  ): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email.trim().toLowerCase(),
      password,
    );
    await updateProfile(credential.user, {displayName: displayName.trim()});
    await sendEmailVerification(credential.user);
    return toAuthUser(credential.user);
  }

  async resendVerificationEmail(): Promise<void> {
    if (!firebaseAuth.currentUser) {
      throw new UnauthorizedAdminError();
    }
    await sendEmailVerification(firebaseAuth.currentUser);
  }

  async refreshUser(): Promise<AuthUser | null> {
    if (!firebaseAuth.currentUser) {
      return null;
    }
    await reload(firebaseAuth.currentUser);
    return toAuthUser(firebaseAuth.currentUser, true);
  }

  logout(): Promise<void> {
    return signOut(firebaseAuth);
  }

  observe(listener: (user: AuthUser | null) => void): () => void {
    return onIdTokenChanged(firebaseAuth, user => {
      if (!user) {
        listener(null);
        return;
      }

      toAuthUser(user)
        .then(listener)
        .catch(async () => {
          await signOut(firebaseAuth);
          listener(null);
        });
    });
  }
}
