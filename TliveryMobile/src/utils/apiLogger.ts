type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
};

const sanitizeError = (error: unknown) => {
  const value = error as ErrorLike & {
    details?: unknown;
    nativeErrorMessage?: unknown;
  };
  const message =
    typeof value?.message === 'string'
      ? value.message
      : 'No error message provided';
  return {
    name: typeof value?.name === 'string' ? value.name : 'UnknownError',
    code: typeof value?.code === 'string' ? value.code : 'unknown',
    message,
    details: value?.details,
  };
};

export const apiLogger = {
  info(event: string): void {
    if (__DEV__) {
      console.info(`[API] ${event}`);
    }
  },

  error(event: string, error: unknown): void {
    if (__DEV__) {
      const sanitized = sanitizeError(error);
      const raw =
        error && typeof error === 'object'
          ? {
              ...sanitized,
              nativeErrorCode:
                'nativeErrorCode' in error
                  ? (error as {nativeErrorCode?: unknown}).nativeErrorCode
                  : undefined,
              nativeErrorMessage:
                'nativeErrorMessage' in error
                  ? (error as {nativeErrorMessage?: unknown}).nativeErrorMessage
                  : undefined,
              userInfo:
                'userInfo' in error
                  ? (error as {userInfo?: unknown}).userInfo
                  : undefined,
            }
          : sanitized;
      console.error(`[API] ${event}`, raw);
    }
  },
};
