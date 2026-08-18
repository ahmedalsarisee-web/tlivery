import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export type AppLanguage = 'en' | 'ar';

const STORAGE_KEY = 'wasel-web-lang';

export function readStoredLanguage(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ar') {
    return stored;
  }
  return 'ar';
}

export function persistLanguage(lang: AppLanguage) {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function applyDocumentLanguage(lang: AppLanguage) {
  const rtl = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.dataset.lang = lang;
}

const initial = readStoredLanguage();
applyDocumentLanguage(initial);

void i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    ar: {translation: ar},
  },
  lng: initial,
  fallbackLng: 'ar',
  interpolation: {escapeValue: false},
});

export default i18n;
