import type {AuthSession} from '@app/models/auth.model';
import type {
  AuthSessionListener,
  EmailLoginInput,
  EmailRegistrationInput,
  ForgotPasswordInput,
} from '@app/types/auth';
import {FirebaseAuthService} from '@app/firebase/auth/FirebaseAuthService';
import type {AuthRepository} from './AuthRepository';

export class FirebaseAuthRepository implements AuthRepository {
  constructor(private readonly firebaseAuth: FirebaseAuthService) {}

  registerWithEmail(input: EmailRegistrationInput): Promise<AuthSession> {
    return this.firebaseAuth.registerWithEmail(input);
  }

  signInWithEmail(input: EmailLoginInput): Promise<AuthSession> {
    return this.firebaseAuth.signInWithEmail(input);
  }

  sendVerificationEmail(): Promise<void> {
    return this.firebaseAuth.sendVerificationEmail();
  }

  sendPasswordReset(input: ForgotPasswordInput): Promise<void> {
    return this.firebaseAuth.sendPasswordReset(input);
  }

  restoreSession(): Promise<AuthSession | null> {
    return this.firebaseAuth.restoreSession();
  }

  refreshSession(): Promise<AuthSession> {
    return this.firebaseAuth.refreshSession();
  }

  signOut(): Promise<void> {
    return this.firebaseAuth.signOut();
  }

  observeSession(listener: AuthSessionListener): () => void {
    return this.firebaseAuth.observeSession(listener);
  }
}
