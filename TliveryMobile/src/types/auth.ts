import type {AuthSession} from '@app/models/auth.model';

export interface EmailLoginInput {
  email: string;
  password: string;
}

export interface UsernameLoginInput {
  username: string;
  password: string;
}

export interface EmailRegistrationInput extends EmailLoginInput {
  displayName: string;
}

export interface PhonePasswordLoginInput {
  phoneNumber: string;
  password: string;
}

export interface RegisterDriverAccountInput {
  phoneNumber: string;
  password: string;
  displayName?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export type AuthSessionListener = (session: AuthSession | null) => void;

export interface AuthOperations {
  registerWithEmail(input: EmailRegistrationInput): Promise<AuthSession>;
  registerDriverAccount(
    input: RegisterDriverAccountInput,
  ): Promise<AuthSession>;
  signInWithEmail(input: EmailLoginInput): Promise<AuthSession>;
  signInWithPhonePassword(
    input: PhonePasswordLoginInput,
  ): Promise<AuthSession>;
  sendVerificationEmail(): Promise<void>;
  sendPasswordReset(input: ForgotPasswordInput): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession>;
  signOut(): Promise<void>;
  observeSession(listener: AuthSessionListener): () => void;
}
