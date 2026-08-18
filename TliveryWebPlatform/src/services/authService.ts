import {FirebaseError} from 'firebase/app';
import {httpsCallable} from 'firebase/functions';
import type {AuthRepository, AuthUser, LoginResult} from '../auth/auth.types';
import {
  FirebaseAuthRepository,
  UnauthorizedAdminError,
} from '../firebase/FirebaseAuthRepository';
import {firebaseFunctions} from '../firebase/firebaseApp';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<LoginResult> {
    try {
      const trimmed = identifier.trim();
      let email = trimmed.toLowerCase();
      if (!EMAIL_PATTERN.test(email)) {
        const resolve = httpsCallable<{username: string}, {email: string}>(
          firebaseFunctions,
          'resolveLoginEmail',
        );
        const result = await resolve({username: trimmed.toLowerCase()});
        email = result.data.email.trim().toLowerCase();
      }
      const user = await this.repository.login(email, password);
      return {ok: true, user};
    } catch (error) {
      if (error instanceof UnauthorizedAdminError) {
        return {ok: false, error: 'unauthorized'};
      }
      if (
        error instanceof FirebaseError &&
        [
          'auth/invalid-credential',
          'auth/invalid-email',
          'auth/user-disabled',
          'auth/user-not-found',
          'auth/wrong-password',
          'functions/not-found',
        ].includes(error.code)
      ) {
        return {ok: false, error: 'invalid_credentials'};
      }
      return {ok: false, error: 'unknown'};
    }
  }

  async register(
    displayName: string,
    email: string,
    password: string,
  ): Promise<LoginResult> {
    try {
      const user = await this.repository.register(
        displayName,
        email,
        password,
      );
      return {ok: true, user};
    } catch {
      return {ok: false, error: 'unknown'};
    }
  }

  resendVerificationEmail(): Promise<void> {
    return this.repository.resendVerificationEmail();
  }

  refreshUser(): Promise<AuthUser | null> {
    return this.repository.refreshUser();
  }

  logout(): Promise<void> {
    return this.repository.logout();
  }

  observe(listener: (user: AuthUser | null) => void): () => void {
    return this.repository.observe(listener);
  }
}

export const authService = new AuthService(new FirebaseAuthRepository());
