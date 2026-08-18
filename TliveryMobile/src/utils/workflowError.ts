function readErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof (error as {code?: unknown}).code === 'string'
  ) {
    return (error as {code: string}).code.replace(/^(auth|functions)\//, '');
  }
  return '';
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as {message?: unknown}).message === 'string'
  ) {
    return (error as {message: string}).message;
  }
  return '';
}

export function getWorkflowErrorTranslationKey(error: unknown): string {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  if (code === 'already-exists') {
    if (message.includes('username')) {
      return 'workflowErrorUsernameTaken';
    }
    if (message.includes('phone')) {
      return 'authErrorPhoneAlreadyRegistered';
    }
    return 'workflowErrorAlreadyExists';
  }

  if (code === 'not-found') {
    if (message.includes('invite')) {
      return 'clientInviteNotFound';
    }
  }

  if (code === 'permission-denied') {
    if (message.includes('phone')) {
      return 'clientInvitePhoneMismatch';
    }
    return 'workflowErrorPermissionDenied';
  }

  if (code === 'invalid-argument') {
    if (
      message.includes('at least one') ||
      message.includes('order detail')
    ) {
      return 'orderFormAtLeastOne';
    }
    if (message.includes('password')) {
      return 'clientInvitePasswordHint';
    }
    if (message.includes('phone')) {
      return 'authErrorInvalidPhone';
    }
    if (message.includes('full') || message.includes('name')) {
      return 'clientInviteFullNameHint';
    }
    return 'workflowErrorInvalidInput';
  }

  if (code === 'failed-precondition') {
    if (
      message.includes('invitation') ||
      message.includes('invite') ||
      message.includes('expired')
    ) {
      return 'clientInviteAlreadyUsed';
    }
    if (message.includes('cannot submit a company application')) {
      return 'workflowErrorCannotSubmitCompanyApplication';
    }
    if (message.includes('already bound to a company')) {
      return 'workflowErrorAlreadyBoundToCompany';
    }
    if (message.includes('verify an email') || message.includes('phone number before applying')) {
      return 'verifyEmailBeforeSubmit';
    }
    return 'workflowErrorPreconditionFailed';
  }

  if (code === 'resource-exhausted') {
    return 'otpSendCooldown';
  }

  if (code === 'unavailable') {
    return 'otpSendFailed';
  }

  return 'workflowRequestFailed';
}
