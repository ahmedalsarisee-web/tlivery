/**
 * Lightweight geo helpers for live tracking (no external deps).
 */

const EARTH_RADIUS_M = 6_371_000;

/** Typical urban average for rough ETA (Jordan city traffic). */
const DEFAULT_AVG_SPEED_KMH = 28;
/** Straight-line → road distance fudge factor. */
const ROAD_FACTOR = 1.35;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Haversine distance in meters between two WGS84 points. */
export const distanceMeters = (
  a: {latitude: number; longitude: number},
  b: {latitude: number; longitude: number},
): number => {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Approximate road distance in meters from straight-line haversine. */
export const estimateRoadDistanceMeters = (
  a: {latitude: number; longitude: number},
  b: {latitude: number; longitude: number},
): number => distanceMeters(a, b) * ROAD_FACTOR;

/** Rough ETA in whole minutes (no Directions API). */
export const estimateTravelMinutes = (
  distanceM: number,
  avgSpeedKmh: number = DEFAULT_AVG_SPEED_KMH,
): number => {
  if (!Number.isFinite(distanceM) || distanceM <= 0) {
    return 0;
  }
  const hours = distanceM / 1000 / avgSpeedKmh;
  return Math.max(1, Math.round(hours * 60));
};

export const formatDistanceLabel = (meters: number): string => {
  if (!Number.isFinite(meters) || meters < 0) {
    return '—';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

/** Linear interpolate between two coordinates (t in [0, 1]). */
export const lerpCoordinate = (
  from: {latitude: number; longitude: number},
  to: {latitude: number; longitude: number},
  t: number,
): {latitude: number; longitude: number} => {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * clamped,
    longitude: from.longitude + (to.longitude - from.longitude) * clamped,
  };
};

export const DEFAULT_LIVE_INTERVAL_MS = 15_000;
export const DEFAULT_DISTANCE_FILTER_M = 30;
export const DEFAULT_ROUTE_FLUSH_MS = 5 * 60_000;
export const DEFAULT_MAX_BUFFERED_POINTS = 120;
export const MARKER_ANIMATION_MS = 1_000;
