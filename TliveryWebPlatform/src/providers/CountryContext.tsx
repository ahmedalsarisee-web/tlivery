import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY_ISO,
  getCountry,
  readStoredCountryIso,
  writeStoredCountryIso,
  type CountryConfig,
  type CountryIso,
} from '../config/countries';

type CountryContextValue = {
  country: CountryConfig;
  countryIso: CountryIso;
  countries: CountryConfig[];
  hasSelectedCountry: boolean;
  setCountry: (iso: CountryIso) => void;
};

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

export function CountryProvider({children}: {children: ReactNode}) {
  const [storedIso, setStoredIso] = useState<CountryIso | null>(readStoredCountryIso);

  const setCountry = useCallback((iso: CountryIso) => {
    writeStoredCountryIso(iso);
    setStoredIso(iso);
  }, []);

  const value = useMemo<CountryContextValue>(() => {
    const countryIso = storedIso ?? DEFAULT_COUNTRY_ISO;
    return {
      country: getCountry(countryIso),
      countryIso,
      countries: COUNTRIES,
      hasSelectedCountry: storedIso != null,
      setCountry,
    };
  }, [setCountry, storedIso]);

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error('useCountry must be used within CountryProvider');
  }
  return ctx;
}
