import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  searchResultToPublicLocation,
  type PublicOrderLocation,
} from '../constants/jordanLocations';
import type {LocationSearchResult} from '../services/google/googlePlacesSearchService';
import {LocationSearchBar} from './LocationSearchBar';

type DeliveryLocationPickerProps = {
  kind: 'pickup' | 'dropoff';
  initial: PublicOrderLocation | null;
  onConfirm: (location: PublicOrderLocation) => void;
};

function fromPublicLocation(
  location: PublicOrderLocation | null,
): LocationSearchResult | null {
  if (
    location == null ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number'
  ) {
    return null;
  }
  return {
    id: location.mapboxId ?? `${location.lng},${location.lat}`,
    name_ar: location.areaAr ?? location.placeNameAr ?? '',
    name_en: location.areaEn ?? location.placeNameEn ?? '',
    governorate_ar: location.governorateAr ?? '',
    governorate_en: location.governorateEn ?? '',
    latitude: location.lat,
    longitude: location.lng,
    place_name_ar: location.placeNameAr ?? undefined,
    place_name_en: location.placeNameEn ?? undefined,
  };
}

export function DeliveryLocationPicker({
  initial,
  onConfirm,
}: DeliveryLocationPickerProps) {
  const {t} = useTranslation();
  const [selected, setSelected] = useState<LocationSearchResult | null>(() =>
    fromPublicLocation(initial),
  );
  const [note, setNote] = useState(initial?.note ?? '');

  return (
    <div className="delivery-picker">
      <p className="muted">{t('publicLocationHint')}</p>
      <LocationSearchBar selected={selected} onSelect={setSelected} />
      <label className="field">
        {t('orderNotesOptional')}
        <textarea
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder={t('orderNotesPlaceholder')}
          rows={3}
        />
      </label>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected}
          onClick={() => {
            if (!selected) {
              return;
            }
            onConfirm(
              searchResultToPublicLocation(
                selected,
                note.trim() ? note.trim() : null,
              ),
            );
          }}>
          {t('saveLocation')}
        </button>
      </div>
    </div>
  );
}
