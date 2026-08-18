import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {authService} from '../services/authService';
import type {AuthUser, LoginResult} from './auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<LoginResult>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.observe(nextUser => {
      setUser(nextUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.ok) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const result = await authService.register(displayName, email, password);
      if (result.ok) {
        setUser(result.user);
      }
      return result;
    },
    [],
  );

  const resendVerificationEmail = useCallback(
    () => authService.resendVerificationEmail(),
    [],
  );

  const refreshUser = useCallback(async () => {
    const nextUser = await authService.refreshUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      resendVerificationEmail,
      refreshUser,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      register,
      resendVerificationEmail,
      refreshUser,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
