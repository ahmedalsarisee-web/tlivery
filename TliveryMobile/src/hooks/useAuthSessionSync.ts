import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '@app/constants/queryKeys';
import {services} from '@app/services/dependencies';
import {useUserStore} from '@app/features/user';
import type {AuthSession} from '@app/models/auth.model';

const isStaffRole = (role: string | null | undefined) =>
  role === 'company_admin' || role === 'company_employee';

export const useAuthSessionSync = (): void => {
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const setProfile = useUserStore(state => state.setProfile);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const unsubscribe = services.auth.observeSession(async session => {
      let nextSession = session;
      setAuthSession(nextSession?.user ?? null);
      queryClient.setQueryData<AuthSession | null>(
        queryKeys.auth.session,
        nextSession,
      );
      if (!nextSession) {
        setProfile(null);
        return;
      }
      try {
        const profile = await services.workflow.repository.getUserProfile(
          nextSession.user.id,
        );
        if (!active || useUserStore.getState().id !== nextSession.user.id) {
          return;
        }

        const claimsOutOfDate =
          Boolean(profile) &&
          (nextSession.user.role !== (profile?.role ?? null) ||
            (isStaffRole(profile?.role) &&
              nextSession.user.companyId !== (profile?.companyId ?? null)));

        if (claimsOutOfDate) {
          try {
            nextSession = await services.auth.refreshSession();
            if (!active || useUserStore.getState().id !== nextSession.user.id) {
              return;
            }
            setAuthSession(nextSession.user);
            queryClient.setQueryData<AuthSession | null>(
              queryKeys.auth.session,
              nextSession,
            );
          } catch {
            // Keep profile-driven UI; callables may still fail until next refresh.
          }
        }

        setProfile(profile);
        queryClient.setQueryData(
          queryKeys.users.profile(nextSession.user.id),
          profile,
        );
      } catch {
        if (active) {
          setProfile(null);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient, setAuthSession, setProfile]);
};
