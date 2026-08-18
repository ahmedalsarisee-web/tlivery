import {useEffect, useRef} from 'react';
import {
  selectProfileReady,
  selectUserCompanyId,
  selectUserId,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {services} from '@app/services/dependencies';
import {locationTracker} from '@app/services/locationTracker';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import i18n from '@app/I18n';

/**
 * While a driver is signed in with a company, publish throttled GPS to
 * `/driver_locations/{driverId}` so fleet / order maps stay fresh.
 */
export function useDriverLocationPresence(): void {
  const role = useUserStore(selectUserRole);
  const userId = useUserStore(selectUserId);
  const companyId = useUserStore(selectUserCompanyId);
  const name = useUserStore(state => state.name);
  const profileReady = useUserStore(selectProfileReady);
  const startedForRef = useRef<string | null>(null);
  const deniedToastShown = useRef(false);
  const companyToastShown = useRef(false);

  // Stop only when the host screen truly unmounts (not on dep refresh).
  useEffect(() => {
    return () => {
      startedForRef.current = null;
      void locationTracker.stop({flush: true});
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const enabled = profileReady && role === 'driver' && Boolean(userId);
      if (!enabled || !userId) {
        if (startedForRef.current) {
          startedForRef.current = null;
          void locationTracker.stop({flush: true});
        }
        return;
      }

      let resolvedCompanyId = companyId;
      if (!resolvedCompanyId) {
        try {
          const driver = await services.workflow.repository.getDriver(userId);
          resolvedCompanyId = driver?.companyId ?? null;
          if (
            resolvedCompanyId &&
            !cancelled &&
            useUserStore.getState().companyId !== resolvedCompanyId
          ) {
            useUserStore.setState({companyId: resolvedCompanyId});
            // companyId dep will re-run this effect; skip starting here.
            return;
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('[presence] driver company lookup failed', error);
          }
        }
      }

      if (cancelled) {
        return;
      }

      if (!resolvedCompanyId) {
        if (__DEV__) {
          console.warn('[presence] no companyId — cannot publish location');
        }
        if (!companyToastShown.current) {
          companyToastShown.current = true;
          showToast(ToastType.info, i18n.t('locationCompanyMissing'));
        }
        return;
      }

      const key = `${userId}:${resolvedCompanyId}`;
      if (startedForRef.current === key && locationTracker.isTracking()) {
        return;
      }
      startedForRef.current = key;

      try {
        await locationTracker.startPresence({
          driverId: userId,
          companyId: resolvedCompanyId,
          driverName: useUserStore.getState().name,
        });
        if (cancelled) {
          return;
        }
        deniedToastShown.current = false;
        if (__DEV__) {
          console.log('[presence] tracking started', userId, resolvedCompanyId);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (__DEV__) {
          console.warn('[presence] start failed', error);
        }
        const message =
          error instanceof Error ? error.message : String(error ?? '');
        if (
          message === 'LOCATION_PERMISSION_DENIED' &&
          !deniedToastShown.current
        ) {
          deniedToastShown.current = true;
          showToast(ToastType.info, i18n.t('locationPermissionNeeded'));
        } else if (
          message === 'LOCATION_MISSING_COMPANY' &&
          !companyToastShown.current
        ) {
          companyToastShown.current = true;
          showToast(ToastType.info, i18n.t('locationCompanyMissing'));
        }
        if (startedForRef.current === key) {
          startedForRef.current = null;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [role, userId, companyId, profileReady]);

  useEffect(() => {
    if (!locationTracker.isTracking()) {
      return;
    }
    const session = locationTracker.getActiveSession();
    if (!session || session.driverId !== userId) {
      return;
    }
    void locationTracker.startPresence({
      driverId: session.driverId,
      companyId: session.companyId,
      orderId: session.orderId,
      driverName: name,
    });
  }, [name, userId]);
}
