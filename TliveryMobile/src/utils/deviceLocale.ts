import {getLocales} from 'expo-localization';

export type SupportedLanguage = 'en' | 'ar';

export const getDeviceLanguage = (
  fallback: SupportedLanguage = 'ar',
): SupportedLanguage => {
  try {
    for (const locale of getLocales()) {
      const code = locale.languageCode?.toLowerCase();
      if (code === 'en' || code === 'ar') {
        return code;
      }
    }
  } catch {
    // Fall through to default.
  }
  return fallback;
};
