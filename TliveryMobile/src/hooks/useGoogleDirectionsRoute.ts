import {useEffect, useRef, useState} from 'react';
import {
  fetchDrivingRoute,
  type GoogleDirectionsRoute,
  type LatLng,
} from '@app/services/google/googleDirectionsService';
import {distanceMeters} from '@app/utils/geo';

type Options = {
  enabled?: boolean;
  language?: 'ar' | 'en';
  /** Refetch when origin moves at least this far (meters). */
  originMoveThresholdM?: number;
};

type State = {
  route: GoogleDirectionsRoute | null;
  loading: boolean;
  error: Error | null;
};

const DEFAULT_MOVE_M = 45;

/**
 * Fetches a driving polyline + ETA between origin and destination.
 * Refetches when destination changes or origin moves meaningfully
 * (avoids hammering Directions on every smooth marker tick).
 */
export function useGoogleDirectionsRoute(
  origin: LatLng | null,
  destination: LatLng | null,
  options: Options = {},
): State {
  const {
    enabled = true,
    language = 'ar',
    originMoveThresholdM = DEFAULT_MOVE_M,
  } = options;
  const [state, setState] = useState<State>({
    route: null,
    loading: false,
    error: null,
  });
  const lastOriginRef = useRef<LatLng | null>(null);
  const lastDestRef = useRef<LatLng | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !origin || !destination) {
      setState({route: null, loading: false, error: null});
      lastOriginRef.current = null;
      lastDestRef.current = null;
      return;
    }

    const destChanged =
      !lastDestRef.current ||
      distanceMeters(lastDestRef.current, destination) > 5;
    const originMoved =
      !lastOriginRef.current ||
      distanceMeters(lastOriginRef.current, origin) >= originMoveThresholdM;

    if (!destChanged && !originMoved && state.route) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setState(prev => ({...prev, loading: true, error: null}));

    void fetchDrivingRoute(origin, destination, language)
      .then(route => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        lastOriginRef.current = origin;
        lastDestRef.current = destination;
        setState({route, loading: false, error: null});
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setState(prev => ({
          route: prev.route,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
    // Intentionally omit state.route to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    language,
    originMoveThresholdM,
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  return state;
}
