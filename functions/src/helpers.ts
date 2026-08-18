export const ROLES = [
  "super_admin",
  "company_admin",
  "company_employee",
  "driver",
  "client",
  "merchant",
] as const;

export const COMPANY_PERMISSIONS = [
  "orders:read",
  "orders:write",
  "drivers:manage",
  "merchants:read",
  "merchants:manage",
  "customers:manage",
  "accounts:read",
  "accounts:write",
  "reports:read",
  "employees:manage",
] as const;

export type CompanyPermission = (typeof COMPANY_PERMISSIONS)[number];

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export const COMPANY_STATUSES = ["active", "suspended"] as const;
export const INVITE_STATUSES = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const;
export const DRIVER_STATUSES = ["active", "suspended"] as const;
export const USER_STATUSES = [
  "pending",
  "active",
  "suspended",
  "disabled",
] as const;

export class InputError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "InputError";
  }
}

export function sanitizePermissions(values: unknown): CompanyPermission[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const allowed = new Set<string>(COMPANY_PERMISSIONS);
  const unique = new Set<CompanyPermission>();
  for (const item of values) {
    if (typeof item === "string" && allowed.has(item)) {
      unique.add(item as CompanyPermission);
    }
  }
  return [...unique];
}

export function normalizedUsername(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(normalized)) {
    throw new InputError(
      "username",
      "Username must be 3-32 characters (letters, numbers, . _ -).",
    );
  }
  return normalized;
}

export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError("input", "Input must be an object.");
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  input: Record<string, unknown>,
  field: string,
  maxLength = 200,
): string {
  const value = input[field];
  if (typeof value !== "string") {
    throw new InputError(field, `${field} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new InputError(
      field,
      `${field} must contain 1-${maxLength} characters.`,
    );
  }
  return normalized;
}

export function optionalString(
  input: Record<string, unknown>,
  field: string,
  maxLength = 500,
): string | null {
  const value = input[field];
  if (value === undefined || value === null || value === "") return null;
  return requiredString(input, field, maxLength);
}

export function normalizedPhone(value: string): string {
  const normalized = value.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new InputError("phoneNumber", "Use E.164 format, for example +9627…");
  }
  return normalized;
}

export function normalizedInviteCode(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Prefer strict alphabet used when issuing codes; still accept legacy variants.
  if (!/^[A-Z0-9]{6,12}$/.test(normalized)) {
    throw new InputError(
      "inviteCode",
      "inviteCode must be 6-12 letters or digits.",
    );
  }
  return normalized;
}

export function stableApplicationId(prefix: string, uid: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
    throw new InputError("uid", "Invalid authenticated user identifier.");
  }
  return `${prefix}_${uid}`;
}

export function assertPendingTransition(
  current: unknown,
  target: "approved" | "rejected",
): "apply" | "already_applied" {
  if (current === target) return "already_applied";
  if (current !== "pending") {
    throw new InputError(
      "status",
      `Cannot transition application from ${String(current)} to ${target}.`,
    );
  }
  return "apply";
}

export function randomInviteCode(randomBytes: Buffer): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  if (randomBytes.length < 8) {
    throw new InputError("randomBytes", "At least 8 random bytes are required.");
  }
  return Array.from(randomBytes.subarray(0, 8), (byte) =>
    alphabet.charAt(byte % alphabet.length),
  ).join("");
}
