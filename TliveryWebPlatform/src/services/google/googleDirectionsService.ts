import type {LatLng} from '../../utils/geo';

export type GoogleDirectionsRoute = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Driving route via Maps JS DirectionsService (browser-safe).
 * Requires Directions API enabled on the same Maps key.
 */
export async function fetchDrivingRoute(
  service: google.maps.DirectionsService,
  origin: LatLng,
  destination: LatLng,
): Promise<GoogleDirectionsRoute> {
  const result = await service.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: false,
  });

  const route = result.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) {
    throw new Error('Directions returned no route');
  }

  const coordinates =
    route.overview_path?.map(point => ({
      lat: point.lat(),
      lng: point.lng(),
    })) ?? [];

  if (coordinates.length < 2) {
    coordinates.push(origin, destination);
  }

  return {
    coordinates,
    distanceMeters: leg.distance?.value ?? 0,
    durationSeconds: leg.duration?.value ?? 0,
  };
}

/** Opens Google Maps turn-by-turn in a new tab. */
export function openGoogleMapsDirections(
  destination: LatLng,
  options?: {origin?: LatLng | null},
): void {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'driving',
  });
  if (options?.origin) {
    params.set(
      'origin',
      `${options.origin.lat},${options.origin.lng}`,
    );
  }
  window.open(
    `https://www.google.com/maps/dir/?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
}
