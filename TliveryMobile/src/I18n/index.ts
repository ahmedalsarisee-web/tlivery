import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {getDeviceLanguage, SupportedLanguage} from '@app/utils/deviceLocale';
import en from './en/translation.json';
import ar from './ar/translation.json';

export const resources = {
  en: {translation: en},
  ar: {translation: ar},
} as const;


export const resolveInitialLanguage = (): SupportedLanguage => {
  const pref = storage.getString(StorageKeys.LANGUAGE);
  if (pref === 'en' || pref === 'ar') {
    return pref;
  }

  return getDeviceLanguage('ar');
};

let initialized = false;


export const initI18n = async (): Promise<typeof i18n> => {
  if (initialized) {
    return i18n;
  }
  initialized = true;

  await i18n.use(initReactI18next).init({
    resources,
    lng: resolveInitialLanguage(),
    fallbackLng: 'ar',

    keySeparator: false,
    nsSeparator: false,
    interpolation: {escapeValue: false},

    react: {useSuspense: false},
  });

  return i18n;
};

export default i18n;
