import {useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {driverLocationsCollection} from '@app/firebase/firestore/references';
import {fromFirestoreTimestamp} from '@app/firebase/firestore/firestoreTimestamp';
import type {DriverLiveLocation} from '@app/models/tracking.model';

type Options = {
  pauseWhenBlurred?: boolean;
  enabled?: boolean;
  /** Drop stale pins older than this (default 15 minutes). */
  staleAfterMs?: number;
};

type Result = {
  locations: DriverLiveLocation[];
  loading: boolean;
  error: Error | null;
  isListening: boolean;
};

const mapDoc = (
  id: string,
  data: Record<string, unknown>,
): DriverLiveLocation | null => {
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

/**
 * One collection listener for the company fleet map:
 * `driver_locations where companyId == companyId`.
 */
export function useCompanyDriverLocations(
  companyId: string | null | undefined,
  options?: Options,
): Result {
  const pauseWhenBlurred = options?.pauseWhenBlurred !== false;
  const enabled = options?.enabled !== false;
  const staleAfterMs = options?.staleAfterMs ?? 15 * 60_000;
  const isFocused = useIsFocused();
  const shouldListen =
    enabled && Boolean(companyId) && (!pauseWhenBlurred || isFocused);

  const [locations, setLocations] = useState<DriverLiveLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!shouldListen || !companyId) {
      setIsListening(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsListening(true);

    const q = query(
      driverLocationsCollection,
      where('companyId', '==', companyId),
    );

    const unsubscribe = onSnapshot(
      q,
      snap => {
        const now = Date.now();
        const next: DriverLiveLocation[] = [];
        snap.docs.forEach(docSnap => {
          const raw = docSnap.data() as Record<string, unknown> | undefined;
          if (!raw) {
            return;
          }
          const mapped = mapDoc(docSnap.id, raw);
          if (!mapped) {
            return;
          }
          if (mapped.updatedAt) {
            const age = now - new Date(mapped.updatedAt).getTime();
            if (Number.isFinite(age) && age > staleAfterMs) {
              return;
            }
          }
          next.push(mapped);
        });
        setLocations(next);
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
  }, [companyId, shouldListen, staleAfterMs]);

  return {locations, loading, error, isListening};
}
