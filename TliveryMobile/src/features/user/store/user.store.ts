import {create} from 'zustand';
import type {AuthUser} from '@app/models/auth.model';
import type {UserState} from '@app/types/user';
import type {UserProfile} from '@app/models/user-profile.model';
import {sanitizePermissions} from '@app/constants/permissions';

type UserActions = {
  setAuthSession: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  clearUser: () => void;
  markAuthPending: () => void;
};

export type UserStore = UserState & UserActions;

const EMPTY_USER: Omit<UserState, 'authReady'> = {
  id: null,
  name: null,
  email: null,
  phoneNumber: null,
  role: null,
  companyCode: null,
  companyId: null,
  permissions: [],
  status: null,
  emailVerified: false,
  profileReady: false,
  profileComplete: false,
  fullName: null,
};

export const useUserStore = create<UserStore>(set => ({
  ...EMPTY_USER,
  authReady: false,

  setAuthSession: user =>
    set(state => {
      const sameUser = Boolean(user && state.id === user.id);
      return {
        id: user?.id ?? null,
        name: user?.displayName ?? null,
        email: user?.email ?? null,
        phoneNumber: user?.phoneNumber ?? null,
        role: sameUser ? state.role : (user?.role ?? null),
        companyCode: sameUser ? state.companyCode : null,
        companyId: user?.companyId ?? (sameUser ? state.companyId : null),
        permissions: sameUser ? state.permissions : [],
        status: sameUser ? state.status : null,
        emailVerified: user?.emailVerified ?? false,
        profileReady: sameUser ? state.profileReady : !user,
        profileComplete: sameUser ? state.profileComplete : false,
        fullName: sameUser ? state.fullName : null,
        authReady: true,
      };
    }),

  setProfile: profile =>
    set(state => {
      if (!profile) {
        // Keep auth-claim role/companyId if profile fetch failed; clearUser handles logout.
        return {
          ...state,
          profileReady: true,
          profileComplete: false,
          fullName: null,
        };
      }
      return {
        name:
          profile.fullName?.trim() ||
          profile.displayName ||
          state.name,
        fullName: profile.fullName ?? state.fullName,
        email: profile.email ?? state.email,
        phoneNumber: profile.phoneNumber ?? state.phoneNumber,
        role: profile.role ?? state.role,
        status: profile.status ?? state.status,
        // Prefer profile, but never wipe a known companyId from auth claims.
        companyId: profile.companyId ?? state.companyId ?? null,
        permissions: sanitizePermissions(profile.permissions),
        profileComplete: profile.profileComplete === true,
        profileReady: true,
      };
    }),

  clearUser: () => set({...EMPTY_USER, authReady: true}),
  markAuthPending: () => set({authReady: false}),
}));
