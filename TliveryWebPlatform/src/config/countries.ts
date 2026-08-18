export type CountryIso = 'JO' | 'SA' | 'AE' | 'QA';

export type CountryConfig = {
  iso: CountryIso;
  dialCode: string;
  nationalLength: number;
  flag: string;
  nameKey: string;
  cities?: string[];
};

export const DEFAULT_COUNTRY_ISO: CountryIso = 'JO';

export const COUNTRY_STORAGE_KEY = 'wasel.countryIso';

export const COUNTRIES: CountryConfig[] = [
  {
    iso: 'JO',
    dialCode: '+962',
    nationalLength: 9,
    flag: '🇯🇴',
    nameKey: 'countryJordan',
    cities: ['Amman', 'Irbid', 'Zarqa', 'Aqaba'],
  },
  {
    iso: 'SA',
    dialCode: '+966',
    nationalLength: 9,
    flag: '🇸🇦',
    nameKey: 'countrySaudiArabia',
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'],
  },
  {
    iso: 'AE',
    dialCode: '+971',
    nationalLength: 9,
    flag: '🇦🇪',
    nameKey: 'countryUnitedArabEmirates',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  },
  {
    iso: 'QA',
    dialCode: '+974',
    nationalLength: 8,
    flag: '🇶🇦',
    nameKey: 'countryQatar',
    cities: ['Doha', 'Al Rayyan', 'Al Wakrah'],
  },
];

const byIso = Object.fromEntries(
  COUNTRIES.map(country => [country.iso, country]),
) as Record<CountryIso, CountryConfig>;

export const isCountryIso = (value: string | null | undefined): value is CountryIso =>
  !!value && value in byIso;

export const getCountry = (iso: string | null | undefined): CountryConfig => {
  if (isCountryIso(iso)) {
    return byIso[iso];
  }
  return byIso[DEFAULT_COUNTRY_ISO];
};

const dialDigits = (dialCode: string): string => dialCode.replace(/\D/g, '');

export const normalizeNationalDigits = (
  iso: string | null | undefined,
  raw: string,
): string => {
  const country = getCountry(iso);
  const dial = dialDigits(country.dialCode);
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith(`00${dial}`)) {
    digits = digits.slice(2 + dial.length);
  } else if (digits.startsWith(dial)) {
    digits = digits.slice(dial.length);
  }

  return digits.replace(/^0/, '').slice(0, country.nationalLength);
};

export const toE164 = (
  iso: string | null | undefined,
  nationalDigits: string,
): string => {
  const country = getCountry(iso);
  return `${country.dialCode}${normalizeNationalDigits(iso, nationalDigits)}`;
};

export const isValidNationalNumber = (
  iso: string | null | undefined,
  nationalDigits: string,
): boolean => {
  const country = getCountry(iso);
  return normalizeNationalDigits(iso, nationalDigits).length === country.nationalLength;
};

export const phonePlaceholder = (iso: string | null | undefined): string => {
  const length = getCountry(iso).nationalLength;
  return `${'7'}${'X'.repeat(Math.max(length - 1, 0))}`;
};

export const readStoredCountryIso = (): CountryIso | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
  return isCountryIso(stored) ? stored : null;
};

export const writeStoredCountryIso = (iso: CountryIso): void => {
  localStorage.setItem(COUNTRY_STORAGE_KEY, iso);
};
