import {useEffect, useRef, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';
import {
  fetchDrivingRoute,
  type GoogleDirectionsRoute,
} from '../services/google/googleDirectionsService';
import {distanceMeters, type LatLng} from '../utils/geo';

type Options = {
  enabled?: boolean;
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
 * Driving polyline + ETA. Must run under GoogleMapsProvider / APIProvider.
 * Refetches when destination changes or origin moves meaningfully.
 */
export function useGoogleDirectionsRoute(
  origin: LatLng | null,
  destination: LatLng | null,
  options: Options = {},
): State {
  const {enabled = true, originMoveThresholdM = DEFAULT_MOVE_M} = options;
  const routesLib = useMapsLibrary('routes');
  const [state, setState] = useState<State>({
    route: null,
    loading: false,
    error: null,
  });
  const lastOriginRef = useRef<LatLng | null>(null);
  const lastDestRef = useRef<LatLng | null>(null);
  const requestIdRef = useRef(0);
  const routeRef = useRef<GoogleDirectionsRoute | null>(null);
  routeRef.current = state.route;

  useEffect(() => {
    if (!enabled || !origin || !destination || !routesLib) {
      if (!enabled || !origin || !destination) {
        setState({route: null, loading: false, error: null});
        lastOriginRef.current = null;
        lastDestRef.current = null;
      }
      return;
    }

    const destChanged =
      !lastDestRef.current ||
      distanceMeters(lastDestRef.current, destination) > 5;
    const originMoved =
      !lastOriginRef.current ||
      distanceMeters(lastOriginRef.current, origin) >= originMoveThresholdM;

    if (!destChanged && !originMoved && routeRef.current) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setState(prev => ({...prev, loading: true, error: null}));

    const service = new routesLib.DirectionsService();
    void fetchDrivingRoute(service, origin, destination)
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
  }, [
    enabled,
    originMoveThresholdM,
    routesLib,
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
  ]);

  return state;
}
