import {getFunctions, httpsCallable} from 'firebase/functions';
import {firebaseApp} from '@app/firebase/firebaseApp';
import type {AuthRepository} from '@app/repositories/AuthRepository';
import type {AuthSession} from '@app/models/auth.model';
import type {
  AuthSessionListener,
  EmailLoginInput,
  EmailRegistrationInput,
  ForgotPasswordInput,
  PhonePasswordLoginInput,
  RegisterDriverAccountInput,
  UsernameLoginInput,
} from '@app/types/auth';
import {withApiLoading} from '@app/utils/apiLoadingVisibility';
import {measureApiCall} from '@app/utils/apiPerf';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  registerWithEmail(input: EmailRegistrationInput): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName.trim();
    if (!EMAIL_PATTERN.test(email)) {
      return Promise.reject(new Error('auth/invalid-email'));
    }
    if (!displayName) {
      return Promise.reject(new Error('auth/missing-display-name'));
    }
    if (input.password.length < 8) {
      return Promise.reject(new Error('auth/weak-password'));
    }
    return withApiLoading(() =>
      this.repository.registerWithEmail({...input, email, displayName}),
    );
  }

  async registerDriverAccount(
    input: RegisterDriverAccountInput,
  ): Promise<AuthSession> {
    const phoneNumber = input.phoneNumber.replace(/\s+/g, '');
    if (!E164_PATTERN.test(phoneNumber)) {
      return Promise.reject(new Error('auth/invalid-phone-number'));
    }
    if (input.password.length < 8) {
      return Promise.reject(new Error('auth/weak-password'));
    }

    return withApiLoading(async () => {
      const functions = getFunctions(firebaseApp, 'me-central1');
      const register = httpsCallable<
        RegisterDriverAccountInput,
        {uid: string; email: string; phoneNumber: string}
      >(functions, 'registerDriverAccount');
      const result = await measureApiCall(
        'functions.registerDriverAccount',
        () =>
          register({
            phoneNumber,
            password: input.password,
            displayName: input.displayName?.trim() || undefined,
          }),
        {
          method: 'CALLABLE',
          payload: {
            phoneNumber,
            displayName: input.displayName?.trim() || undefined,
          },
        },
      );
      const email = result.data.email?.trim().toLowerCase();
      if (!email || !EMAIL_PATTERN.test(email)) {
        return Promise.reject(new Error('auth/unknown'));
      }
      return this.repository.signInWithEmail({
        email,
        password: input.password,
      });
    });
  }

  signInWithEmail(input: EmailLoginInput): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return Promise.reject(new Error('auth/invalid-email'));
    }
    if (!input.password) {
      return Promise.reject(new Error('auth/missing-password'));
    }
    return withApiLoading(() =>
      this.repository.signInWithEmail({...input, email}),
    );
  }

  async signInWithUsername(input: UsernameLoginInput): Promise<AuthSession> {
    const username = input.username.trim().toLowerCase();
    if (!username) {
      return Promise.reject(new Error('auth/missing-username'));
    }
    if (!input.password) {
      return Promise.reject(new Error('auth/missing-password'));
    }

    return withApiLoading(async () => {
      const functions = getFunctions(firebaseApp, 'me-central1');
      const resolve = httpsCallable<{username: string}, {email: string}>(
        functions,
        'resolveLoginEmail',
      );
      const result = await measureApiCall(
        'functions.resolveLoginEmail',
        () => resolve({username}),
        {method: 'CALLABLE', payload: {username}},
      );
      const email = result.data.email?.trim().toLowerCase();
      if (!email || !EMAIL_PATTERN.test(email)) {
        return Promise.reject(new Error('auth/user-not-found'));
      }

      return this.repository.signInWithEmail({email, password: input.password});
    });
  }

  async signInWithPhonePassword(
    input: PhonePasswordLoginInput,
  ): Promise<AuthSession> {
    const phoneNumber = input.phoneNumber.replace(/\s+/g, '');
    if (!E164_PATTERN.test(phoneNumber)) {
      return Promise.reject(new Error('auth/invalid-phone-number'));
    }
    if (!input.password) {
      return Promise.reject(new Error('auth/missing-password'));
    }

    return withApiLoading(async () => {
      const functions = getFunctions(firebaseApp, 'me-central1');
      const resolve = httpsCallable<
        {phoneNumber: string},
        {email: string; phoneNumber: string}
      >(functions, 'resolveDriverLoginEmail');
      const result = await measureApiCall(
        'functions.resolveDriverLoginEmail',
        () => resolve({phoneNumber}),
        {method: 'CALLABLE', payload: {phoneNumber}},
      );
      const email = result.data.email?.trim().toLowerCase();
      if (!email || !EMAIL_PATTERN.test(email)) {
        return Promise.reject(new Error('auth/user-not-found'));
      }

      return this.repository.signInWithEmail({email, password: input.password});
    });
  }

  sendVerificationEmail(): Promise<void> {
    return withApiLoading(() => this.repository.sendVerificationEmail());
  }

  sendPasswordReset(input: ForgotPasswordInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return Promise.reject(new Error('auth/invalid-email'));
    }
    return withApiLoading(() => this.repository.sendPasswordReset({email}));
  }

  restoreSession(): Promise<AuthSession | null> {
    return this.repository.restoreSession();
  }

  refreshSession(): Promise<AuthSession> {
    return withApiLoading(() => this.repository.refreshSession());
  }

  signOut(): Promise<void> {
    return withApiLoading(() => this.repository.signOut());
  }

  observeSession(listener: AuthSessionListener): () => void {
    return this.repository.observeSession(listener);
  }
}
