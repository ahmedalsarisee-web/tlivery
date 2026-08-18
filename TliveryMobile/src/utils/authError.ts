import {AuthError} from '@app/firebase/auth/firebase-auth.error';

const ERROR_KEYS: Record<string, string> = {
  'invalid-email': 'authErrorInvalidEmail',
  'invalid-credentials': 'authErrorInvalidCredentials',
  'user-disabled': 'authErrorUserDisabled',
  'user-not-found': 'authErrorUserNotFound',
  'too-many-requests': 'authErrorTooManyRequests',
  'network-request-failed': 'authErrorNetwork',
  'invalid-phone-number': 'authErrorInvalidPhone',
  'weak-password': 'authErrorWeakPassword',
  'already-exists': 'authErrorPhoneAlreadyRegistered',
  'requires-recent-login': 'authErrorRecentLogin',
  'no-authenticated-user': 'authErrorNoSession',
  unknown: 'authErrorUnknown',
};

export const getAuthErrorTranslationKey = (error: unknown): string => {
  if (error instanceof AuthError) {
    return ERROR_KEYS[error.code] ?? ERROR_KEYS.unknown;
  }

  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof (error as {code?: unknown}).code === 'string'
  ) {
    const raw = (error as {code: string}).code.replace(
      /^(auth|functions)\//,
      '',
    );
    if (ERROR_KEYS[raw]) {
      return ERROR_KEYS[raw];
    }
  }

  if (error instanceof Error && error.message.startsWith('auth/')) {
    const code = error.message.replace(/^auth\//, '');
    if (code === 'missing-password') {
      return 'loginPasswordRequired';
    }
    if (code === 'missing-username') {
      return 'loginUsernameRequired';
    }
    return ERROR_KEYS[code] ?? ERROR_KEYS.unknown;
  }

  return ERROR_KEYS.unknown;
};
