import {useEffect, useMemo, useRef, useState, type FC} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Check, MapPin, Search, X} from 'lucide-react-native';
import AppText from '@app/components/app-text';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {hasGoogleMapsKey} from '@app/config/env';
import {
  resolveJordanPlace,
  searchJordanLocations,
  type LocationSearchResult,
  type LocationSearchSuggestion,
} from '@app/services/google/googlePlacesSearchService';
import {locationSearchBarStyles} from './styles';

const DEBOUNCE_MS = 400;

type Props = {
  selected: LocationSearchResult | null;
  onSelect: (result: LocationSearchResult | null) => void;
  placeholder?: string;
};

const LocationSearchBar: FC<Props> = ({
  selected,
  onSelect,
  placeholder,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction, language} = useLanguage();
  const isDark = themeType === 'dark';
  const locale = language === 'ar' ? 'ar' : 'en';
  const styles = useMemo(
    () => locationSearchBarStyles(theme, direction, isDark),
    [direction, isDark, theme],
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);
  const requestIdRef = useRef(0);
  const inputRef = useRef<TextInput>(null);
  const gold = theme.brand.gold;

  useEffect(() => {
    if (!hasGoogleMapsKey()) {
      setError(t('googleMapsKeyMissing'));
    }
  }, [t]);

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
    <View style={styles.root}>
      {selected ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedIconWrap}>
              <Check color={gold} size={16} strokeWidth={2.6} />
            </View>
            <View style={styles.selectedBody}>
              <AppText style={styles.selectedBadge}>
                {t('locationSelected')}
              </AppText>
              <AppText style={styles.title}>{selectedTitle}</AppText>
              {selectedSubtitle ? (
                <AppText style={styles.subtitle}>{selectedSubtitle}</AppText>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={clearAll}
            style={styles.changeBtn}>
            <AppText style={styles.changeBtnText}>{t('changeLocation')}</AppText>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchAnchor}>
            <View style={styles.searchBox}>
              <Search color={theme.typography.secondary} size={16} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={text => {
                  setQuery(text);
                  setOpen(true);
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) {
                    setOpen(true);
                  }
                }}
                placeholder={placeholder ?? t('searchLocationPlaceholder')}
                placeholderTextColor={theme.typography.secondary}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {loading || resolving ? (
                <ActivityIndicator color={gold} size="small" />
              ) : query.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setQuery('');
                    setResults([]);
                    setOpen(false);
                  }}
                  style={styles.clear}
                  hitSlop={8}>
                  <X color={theme.typography.secondary} size={16} />
                </Pressable>
              ) : null}
            </View>

            {showDropdown ? (
              <ScrollView
                style={styles.dropdownOverlay}
                contentContainerStyle={styles.dropdownContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator>
                {results.length === 0 && !loading ? (
                  <AppText style={styles.empty}>
                    {t('noLocationResults')}
                  </AppText>
                ) : null}
                {results.map((item, index) => (
                  <Pressable
                    key={item.id}
                    style={({pressed}) => [
                      styles.row,
                      index === results.length - 1 && styles.rowLast,
                      pressed && styles.rowPressed,
                    ]}
                    disabled={resolving}
                    onPress={() => void onPick(item)}>
                    <View style={styles.rowText}>
                      <AppText style={styles.title} numberOfLines={1}>
                        {item.main_text}
                      </AppText>
                      {item.secondary_text ? (
                        <AppText style={styles.subtitle} numberOfLines={1}>
                          {item.secondary_text}
                        </AppText>
                      ) : null}
                    </View>
                    <MapPin
                      color={gold}
                      size={16}
                      strokeWidth={2.2}
                      style={styles.rowIcon}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
        </>
      )}
    </View>
  );
};

export default LocationSearchBar;
