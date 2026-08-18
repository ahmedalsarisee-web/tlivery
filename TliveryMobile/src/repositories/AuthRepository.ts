import type {AuthSession} from '@app/models/auth.model';
import type {
  AuthSessionListener,
  EmailLoginInput,
  EmailRegistrationInput,
  ForgotPasswordInput,
} from '@app/types/auth';

export interface AuthRepository {
  registerWithEmail(input: EmailRegistrationInput): Promise<AuthSession>;
  signInWithEmail(input: EmailLoginInput): Promise<AuthSession>;
  sendVerificationEmail(): Promise<void>;
  sendPasswordReset(input: ForgotPasswordInput): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession>;
  signOut(): Promise<void>;
  observeSession(listener: AuthSessionListener): () => void;
}
