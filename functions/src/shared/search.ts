export function normalizeLower(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function tokenizeSearchValue(value: string | null | undefined): string[] {
  return (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06ff]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildSearchTokens(
  values: Array<string | null | undefined>,
): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    for (const token of tokenizeSearchValue(value)) {
      const maxLength = Math.min(token.length, 12);
      for (let index = 1; index <= maxLength; index += 1) {
        unique.add(token.slice(0, index));
      }
    }
    const digits = normalizeDigits(value);
    if (digits) {
      const maxLength = Math.min(digits.length, 12);
      for (let index = 1; index <= maxLength; index += 1) {
        unique.add(digits.slice(0, index));
      }
    }
  }
  return [...unique];
}

export function normalizeDriverDocFields(data: {
  fullName: string;
  phoneNumber: string;
  vehicleType: string;
  plateNumber: string;
  licenseNumber: string;
  vehicleModel?: string;
}) {
  return {
    fullNameLower: normalizeLower(data.fullName),
    phoneDigits: normalizeDigits(data.phoneNumber),
    plateNumberLower: normalizeLower(data.plateNumber),
    licenseNumberLower: normalizeLower(data.licenseNumber),
    searchTokens: buildSearchTokens([
      data.fullName,
      data.phoneNumber,
      data.plateNumber,
      data.licenseNumber,
      data.vehicleType,
      data.vehicleModel,
    ]),
  };
}

export function normalizeIssuedUserDocFields(data: {
  username: string;
  fullName: string;
  email: string | null;
}) {
  return {
    usernameLower: normalizeLower(data.username),
    displayNameLower: normalizeLower(data.fullName),
    emailLower: normalizeLower(data.email),
    searchTokens: buildSearchTokens([data.username, data.fullName, data.email]),
  };
}
