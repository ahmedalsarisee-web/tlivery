import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Check, MapPin, Search, X} from 'lucide-react';
import {hasGoogleMapsKey} from '../config/env';
import {
  resolveJordanPlace,
  searchJordanLocations,
  type LocationSearchResult,
  type LocationSearchSuggestion,
} from '../services/google/googlePlacesSearchService';

const DEBOUNCE_MS = 400;

type LocationSearchBarProps = {
  selected: LocationSearchResult | null;
  onSelect: (result: LocationSearchResult | null) => void;
  placeholder?: string;
};

export function LocationSearchBar({
  selected,
  onSelect,
  placeholder,
}: LocationSearchBarProps) {
  const {t, i18n} = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);
  const requestIdRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasGoogleMapsKey()) {
      setError(t('googleMapsKeyMissing'));
    }
  }, [t]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (selected) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const value = query.trim();
    if (value.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      void (async () => {
        if (!hasGoogleMapsKey()) {
          setError(t('googleMapsKeyMissing'));
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const next = await searchJordanLocations(value);
          if (requestId !== requestIdRef.current) {
            return;
          }
          setResults(next);
          setOpen(true);
        } catch (err) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          const message =
            err instanceof Error ? err.message : t('googlePlacesLookupFailed');
          setError(message);
          setResults([]);
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selected, t]);

  const clearAll = () => {
    skipSearchRef.current = true;
    setQuery('');
    setResults([]);
    setError(hasGoogleMapsKey() ? null : t('googleMapsKeyMissing'));
    setOpen(false);
    onSelect(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onPick = async (suggestion: LocationSearchSuggestion) => {
    setResolving(true);
    setError(null);
    try {
      const resolved = await resolveJordanPlace(suggestion);
      skipSearchRef.current = true;
      setResults([]);
      setOpen(false);
      setQuery('');
      onSelect(resolved);
      inputRef.current?.blur();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('googlePlacesLookupFailed');
      setError(message);
    } finally {
      setResolving(false);
    }
  };

  const showDropdown = !selected && open && query.trim().length >= 2;

  const selectedPlace = selected
    ? (
        (locale === 'ar'
          ? selected.place_name_ar
          : selected.place_name_en) || ''
      ).trim()
    : '';
  const selectedArea = selected
    ? ((locale === 'ar' ? selected.name_ar : selected.name_en) || '').trim()
    : '';
  const selectedGov = selected
    ? (
        (locale === 'ar'
          ? selected.governorate_ar
          : selected.governorate_en) || ''
      ).trim()
    : '';
  const selectedTitle =
    selectedPlace || selectedArea || selected?.name_ar || '';
  const selectedSubtitle = [
    selectedArea && selectedArea !== selectedTitle ? selectedArea : null,
    selectedGov &&
    selectedGov !== selectedTitle &&
    selectedGov !== selectedArea
      ? selectedGov
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="location-search" ref={rootRef}>
      {selected ? (
        <div className="location-search-selected">
          <div className="location-search-selected-header">
            <div className="location-search-selected-icon" aria-hidden>
              <Check size={16} strokeWidth={2.6} />
            </div>
            <div className="location-search-selected-body">
              <span className="location-search-badge">
                {t('locationSelected')}
              </span>
              <strong>{selectedTitle}</strong>
              {selectedSubtitle ? <span>{selectedSubtitle}</span> : null}
            </div>
          </div>
          <button
            type="button"
            className="location-search-change"
            onClick={clearAll}>
            {t('changeLocation')}
          </button>
        </div>
      ) : (
        <>
          <div className="location-search-anchor">
            <div className="location-search-box">
              <Search size={16} aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) {
                    setOpen(true);
                  }
                }}
                placeholder={placeholder ?? t('searchLocationPlaceholder')}
                autoCorrect="off"
                autoCapitalize="none"
              />
              {loading || resolving ? (
                <span className="delivery-spinner" aria-label="Loading" />
              ) : query.length > 0 ? (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Clear"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setOpen(false);
                  }}>
                  <X size={16} aria-hidden />
                </button>
              ) : null}
            </div>

            {showDropdown ? (
              <ul className="location-search-dropdown" role="listbox">
                {results.length === 0 && !loading ? (
                  <li className="delivery-empty">{t('noLocationResults')}</li>
                ) : (
                  results.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="delivery-result"
                        disabled={resolving}
                        onClick={() => void onPick(item)}>
                        <span className="delivery-result-text">
                          <strong>{item.main_text}</strong>
                          {item.secondary_text ? (
                            <span>{item.secondary_text}</span>
                          ) : null}
                        </span>
                        <MapPin
                          size={16}
                          aria-hidden
                          className="delivery-result-pin"
                        />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>

          {error ? <p className="delivery-error">{error}</p> : null}
        </>
      )}
    </div>
  );
}
