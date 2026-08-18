import {appEnv} from '../../config/env';

/**
 * Selected Jordan place from Google Places (search / details).
 * Used for routing/pricing on the backend.
 */
export type LocationSearchResult = {
  id: string;
  name_ar: string;
  name_en: string;
  governorate_ar: string;
  governorate_en: string;
  latitude: number;
  longitude: number;
  place_name_ar?: string;
  place_name_en?: string;
};

/** Autocomplete row before Place Details resolves coordinates. */
export type LocationSearchSuggestion = {
  id: string;
  /** structured_formatting.main_text (display). */
  main_text: string;
  /** structured_formatting.secondary_text (display). */
  secondary_text: string;
  name_ar: string;
  name_en: string;
  governorate_ar: string;
  governorate_en: string;
  place_name_ar: string;
  place_name_en: string;
};

const AUTOCOMPLETE_URL =
  'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const AMMAN = {latitude: 31.9539, longitude: 35.9106};
const RADIUS_M = 50000;

type StructuredFormat = {
  mainText?: {text?: string};
  secondaryText?: {text?: string};
};

type PlacePrediction = {
  placeId?: string;
  text?: {text?: string};
  structuredFormat?: StructuredFormat;
};

type AutocompleteResponse = {
  suggestions?: Array<{placePrediction?: PlacePrediction}>;
  error?: {message?: string; status?: string};
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
  languageCode?: string;
};

type PlaceDetails = {
  id?: string;
  displayName?: {text?: string; languageCode?: string};
  formattedAddress?: string;
  location?: {latitude?: number; longitude?: number};
  addressComponents?: AddressComponent[];
  error?: {message?: string; status?: string};
};

function requireKey(): string {
  const key = appEnv.googleMapsApiKey.trim();
  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is missing');
  }
  return key;
}

function pickComponent(
  components: AddressComponent[] | undefined,
  types: string[],
): string {
  if (!components?.length) {
    return '';
  }
  for (const type of types) {
    const hit = components.find(c => c.types?.includes(type));
    if (hit?.longText?.trim()) {
      return hit.longText.trim();
    }
  }
  return '';
}

function parseHierarchy(
  details: PlaceDetails,
  fallbackName: string,
): {name: string; governorate: string; placeName: string} {
  const components = details.addressComponents;
  const governorate = pickComponent(components, [
    'administrative_area_level_1',
  ]);
  const name =
    pickComponent(components, [
      'neighborhood',
      'sublocality',
      'sublocality_level_1',
      'locality',
      'route',
    ]) ||
    details.displayName?.text?.trim() ||
    fallbackName;
  // Prefer short establishment name (e.g. "مدارس الفريد") over the full
  // formatted street address so create-order summaries stay readable.
  const placeName =
    details.displayName?.text?.trim() ||
    fallbackName ||
    details.formattedAddress?.trim() ||
    name;
  return {
    name,
    governorate: governorate || 'Jordan',
    placeName,
  };
}

async function autocomplete(
  query: string,
  languageCode: 'ar' | 'en',
): Promise<PlacePrediction[]> {
  const key = requireKey();
  const response = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ['jo'],
      languageCode,
      locationBias: {
        circle: {
          center: AMMAN,
          radius: RADIUS_M,
        },
      },
    }),
  });
  const json = (await response.json()) as AutocompleteResponse;
  if (!response.ok) {
    throw new Error(
      json.error?.message || `Google Places error (${response.status})`,
    );
  }
  return (json.suggestions ?? [])
    .map(s => s.placePrediction)
    .filter((p): p is PlacePrediction => Boolean(p?.placeId));
}

async function placeDetails(
  placeId: string,
  languageCode: 'ar' | 'en',
): Promise<PlaceDetails> {
  const key = requireKey();
  const url = `${PLACE_DETAILS_URL}/${encodeURIComponent(placeId)}?languageCode=${languageCode}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,location,addressComponents',
    },
  });
  const json = (await response.json()) as PlaceDetails;
  if (!response.ok) {
    throw new Error(
      json.error?.message || `Google Places error (${response.status})`,
    );
  }
  return json;
}

function predictionLabel(prediction: PlacePrediction): {
  name: string;
  secondary: string;
  placeName: string;
} {
  const name =
    prediction.structuredFormat?.mainText?.text?.trim() ||
    prediction.text?.text?.trim() ||
    '';
  const secondary =
    prediction.structuredFormat?.secondaryText?.text?.trim() || '';
  const placeName = name || prediction.text?.text?.trim() || '';
  return {name, secondary, placeName};
}

/**
 * Jordan autocomplete via Places API (New). Merges ar + en by placeId.
 */
export async function searchJordanLocations(
  query: string,
): Promise<LocationSearchSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const [arPredictions, enPredictions] = await Promise.all([
    autocomplete(q, 'ar'),
    autocomplete(q, 'en'),
  ]);

  const enById = new Map<string, PlacePrediction>();
  for (const en of enPredictions) {
    if (en.placeId) {
      enById.set(en.placeId, en);
    }
  }

  const out: LocationSearchSuggestion[] = [];
  const seen = new Set<string>();
  for (const ar of arPredictions) {
    const id = ar.placeId;
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const en = enById.get(id);
    const arLabel = predictionLabel(ar);
    const enLabel = predictionLabel(en ?? ar);
    out.push({
      id,
      main_text: arLabel.name,
      secondary_text: arLabel.secondary,
      name_ar: arLabel.name,
      name_en: enLabel.name,
      governorate_ar: arLabel.secondary,
      governorate_en: enLabel.secondary,
      place_name_ar: arLabel.placeName,
      place_name_en: enLabel.placeName,
    });
  }
  return out;
}

/**
 * Resolve a placeId to bilingual names + coordinates.
 */
export async function resolveJordanPlace(
  suggestion: LocationSearchSuggestion,
): Promise<LocationSearchResult> {
  const [arDetails, enDetails] = await Promise.all([
    placeDetails(suggestion.id, 'ar'),
    placeDetails(suggestion.id, 'en'),
  ]);
  const lat =
    arDetails.location?.latitude ?? enDetails.location?.latitude;
  const lng =
    arDetails.location?.longitude ?? enDetails.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Place has no coordinates');
  }
  const ar = parseHierarchy(arDetails, suggestion.name_ar);
  const en = parseHierarchy(enDetails, suggestion.name_en);
  return {
    id: suggestion.id,
    name_ar: ar.name || suggestion.name_ar,
    name_en: en.name || suggestion.name_en,
    governorate_ar: ar.governorate || suggestion.governorate_ar,
    governorate_en: en.governorate || suggestion.governorate_en,
    latitude: lat,
    longitude: lng,
    place_name_ar:
      ar.placeName ||
      suggestion.name_ar ||
      suggestion.place_name_ar,
    place_name_en:
      en.placeName ||
      suggestion.name_en ||
      suggestion.place_name_en,
  };
}

export function formatSearchResult(
  result: LocationSearchResult,
  locale: 'ar' | 'en' = 'ar',
): string {
  const name = (locale === 'ar' ? result.name_ar : result.name_en)?.trim();
  const gov = (
    locale === 'ar' ? result.governorate_ar : result.governorate_en
  )?.trim();
  const place = (
    locale === 'ar'
      ? result.place_name_ar ?? name
      : result.place_name_en ?? name
  )?.trim();
  const parts: string[] = [];
  if (place) {
    parts.push(place);
  }
  if (name && name !== place) {
    parts.push(name);
  }
  if (gov && gov !== name && gov !== place) {
    parts.push(gov);
  }
  return parts.join(' · ');
}
