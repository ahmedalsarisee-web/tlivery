import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  FC,
  PropsWithChildren,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import i18n from '@app/I18n';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {getDeviceLanguage} from '@app/utils/deviceLocale';
import {LangDirection} from '@app/enums/LangDirection';

type LangCode = 'en' | 'ar';
export type LangPreference = LangCode | 'system';

interface LangContextValue {
  language: LangCode;
  languagePreference: LangPreference;
  direction: LangDirection;
  changeLanguage: (pref?: LangPreference) => Promise<void>;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

const directionFor = (lng: LangCode): LangDirection =>
  lng === 'ar' ? LangDirection.RTL : LangDirection.LTR;

const readStoredPreference = (): LangPreference => {
  const stored = storage.getString(StorageKeys.LANGUAGE);
  if (stored === 'en' || stored === 'ar' || stored === 'system') {
    return stored;
  }
  return 'ar';
};

const resolveEffectiveLanguage = (pref: LangPreference): LangCode =>
  pref === 'system' ? getDeviceLanguage('ar') : pref;

export const LangProvider: FC<PropsWithChildren> = ({children}) => {
  const [languagePreference, setLanguagePreference] = useState<LangPreference>(
    readStoredPreference,
  );
  const [systemLocaleRevision, setSystemLocaleRevision] = useState(0);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && languagePreference === 'system') {
        setSystemLocaleRevision(n => n + 1);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [languagePreference]);

  const language = useMemo(() => {
    void systemLocaleRevision;
    return resolveEffectiveLanguage(languagePreference);
  }, [languagePreference, systemLocaleRevision]);

  useEffect(() => {
    if (i18n.language === language) {
      return;
    }
    void i18n.changeLanguage(language).catch(() => {});
  }, [language]);

  const changeLanguage = useCallback(async (pref: LangPreference = 'system') => {
    storage.set(StorageKeys.LANGUAGE, pref);
    setLanguagePreference(pref);
    if (pref === 'system') {
      setSystemLocaleRevision(n => n + 1);
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      language,
      languagePreference,
      direction: directionFor(language),
      changeLanguage,
    }),
    [language, languagePreference, changeLanguage],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLanguage = (): LangContextValue => {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LangProvider');
  }
  return ctx;
};
