import {useMemo, useState, type FC} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import Column from '@app/components/column';
import LocationSearchBar from '@app/components/location-search-bar';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {searchResultToPublicLocation} from '@app/constants/jordanLocations';
import type {LocationSearchResult} from '@app/services/google/googlePlacesSearchService';
import {getTextAlign} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import type {PublicOrderLocation} from '@app/constants/jordanLocations';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MapLocationPicker'
>;
type ScreenRoute = RouteProp<RootStackParamList, 'MapLocationPicker'>;

function fromPublicLocation(
  location: PublicOrderLocation | null | undefined,
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

const MapLocationPickerScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const {
    kind,
    returnTo = 'CreateOrder',
    pickupLocation,
    dropoffLocation,
    profileLocation,
  } = route.params;

  const initial =
    kind === 'profile'
      ? profileLocation
      : kind === 'pickup'
        ? pickupLocation
        : dropoffLocation;
  const [selected, setSelected] = useState<LocationSearchResult | null>(() =>
    fromPublicLocation(initial),
  );
  const [note, setNote] = useState(initial?.note ?? '');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        noteBox: {
          minHeight: getHeight(56),
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.ui.border,
          paddingHorizontal: getWidth(space.sm),
          paddingVertical: getHeight(space.xs),
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.04)'
            : theme.backgrounds.background,
        },
        noteInput: {
          minHeight: getHeight(44),
          color: theme.typography.primary,
          fontSize: fontSize.body,
          textAlign: getTextAlign(direction),
          textAlignVertical: 'top',
          ...cairoFont('medium'),
        },
        hint: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          textAlign: getTextAlign(direction),
          ...cairoFont('regular'),
        },
      }),
    [direction, isDark, theme],
  );

  const title =
    kind === 'profile'
      ? t('editProfileLocation')
      : kind === 'pickup'
        ? t('editPickupLocation')
        : t('editDropoffLocation');

  const onSave = () => {
    if (!selected) {
      showToast(ToastType.error, t('orderFormRequired'));
      return;
    }
    const location = searchResultToPublicLocation(
      selected,
      note.trim() ? note.trim() : null,
    );

    if (returnTo === 'RegisterClientInvite') {
      navigation.popTo(
        'RegisterClientInvite',
        {defaultLocation: location},
        {merge: true},
      );
      return;
    }

    if (returnTo === 'CompleteClientProfile' || kind === 'profile') {
      navigation.popTo(
        'CompleteClientProfile',
        {defaultLocation: location},
        {merge: true},
      );
      return;
    }

    navigation.popTo(
      'CreateOrder',
      kind === 'pickup'
        ? {
            pickupLocation: location,
            dropoffLocation: dropoffLocation ?? undefined,
          }
        : {
            pickupLocation: pickupLocation ?? undefined,
            dropoffLocation: location,
          },
      {merge: true},
    );
  };

  return (
    <ScreenContainer keyboardAvoiding navTitle={title} scrollable={false}>
      <Column gap={space.xs}>
        <AppText style={styles.hint}>{t('publicLocationHint')}</AppText>
        <LocationSearchBar selected={selected} onSelect={setSelected} />
        <AppText style={styles.hint}>{t('orderNotesOptional')}</AppText>
        <View style={styles.noteBox}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('orderNotesPlaceholder')}
            placeholderTextColor={theme.typography.secondary}
            multiline
            style={styles.noteInput}
          />
        </View>
        <AppButton
          title={t('saveLocation')}
          onPress={onSave}
          disabled={!selected}
        />
      </Column>
    </ScreenContainer>
  );
};

export default MapLocationPickerScreen;
