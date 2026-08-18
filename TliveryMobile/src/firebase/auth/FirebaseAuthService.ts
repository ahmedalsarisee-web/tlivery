import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onIdTokenChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
  updateProfile,
} from 'firebase/auth';
import type {AuthSession, AuthUser} from '@app/models/auth.model';
import {firebaseAuth} from '@app/firebase/firebaseApp';
import type {
  AuthSessionListener,
  EmailLoginInput,
  EmailRegistrationInput,
  ForgotPasswordInput,
} from '@app/types/auth';
import type {UserRole} from '@app/types/user';
import {apiLogger} from '@app/utils/apiLogger';
import {AuthError, mapFirebaseAuthError} from './firebase-auth.error';

const USER_ROLES: ReadonlySet<UserRole> = new Set([
  'super_admin',
  'company_admin',
  'company_employee',
  'driver',
  'client',
  'merchant',
]);

const parseRole = (value: unknown): UserRole | null =>
  typeof value === 'string' && USER_ROLES.has(value as UserRole)
    ? (value as UserRole)
    : null;

const parseCompanyId = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;

export class FirebaseAuthService {
  private readonly auth = firebaseAuth;

  async registerWithEmail(input: EmailRegistrationInput): Promise<AuthSession> {
    apiLogger.info('auth.registerWithEmail.started');
    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        input.email.trim().toLowerCase(),
        input.password,
      );
      await updateProfile(credential.user, {displayName: input.displayName.trim()});
      await sendEmailVerification(credential.user);
      apiLogger.info('auth.registerWithEmail.succeeded');
      return this.toSession(credential.user);
    } catch (error) {
      apiLogger.error('auth.registerWithEmail.failed', error);
      throw mapFirebaseAuthError(error);
    }
  }

  async sendVerificationEmail(): Promise<void> {
    const user = this.requireCurrentUser();
    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async signInWithEmail(input: EmailLoginInput): Promise<AuthSession> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        input.email.trim().toLowerCase(),
        input.password,
      );
      return this.toSession(credential.user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async sendPasswordReset(input: ForgotPasswordInput): Promise<void> {
    try {
      await sendPasswordResetEmail(
        this.auth,
        input.email.trim().toLowerCase(),
      );
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async restoreSession(): Promise<AuthSession | null> {
    try {
      await Promise.race([
        this.auth.authStateReady(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('auth-state-timeout')), 8000);
        }),
      ]);
      return this.auth.currentUser
        ? await this.toSession(this.auth.currentUser)
        : null;
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async refreshSession(): Promise<AuthSession> {
    const user = this.requireCurrentUser();

    try {
      await reload(user);
      return await this.toSession(user, true);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  private requireCurrentUser(): User {
    const user = this.auth.currentUser;
    if (!user) {
      throw new AuthError(
        'no-authenticated-user',
        'No authenticated user exists',
      );
    }
    return user;
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  observeSession(listener: AuthSessionListener): () => void {
    return onIdTokenChanged(this.auth, user => {
      if (!user) {
        listener(null);
        return;
      }

      this.toSession(user)
        .then(listener)
        .catch(() => listener(null));
    });
  }

  private async toSession(
    user: User,
    forceRefresh = false,
  ): Promise<AuthSession> {
    const tokenResult = await getIdTokenResult(user, forceRefresh);
    const role = parseRole(tokenResult.claims.role);
    const companyId = parseCompanyId(tokenResult.claims.companyId);

    const authUser: AuthUser = {
      id: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoUrl: user.photoURL,
      emailVerified: user.emailVerified,
      role,
      companyId,
      providerIds: user.providerData.map(provider => provider.providerId),
    };

    return {
      user: authUser,
      issuedAt: tokenResult.issuedAtTime ?? null,
      expiresAt: tokenResult.expirationTime ?? null,
    };
  }
}
