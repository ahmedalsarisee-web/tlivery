/**
 * Jordan delivery location helpers (Google Places / map-shaped).
 * Catalog governorate/area lists removed — create-order sends place search results.
 */

export type PublicOrderLocation = {
  countryCode: 'JO';
  /** Optional legacy catalog id (may be empty for map picks). */
  governorateId: string;
  /** Optional legacy catalog id (may be empty for map picks). */
  areaId: string;
  note?: string | null;
  lat?: number | null;
  lng?: number | null;
  areaAr?: string | null;
  areaEn?: string | null;
  governorateAr?: string | null;
  governorateEn?: string | null;
  placeNameAr?: string | null;
  placeNameEn?: string | null;
  /** External place id (Google Place ID). */
  mapboxId?: string | null;
};

function optionalTrimmed(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function optionalCoord(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function formatPublicLocation(
  location: PublicOrderLocation,
  locale: 'ar' | 'en' = 'ar',
): string {
  const area = locale === 'ar' ? location.areaAr : location.areaEn;
  const gov =
    locale === 'ar' ? location.governorateAr : location.governorateEn;
  const place =
    locale === 'ar' ? location.placeNameAr : location.placeNameEn;
  const parts = [place || area, gov].filter(Boolean);
  const base = parts.join(' · ');
  const note = location.note?.trim();
  return note ? `${base} — ${note}` : base;
}

export function parsePublicLocation(
  input: unknown,
): PublicOrderLocation | null {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const raw = input as Record<string, unknown>;
  const note = optionalTrimmed(raw.note, 200);
  const lat = optionalCoord(raw.lat);
  const lng = optionalCoord(raw.lng);
  const areaAr = optionalTrimmed(raw.areaAr, 120);
  const areaEn = optionalTrimmed(raw.areaEn, 120);
  const governorateAr = optionalTrimmed(raw.governorateAr, 120);
  const governorateEn = optionalTrimmed(raw.governorateEn, 120);
  const placeNameAr = optionalTrimmed(raw.placeNameAr, 240);
  const placeNameEn = optionalTrimmed(raw.placeNameEn, 240);
  const mapboxId = optionalTrimmed(raw.mapboxId, 120);
  const governorateId =
    typeof raw.governorateId === 'string' ? raw.governorateId.trim() : '';
  const areaId = typeof raw.areaId === 'string' ? raw.areaId.trim() : '';

  if (
    lat == null ||
    lng == null ||
    !(areaAr || areaEn) ||
    !(governorateAr || governorateEn)
  ) {
    return null;
  }

  return {
    countryCode: 'JO',
    governorateId,
    areaId,
    note,
    lat,
    lng,
    areaAr,
    areaEn,
    governorateAr,
    governorateEn,
    placeNameAr,
    placeNameEn,
    mapboxId,
  };
}

export function isPublicLocationFilled(
  location: PublicOrderLocation | null | undefined,
): location is PublicOrderLocation {
  if (!location) {
    return false;
  }
  return (
    typeof location.lat === 'number' &&
    Number.isFinite(location.lat) &&
    typeof location.lng === 'number' &&
    Number.isFinite(location.lng) &&
    Boolean(location.areaAr || location.areaEn) &&
    Boolean(location.governorateAr || location.governorateEn)
  );
}

