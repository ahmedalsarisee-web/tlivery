import type {CompanyPermission} from '../constants/permissions';

export function buildIssuedCredentialsMessage(params: {
  roleLabel: string;
  username: string;
  password: string;
  companyName?: string;
}): string {
  const company = params.companyName?.trim();
  const header = company
    ? `Your ${params.roleLabel} login for ${company} on Tlivery (تليفري)`
    : `Your ${params.roleLabel} login on Tlivery (تليفري)`;
  return `${header}\n\nUsername: ${params.username}\nPassword: ${params.password}\n\nOpen the Tlivery Operations Gateway and sign in with this username and password.`;
}

export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function openWhatsAppText(message: string): void {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export function employeeHasAnyPermission(
  permissions: string[],
  required: CompanyPermission | CompanyPermission[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  return needed.some(item => permissions.includes(item));
}
