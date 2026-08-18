import {navigationRef} from './RootNavigation';
import {useUserStore} from '@app/features/user';
import {services} from '@app/services/dependencies';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import type {AuthSession} from '@app/models/auth.model';

export const isDriverApplicantSession = (user: {
  phoneNumber: string | null;
  email: string | null;
  companyId: string | null;
}) => {
  if (user.companyId) {
    return false;
  }
  if (user.phoneNumber) {
    return true;
  }
  return Boolean(user.email?.endsWith('@drivers.wasel.app'));
};

/**
 * Loads profile for the signed-in user and resets navigation to the correct
 * destination (main app, pending registration, etc.) — without showing Splash.
 */
export async function navigateAfterAuth(
  existingSession?: AuthSession | null,
): Promise<void> {
  if (!navigationRef.isReady()) {
    return;
  }

  try {
    let session = existingSession ?? (await services.auth.restoreSession());
    useUserStore.getState().setAuthSession(session?.user ?? null);

    if (!session) {
      const onboardingDone = storage.getBoolean(StorageKeys.ONBOARDING_DONE);
      const pendingDriverCode = storage.getString(
        StorageKeys.PENDING_DRIVER_INVITE_CODE,
      );
      const pendingClientCode = storage.getString(
        StorageKeys.PENDING_CLIENT_INVITE_CODE,
      );
      if (pendingClientCode) {
        navigationRef.reset({
          index: 0,
          routes: [
            {
              name: 'RegisterClientInvite',
              params: {inviteCode: pendingClientCode},
            },
          ],
        });
        return;
      }
      navigationRef.reset({
        index: 0,
        routes: [
          {
            name: onboardingDone ? 'Login' : 'Onboarding',
            params:
              onboardingDone && pendingDriverCode
                ? {method: 'phone'}
                : undefined,
          },
        ],
      });
      return;
    }

    const profile = await services.workflow.repository.getUserProfile(
      session.user.id,
    );
    if (
      profile?.status === 'active' &&
      profile.role &&
      session.user.role !== profile.role
    ) {
      session = await services.auth.refreshSession();
      useUserStore.getState().setAuthSession(session.user);
    }
    useUserStore.getState().setProfile(profile);

    const canEnterMain =
      profile?.status === 'active' &&
      (profile.role === 'company_admin' ||
        profile.role === 'company_employee' ||
        profile.role === 'driver' ||
        profile.role === 'client' ||
        profile.role === 'merchant');

    if (canEnterMain) {
      storage.remove(StorageKeys.PENDING_DRIVER_INVITE_CODE);
      storage.remove(StorageKeys.PENDING_CLIENT_INVITE_CODE);
      navigationRef.reset({index: 0, routes: [{name: 'MainTabs'}]});
      return;
    }

    const [companyApplication, driverApplication] = await Promise.all([
      services.workflow.repository.getCompanyApplication(session.user.id),
      services.workflow.repository.getDriverApplication(session.user.id),
    ]);

    if (companyApplication) {
      navigationRef.reset({
        index: 0,
        routes: [
          {
            name: 'RegisterPending',
            params: {role: 'company', referenceId: companyApplication.id},
          },
        ],
      });
      return;
    }

    if (driverApplication) {
      navigationRef.reset({
        index: 0,
        routes: [
          {
            name: 'RegisterPending',
            params: {role: 'driver', referenceId: driverApplication.id},
          },
        ],
      });
      return;
    }

    const pendingCode = storage.getString(
      StorageKeys.PENDING_DRIVER_INVITE_CODE,
    );
    if (isDriverApplicantSession(session.user)) {
      navigationRef.reset({
        index: 0,
        routes: [
          {
            name: 'RegisterDriver',
            params: pendingCode ? {inviteCode: pendingCode} : undefined,
          },
        ],
      });
      return;
    }

    navigationRef.reset({
      index: 0,
      routes: [{name: 'RegisterCompany'}],
    });
  } catch {
    useUserStore.getState().setAuthSession(null);
    const onboardingDone = storage.getBoolean(StorageKeys.ONBOARDING_DONE);
    navigationRef.reset({
      index: 0,
      routes: [{name: onboardingDone ? 'Login' : 'Onboarding'}],
    });
  }
}
