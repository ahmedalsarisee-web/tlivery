/** Haversine helpers / map region math for web live tracking. */

export type LatLng = {lat: number; lng: number};

export const DEFAULT_AMMAN: LatLng = {lat: 31.9539, lng: 35.9106};

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Haversine distance in meters between two WGS84 points. */
export const distanceMeters = (a: LatLng, b: LatLng): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
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

export const boundsCenter = (
  points: LatLng[],
): {center: LatLng; zoom: number} => {
  if (points.length === 0) {
    return {center: DEFAULT_AMMAN, zoom: 11};
  }
  if (points.length === 1) {
    return {center: points[0], zoom: 14};
  }
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const center = {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
  const latSpan = Math.max(0.01, maxLat - minLat);
  const lngSpan = Math.max(0.01, maxLng - minLng);
  const span = Math.max(latSpan, lngSpan);
  let zoom = 13;
  if (span > 0.5) zoom = 10;
  else if (span > 0.2) zoom = 11;
  else if (span > 0.08) zoom = 12;
  else if (span > 0.03) zoom = 13;
  else zoom = 14;
  return {center, zoom};
};

export const MARKER_ANIMATION_MS = 1000;

export const lerpLatLng = (from: LatLng, to: LatLng, t: number): LatLng => {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
};
