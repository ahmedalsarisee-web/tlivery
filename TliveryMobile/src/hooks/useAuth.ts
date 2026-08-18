import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {queryKeys} from '@app/constants/queryKeys';
import {services} from '@app/services/dependencies';
import {useUserStore} from '@app/features/user';
import type {AuthSession} from '@app/models/auth.model';
import type {
  EmailLoginInput,
  EmailRegistrationInput,
  ForgotPasswordInput,
  PhonePasswordLoginInput,
  RegisterDriverAccountInput,
  UsernameLoginInput,
} from '@app/types/auth';

export const useAuthSession = () =>
  useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => services.auth.restoreSession(),
    staleTime: Infinity,
  });

export const useEmailLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'email-login'],
    mutationFn: (input: EmailLoginInput) =>
      services.auth.signInWithEmail(input),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const useUsernameLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'username-login'],
    mutationFn: (input: UsernameLoginInput) =>
      services.auth.signInWithUsername(input),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const usePhonePasswordLogin = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'phone-password-login'],
    mutationFn: (input: PhonePasswordLoginInput) =>
      services.auth.signInWithPhonePassword(input),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const useEmailRegistration = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'email-registration'],
    mutationFn: (input: EmailRegistrationInput) =>
      services.auth.registerWithEmail(input),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const useRegisterDriverAccount = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'register-driver-account'],
    mutationFn: (input: RegisterDriverAccountInput) =>
      services.auth.registerDriverAccount(input),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const useSendVerificationEmail = () =>
  useMutation({
    mutationKey: ['auth', 'send-verification-email'],
    mutationFn: () => services.auth.sendVerificationEmail(),
  });

export const useForgotPassword = () =>
  useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: (input: ForgotPasswordInput) =>
      services.auth.sendPasswordReset(input),
  });

export const useRefreshAuthSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'refresh-session'],
    mutationFn: () => services.auth.refreshSession(),
    onSuccess: session => {
      client.setQueryData<AuthSession | null>(queryKeys.auth.session, session);
    },
  });
};

export const useLogout = () => {
  const client = useQueryClient();
  const clearUser = useUserStore(state => state.clearUser);
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: () => services.auth.signOut(),
    onSuccess: () => {
      client.clear();
      clearUser();
    },
  });
};
