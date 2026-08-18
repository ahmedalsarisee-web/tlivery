export const COMPANY_PERMISSIONS = [
  'orders:read',
  'orders:write',
  'drivers:manage',
  'merchants:read',
  'merchants:manage',
  'customers:manage',
  'accounts:read',
  'accounts:write',
  'reports:read',
  'employees:manage',
] as const;

export type CompanyPermission = (typeof COMPANY_PERMISSIONS)[number];

/** Sensible defaults for a new office employee (view + assign orders). */
export const DEFAULT_EMPLOYEE_PERMISSIONS: CompanyPermission[] = [
  'orders:read',
  'orders:write',
];

export const isCompanyPermission = (
  value: string,
): value is CompanyPermission =>
  (COMPANY_PERMISSIONS as readonly string[]).includes(value);

export const sanitizePermissions = (values: unknown): CompanyPermission[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set<CompanyPermission>();
  for (const item of values) {
    if (typeof item === 'string' && isCompanyPermission(item)) {
      unique.add(item);
    }
  }
  return [...unique];
};
