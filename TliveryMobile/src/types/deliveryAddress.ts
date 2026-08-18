/**
 * Delivery address selected via Google Places search (Jordan-focused).
 * Prefer LocationSearchResult from googlePlacesSearchService for new code.
 */

export type DeliveryAddress = {
  countryCode: 'JO';
  lat: number;
  lng: number;
  areaAr: string;
  areaEn: string;
  governorateAr: string;
  governorateEn: string;
  placeNameAr?: string | null;
  placeNameEn?: string | null;
  /** External place id (Google Place ID). */
  mapboxId?: string | null;
  note?: string | null;
};
