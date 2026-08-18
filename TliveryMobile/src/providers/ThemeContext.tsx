import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState, FC, PropsWithChildren,
} from 'react';
import {useColorScheme} from 'react-native';
import {darkTheme, lightTheme, ThemeType} from '@app/theme/theme';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';

type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  
  theme: ThemeType;
  
  themeType: ThemeMode;
  
  themePreference: ThemePreference;
  
  toggleTheme: () => void;
  
  setTheme: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoredPreference = (): ThemePreference => {
  const stored = storage.getString(StorageKeys.THEME_MODE);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
};

export const ThemeProvider: FC<PropsWithChildren> = ({children}) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    readStoredPreference,
  );

  const persist = useCallback((pref: ThemePreference) => {
    storage.set(StorageKeys.THEME_MODE, pref);
    setThemePreference(pref);
  }, []);


  const themeType: ThemeMode =
    themePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;

  const setTheme = useCallback(
    (pref: ThemePreference) => persist(pref),
    [persist],
  );

  const toggleTheme = useCallback(() => {
    persist(themeType === 'dark' ? 'light' : 'dark');
  }, [persist, themeType]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeType === 'dark' ? darkTheme : lightTheme,
      themeType,
      themePreference,
      toggleTheme,
      setTheme,
    }),
    [themeType, themePreference, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
