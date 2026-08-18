import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {useTranslation} from 'react-i18next';
import {
  applyDocumentLanguage,
  persistLanguage,
  readStoredLanguage,
  type AppLanguage,
} from './index';

type LangContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  changeLanguage: (lang: AppLanguage) => Promise<void>;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({children}: {children: ReactNode}) {
  const {i18n} = useTranslation();
  const [language, setLanguage] = useState<AppLanguage>(() =>
    readStoredLanguage(),
  );

  const changeLanguage = useCallback(
    async (lang: AppLanguage) => {
      await i18n.changeLanguage(lang);
      persistLanguage(lang);
      applyDocumentLanguage(lang);
      setLanguage(lang);
    },
    [i18n],
  );

  const value = useMemo(
    () => ({
      language,
      isRTL: language === 'ar',
      changeLanguage,
    }),
    [language, changeLanguage],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LangProvider');
  }
  return ctx;
}
