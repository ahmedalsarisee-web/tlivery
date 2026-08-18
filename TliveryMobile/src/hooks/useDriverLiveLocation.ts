import {useCallback, useEffect, useRef, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {onSnapshot} from 'firebase/firestore';
import {driverLocationDocument} from '@app/firebase/firestore/references';
import type {DriverLiveLocation} from '@app/models/tracking.model';
import {fromFirestoreTimestamp} from '@app/firebase/firestore/firestoreTimestamp';

type UseDriverLiveLocationOptions = {
  /**
   * When true (default), unsubscribe while the screen is blurred.
   * Saves Firestore listener cost when the map is not visible.
   */
  pauseWhenBlurred?: boolean;
  enabled?: boolean;
};

type UseDriverLiveLocationResult = {
  location: DriverLiveLocation | null;
  loading: boolean;
  error: Error | null;
  isListening: boolean;
};

type SnapshotLike = {
  id: string;
  exists: (() => boolean) | boolean;
  data: () => Record<string, unknown> | undefined;
};

const snapshotExists = (snap: SnapshotLike): boolean =>
  typeof snap.exists === 'function' ? snap.exists() : snap.exists;

const mapSnapshot = (snap: SnapshotLike): DriverLiveLocation | null => {
  if (!snapshotExists(snap)) {
    return null;
  }
  const data = snap.data();
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
        data.updatedAt as never,
        'driver_locations.updatedAt',
      ).toISOString();
    } catch {
      updatedAt = null;
    }
  }
  return {
    driverId: String(data.driverId ?? snap.id),
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

/**
 * Subscribes to a single `/driver_locations/{driverId}` document.
 * Disconnects on unmount and (by default) when the screen loses focus.
 */
export function useDriverLiveLocation(
  driverId: string | null | undefined,
  options?: UseDriverLiveLocationOptions,
): UseDriverLiveLocationResult {
  const pauseWhenBlurred = options?.pauseWhenBlurred !== false;
  const enabled = options?.enabled !== false;
  const isFocused = useIsFocused();
  const shouldListen =
    enabled && Boolean(driverId) && (!pauseWhenBlurred || isFocused);

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
        setLocation(mapSnapshot(snap as unknown as SnapshotLike));
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
