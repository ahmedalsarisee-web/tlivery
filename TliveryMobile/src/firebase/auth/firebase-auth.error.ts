export type AuthErrorCode =
  | 'invalid-email'
  | 'invalid-credentials'
  | 'user-disabled'
  | 'user-not-found'
  | 'too-many-requests'
  | 'network-request-failed'
  | 'invalid-phone-number'
  | 'invalid-verification-code'
  | 'verification-session-expired'
  | 'sms-quota-exceeded'
  | 'requires-recent-login'
  | 'no-authenticated-user'
  | 'missing-client-identifier'
  | 'app-not-authorized'
  | 'captcha-check-failed'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly cause?: unknown;

  constructor(code: AuthErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.cause = cause;
  }
}

type FirebaseErrorLike = {
  code?: unknown;
  message?: unknown;
};

const normalizeFirebaseCode = (code: unknown): string =>
  typeof code === 'string' ? code.replace(/^auth\//, '') : '';

export const mapFirebaseAuthError = (error: unknown): AuthError => {
  if (error instanceof AuthError) {
    return error;
  }

  const firebaseError = error as FirebaseErrorLike;
  const firebaseCode = normalizeFirebaseCode(firebaseError?.code);
  const message =
    typeof firebaseError?.message === 'string'
      ? firebaseError.message
      : 'Authentication request failed';

  switch (firebaseCode) {
    case 'invalid-email':
      return new AuthError('invalid-email', message, error);
    case 'invalid-credential':
    case 'wrong-password':
      return new AuthError('invalid-credentials', message, error);
    case 'user-disabled':
      return new AuthError('user-disabled', message, error);
    case 'user-not-found':
      return new AuthError('user-not-found', message, error);
    case 'too-many-requests':
      return new AuthError('too-many-requests', message, error);
    case 'network-request-failed':
      return new AuthError('network-request-failed', message, error);
    case 'invalid-phone-number':
    case 'missing-phone-number':
      return new AuthError('invalid-phone-number', message, error);
    case 'invalid-verification-code':
      return new AuthError('invalid-verification-code', message, error);
    case 'session-expired':
      return new AuthError('verification-session-expired', message, error);
    case 'quota-exceeded':
      return new AuthError('sms-quota-exceeded', message, error);
    case 'requires-recent-login':
      return new AuthError('requires-recent-login', message, error);
    case 'missing-client-identifier':
      return new AuthError('missing-client-identifier', message, error);
    case 'app-not-authorized':
    case 'invalid-app-credential':
      return new AuthError('app-not-authorized', message, error);
    case 'captcha-check-failed':
    case 'missing-recaptcha-token':
      return new AuthError('captcha-check-failed', message, error);
    default:
      return new AuthError('unknown', message, error);
  }
};
