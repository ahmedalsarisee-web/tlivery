import {useCallback, useEffect, useRef, useState} from 'react';
import {onSnapshot} from 'firebase/firestore';
import {driverLocationDocument} from '../firebase/trackingReferences';
import {fromFirestoreTimestamp} from '../firebase/firestoreTimestamp';
import type {DriverLiveLocation} from '../models/tracking.model';

type Options = {
  /** When true (default), pause while the browser tab is hidden. */
  pauseWhenHidden?: boolean;
  enabled?: boolean;
};

type Result = {
  location: DriverLiveLocation | null;
  loading: boolean;
  error: Error | null;
  isListening: boolean;
};

const mapData = (
  id: string,
  data: Record<string, unknown> | undefined,
): DriverLiveLocation | null => {
  if (!data) {
    return null;
  }
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  let updatedAt: string | null = null;
  if (data.updatedAt != null) {
    try {
      updatedAt = fromFirestoreTimestamp(
        data.updatedAt,
        'driver_locations.updatedAt',
      ).toISOString();
    } catch {
      updatedAt = null;
    }
  }
  return {
    driverId: String(data.driverId ?? id),
    orderId: String(data.orderId ?? ''),
    companyId: String(data.companyId ?? ''),
    driverName:
      typeof data.driverName === 'string' && data.driverName.trim()
        ? data.driverName.trim()
        : null,
    latitude,
    longitude,
    heading: Number.isFinite(Number(data.heading)) ? Number(data.heading) : 0,
    speed: Number.isFinite(Number(data.speed)) ? Number(data.speed) : 0,
    updatedAt,
  };
};

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

/**
 * Subscribe to `/driver_locations/{driverId}`.
 * Unsubscribes on unmount and (by default) when the tab is hidden.
 */
export function useDriverLiveLocation(
  driverId: string | null | undefined,
  options?: Options,
): Result {
  const pauseWhenHidden = options?.pauseWhenHidden !== false;
  const enabled = options?.enabled !== false;
  const visible = useDocumentVisible();
  const shouldListen =
    enabled && Boolean(driverId) && (!pauseWhenHidden || visible);

  const [location, setLocation] = useState<DriverLiveLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(false);
  const lastDriverIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setLocation(null);
    setError(null);
    setLoading(false);
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!shouldListen || !driverId) {
      setIsListening(false);
      setLoading(false);
      return;
    }

    if (lastDriverIdRef.current !== driverId) {
      lastDriverIdRef.current = driverId;
      setLocation(null);
    }

    setLoading(true);
    setError(null);
    setIsListening(true);

    const unsubscribe = onSnapshot(
      driverLocationDocument(driverId),
      snap => {
        setLocation(
          snap.exists()
            ? mapData(snap.id, snap.data() as Record<string, unknown>)
            : null,
        );
        setLoading(false);
      },
      err => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        setIsListening(false);
      },
    );

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [driverId, shouldListen]);

  useEffect(() => {
    if (!driverId) {
      reset();
    }
  }, [driverId, reset]);

  return {location, loading, error, isListening};
}
