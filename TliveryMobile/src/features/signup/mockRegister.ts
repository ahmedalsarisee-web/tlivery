import {
  CompanySignupPayload,
  DriverSignupPayload,
} from './types';

export type RegisterResult =
  | {ok: true; referenceId: string}
  | {ok: false; messageKey: string};

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function registerCompanyMock(
  payload: CompanySignupPayload,
  confirmPassword: string,
): RegisterResult {
  if (
    !isNonEmpty(payload.companyName) ||
    !isNonEmpty(payload.commercialRegister) ||
    !isNonEmpty(payload.contactName) ||
    !isNonEmpty(payload.phone) ||
    !isNonEmpty(payload.city) ||
    !isNonEmpty(payload.password)
  ) {
    return {ok: false, messageKey: 'signupMissingFields'};
  }
  if (!isValidPhone(payload.phone)) {
    return {ok: false, messageKey: 'signupInvalidPhone'};
  }
  if (payload.email.trim() && !payload.email.includes('@')) {
    return {ok: false, messageKey: 'signupInvalidEmail'};
  }
  if (!isValidPassword(payload.password)) {
    return {ok: false, messageKey: 'signupPasswordTooShort'};
  }
  if (payload.password !== confirmPassword) {
    return {ok: false, messageKey: 'signupPasswordMismatch'};
  }

  return {
    ok: true,
    referenceId: `CMP-${Date.now().toString().slice(-6)}`,
  };
}

export function registerDriverMock(
  payload: DriverSignupPayload,
  confirmPassword: string,
): RegisterResult {
  if (
    !isNonEmpty(payload.fullName) ||
    !isNonEmpty(payload.phone) ||
    !isNonEmpty(payload.plateNumber) ||
    !isNonEmpty(payload.licenseNumber) ||
    !isNonEmpty(payload.password)
  ) {
    return {ok: false, messageKey: 'signupMissingFields'};
  }
  if (!isValidPhone(payload.phone)) {
    return {ok: false, messageKey: 'signupInvalidPhone'};
  }
  if (!isValidPassword(payload.password)) {
    return {ok: false, messageKey: 'signupPasswordTooShort'};
  }
  if (payload.password !== confirmPassword) {
    return {ok: false, messageKey: 'signupPasswordMismatch'};
  }

  return {
    ok: true,
    referenceId: `DRV-${Date.now().toString().slice(-6)}`,
  };
}
