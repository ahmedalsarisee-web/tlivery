import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY_ISO,
  getCountry,
  isCountryIso,
  type CountryConfig,
  type CountryIso,
} from '@app/config/countries';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';

type CountryContextValue = {
  country: CountryConfig;
  countryIso: CountryIso;
  countries: CountryConfig[];
  hasSelectedCountry: boolean;
  setCountry: (iso: CountryIso) => void;
};

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

const readStoredIso = (): CountryIso | null => {
  const stored = storage.getString(StorageKeys.COUNTRY_ISO);
  return isCountryIso(stored) ? stored : null;
};

export const CountryProvider: FC<PropsWithChildren> = ({children}) => {
  const [storedIso, setStoredIso] = useState<CountryIso | null>(readStoredIso);

  const setCountry = useCallback((iso: CountryIso) => {
    storage.set(StorageKeys.COUNTRY_ISO, iso);
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
};

export const useCountry = (): CountryContextValue => {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error('useCountry must be used within CountryProvider');
  }
  return ctx;
};
