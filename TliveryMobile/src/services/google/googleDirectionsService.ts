import {appEnv, hasGoogleMapsKey} from '@app/config/env';

export type LatLng = {latitude: number; longitude: number};

export type RouteManeuver = {
  instruction: string;
  /** Human street / road name when available. */
  streetName: string | null;
  /** Distance to complete this step, meters. */
  distanceMeters: number;
  /** turn-left | turn-right | straight | uturn | arrive | depart | other */
  maneuver: string;
};

export type GoogleDirectionsRoute = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  /** First upcoming step for the turn banner. */
  nextStep: RouteManeuver | null;
};

type DirectionsLegStep = {
  html_instructions?: string;
  maneuver?: string;
  distance?: {value?: number; text?: string};
  duration?: {value?: number};
  polyline?: {points?: string};
};

type DirectionsResponse = {
  status: string;
  error_message?: string;
  routes?: Array<{
    overview_polyline?: {points?: string};
    legs?: Array<{
      distance?: {value?: number};
      duration?: {value?: number};
      steps?: DirectionsLegStep[];
    }>;
  }>;
};

/** Decode Google Encoded Polyline Algorithm Format → lat/lng path. */
export function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStreetName(instruction: string): string | null {
  const onto = instruction.match(
    /(?:onto|on to|إلى|على)\s+(.+)$/i,
  );
  if (onto?.[1]) {
    return onto[1].replace(/[.。]$/, '').trim();
  }
  return null;
}

function normalizeManeuver(raw?: string): string {
  if (!raw) {
    return 'other';
  }
  const m = raw.toLowerCase();
  if (m.includes('uturn') || m.includes('u-turn')) {
    return 'uturn';
  }
  if (m.includes('left')) {
    return 'turn-left';
  }
  if (m.includes('right')) {
    return 'turn-right';
  }
  if (m.includes('straight') || m.includes('continue')) {
    return 'straight';
  }
  if (m.includes('arrive') || m.includes('destination')) {
    return 'arrive';
  }
  if (m.includes('depart') || m.includes('head')) {
    return 'depart';
  }
  return 'other';
}

/**
 * Driving directions via Google Directions API (JSON).
 * Requires Directions API enabled on the same Maps key.
 */
export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
  language: 'ar' | 'en' = 'ar',
): Promise<GoogleDirectionsRoute> {
  if (!hasGoogleMapsKey()) {
    throw new Error('GOOGLE_MAPS_API_KEY is missing');
  }
  const key = appEnv.googleMapsApiKey.trim();
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: 'driving',
    language,
    key,
  });
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
  );
  const json = (await response.json()) as DirectionsResponse;
  if (!response.ok || json.status !== 'OK' || !json.routes?.[0]) {
    throw new Error(
      json.error_message ||
        `Directions failed (${json.status || response.status})`,
    );
  }

  const route = json.routes[0];
  const leg = route.legs?.[0];
  const encoded = route.overview_polyline?.points;
  const coordinates = encoded ? decodePolyline(encoded) : [];
  if (coordinates.length < 2 && origin && destination) {
    coordinates.push(origin, destination);
  }

  const firstStep = leg?.steps?.[0];
  const instruction = firstStep?.html_instructions
    ? stripHtml(firstStep.html_instructions)
    : '';
  const nextStep: RouteManeuver | null = firstStep
    ? {
        instruction,
        streetName: extractStreetName(instruction),
        distanceMeters: firstStep.distance?.value ?? 0,
        maneuver: normalizeManeuver(firstStep.maneuver),
      }
    : null;

  return {
    coordinates,
    distanceMeters: leg?.distance?.value ?? 0,
    durationSeconds: leg?.duration?.value ?? 0,
    nextStep,
  };
}
