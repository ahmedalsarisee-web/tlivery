/**
 * Jordan delivery location helpers (Google Places / map-shaped).
 * Catalog governorate/area pickers were removed — create-order uses place search.
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

export function formatPublicLocation(
  location: PublicOrderLocation,
  locale: 'ar' | 'en' = 'ar',
): string {
  const area = (locale === 'ar' ? location.areaAr : location.areaEn)?.trim();
  const gov = (
    locale === 'ar' ? location.governorateAr : location.governorateEn
  )?.trim();
  const place = (
    locale === 'ar' ? location.placeNameAr : location.placeNameEn
  )?.trim();
  const parts: string[] = [];
  if (place) {
    parts.push(place);
  }
  if (area && area !== place) {
    parts.push(area);
  }
  if (gov && gov !== area && gov !== place) {
    parts.push(gov);
  }
  const base = parts.join(' · ');
  const note = location.note?.trim();
  return note ? `${base} — ${note}` : base;
}

/**
 * Compact label for list cards: area + city (governorate) only.
 * Falls back to parsing a full formatted address string when needed.
 */
export function formatPublicLocationShort(
  location: PublicOrderLocation | null | undefined,
  locale: 'ar' | 'en' = 'ar',
  fallbackAddress?: string | null,
): string {
  if (location) {
    const area = (
      locale === 'ar' ? location.areaAr : location.areaEn
    )?.trim();
    const city = (
      locale === 'ar' ? location.governorateAr : location.governorateEn
    )?.trim();
    if (area && city && area !== city) {
      return `${area} · ${city}`;
    }
    if (area) {
      return area;
    }
    if (city) {
      return city;
    }
  }

  const raw = fallbackAddress?.trim();
  if (!raw) {
    return '—';
  }
  const withoutNote = raw.split('—')[0]?.trim() ?? raw;
  const parts = withoutNote
    .split('·')
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]} · ${parts[parts.length - 1]}`;
  }
  return parts[0] ?? '—';
}

export function isPublicLocationFilled(
  location: PublicOrderLocation | null | undefined,
): location is PublicOrderLocation {
  if (!location) {
    return false;
  }
  return (
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    Boolean(location.areaAr || location.areaEn) &&
    Boolean(location.governorateAr || location.governorateEn)
  );
}

export function searchResultToPublicLocation(
  result: {
    id?: string;
    name_ar: string;
    name_en: string;
    governorate_ar: string;
    governorate_en: string;
    latitude: number;
    longitude: number;
    place_name_ar?: string;
    place_name_en?: string;
  },
  note?: string | null,
): PublicOrderLocation {
  return {
    countryCode: 'JO',
    governorateId: '',
    areaId: '',
    note: note?.trim() ? note.trim().slice(0, 200) : null,
    lat: result.latitude,
    lng: result.longitude,
    areaAr: result.name_ar,
    areaEn: result.name_en,
    governorateAr: result.governorate_ar,
    governorateEn: result.governorate_en,
    placeNameAr: result.place_name_ar ?? result.name_ar,
    placeNameEn: result.place_name_en ?? result.name_en,
    mapboxId: result.id ?? null,
  };
}
