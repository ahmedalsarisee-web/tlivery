import {useEffect, useMemo, useState, type FC, type ReactNode} from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {
  Building2,
  ChevronDown,
  Crosshair,
  FileText,
  Home,
  MapPin,
  MapPinned,
  Package,
  User,
  UserRound,
} from 'lucide-react-native';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {
  isValidNationalNumber,
  normalizeNationalDigits,
  phonePlaceholder,
  toE164,
} from '@app/config/countries';
import {showToast} from '@app/utils/showToast';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {ToastType} from '@app/enums/ToastType';
import {useCreateOrder, useCanCreateOrder} from '@app/hooks/useOrders';
import {
  selectUserName,
  selectUserPhoneNumber,
  useUserStore,
} from '@app/features/user';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '@app/constants/jordanLocations';
import {createOrderStyles} from './CreateOrder.styles';

const AMMAN_REGION = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateOrder'
>;
type ScreenRoute = RouteProp<RootStackParamList, 'CreateOrder'>;
type SectionKey = 'pickup' | 'recipient' | 'shipment';

const CreateOrderScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const {t, i18n} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {country, countryIso} = useCountry();
  const canCreate = useCanCreateOrder();
  const createOrder = useCreateOrder();
  const profileName = useUserStore(selectUserName);
  const profilePhone = useUserStore(selectUserPhoneNumber);
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => createOrderStyles(theme, direction, isDark),
    [direction, isDark, theme],
  );

  const gold = theme.brand.gold;
  const iconNavy = isDark ? gold : theme.brand.navy;
  const accentOrange = '#E8954A';

  const [pickupPersonName, setPickupPersonName] = useState('');
  const [pickupPersonPhone, setPickupPersonPhone] = useState('');
  const [useMyProfile, setUseMyProfile] = useState(false);
  const [pickupAddressDetail, setPickupAddressDetail] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [dropoffAddressDetail, setDropoffAddressDetail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupLocation, setPickupLocation] =
    useState<PublicOrderLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] =
    useState<PublicOrderLocation | null>(null);
  const [amount, setAmount] = useState('');
  const [isCod, setIsCod] = useState(true);
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeightDimensions, setPackageWeightDimensions] = useState('');
  const [fragile, setFragile] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<SectionKey>('pickup');

  const applyProfileInfo = () => {
    const nextName = profileName?.trim() ?? '';
    const nextPhone = profilePhone
      ? normalizeNationalDigits(countryIso, profilePhone)
      : '';
    if (!nextName && !nextPhone) {
      showToast(ToastType.error, t('useMyProfileInfoEmpty'));
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (nextName) {
      setPickupPersonName(nextName);
    }
    if (nextPhone) {
      setPickupPersonPhone(nextPhone);
    }
    setUseMyProfile(true);
  };

  const clearProfileLink = () => {
    setUseMyProfile(false);
  };

  const selectSection = (key: SectionKey) => {
    if (key === activeSection) {
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSection(key);
  };

  const tabs: Array<{
    key: SectionKey;
    short: string;
    title: string;
    lead: string;
    icon: ReactNode;
  }> = [
    {
      key: 'pickup',
      short: t('createOrderTabPickup'),
      title: t('pickupInfoCard'),
      lead: t('createOrderPickupLead'),
      icon: (
        <MapPinned color={accentOrange} size={22} strokeWidth={2.2} />
      ),
    },
    {
      key: 'recipient',
      short: t('createOrderTabDelivery'),
      title: t('deliveryInfoCard'),
      lead: t('createOrderDeliveryLead'),
      icon: <UserRound color={accentOrange} size={22} strokeWidth={2.2} />,
    },
    {
      key: 'shipment',
      short: t('createOrderTabShipment'),
      title: t('shipmentInfoCard'),
      lead: t('createOrderShipmentLead'),
      icon: <Package color={accentOrange} size={22} strokeWidth={2.2} />,
    },
  ];
  const activeTab = tabs.find(tab => tab.key === activeSection) ?? tabs[0];

  useEffect(() => {
    const nextPickup = route.params?.pickupLocation;
    const nextDropoff = route.params?.dropoffLocation;
    if (!nextPickup && !nextDropoff) {
      return;
    }
    if (nextPickup) {
      setPickupLocation(nextPickup);
      setActiveSection('pickup');
      const place = (
        (locale === 'ar' ? nextPickup.placeNameAr : nextPickup.placeNameEn) ||
        ''
      ).trim();
      if (place) {
        setPickupAddressDetail(prev => prev.trim() || place);
      }
      if (typeof nextPickup.note === 'string' && nextPickup.note.trim()) {
        setPickupNotes(prev => prev.trim() || nextPickup.note!.trim());
      }
    }
    if (nextDropoff) {
      setDropoffLocation(nextDropoff);
      setActiveSection('recipient');
      const place = (
        (locale === 'ar' ? nextDropoff.placeNameAr : nextDropoff.placeNameEn) ||
        ''
      ).trim();
      if (place) {
        setDropoffAddressDetail(prev => prev.trim() || place);
      }
      if (typeof nextDropoff.note === 'string' && nextDropoff.note.trim()) {
        setLandmark(prev => prev.trim() || nextDropoff.note!.trim());
      }
    }
    navigation.setParams({
      pickupLocation: undefined,
      dropoffLocation: undefined,
    });
  }, [
    locale,
    navigation,
    route.params?.dropoffLocation,
    route.params?.pickupLocation,
  ]);

  useEffect(() => {
    if (!useMyProfile) {
      return;
    }
    const nextName = profileName?.trim() ?? '';
    const nextPhone = profilePhone
      ? normalizeNationalDigits(countryIso, profilePhone)
      : '';
    if (nextName) {
      setPickupPersonName(nextName);
    }
    if (nextPhone) {
      setPickupPersonPhone(nextPhone);
    }
  }, [countryIso, profileName, profilePhone, useMyProfile]);

  const hasAnyOrderDetail =
    Boolean(pickupPersonName.trim()) ||
    Boolean(pickupPersonPhone.trim()) ||
    Boolean(pickupAddressDetail.trim()) ||
    Boolean(pickupNotes.trim()) ||
    isPublicLocationFilled(pickupLocation) ||
    Boolean(customerName.trim()) ||
    Boolean(customerPhone.trim()) ||
    Boolean(altPhone.trim()) ||
    Boolean(dropoffAddressDetail.trim()) ||
    Boolean(landmark.trim()) ||
    isPublicLocationFilled(dropoffLocation) ||
    Boolean(packageDescription.trim()) ||
    Boolean(packageWeightDimensions.trim()) ||
    fragile ||
    Boolean(amount.trim()) ||
    Boolean(notes.trim());

  const openLocation = (kind: 'pickup' | 'dropoff') => {
    navigation.push('MapLocationPicker', {
      kind,
      pickupLocation: pickupLocation ?? null,
      dropoffLocation: dropoffLocation
        ? {
            ...dropoffLocation,
            note: landmark.trim() || dropoffLocation.note || null,
          }
        : null,
    });
  };

  const buildOrderNotes = (): string => {
    const lines: string[] = [];
    if (pickupPersonName.trim() || pickupPersonPhone.trim()) {
      const phone = pickupPersonPhone.trim()
        ? toE164(countryIso, pickupPersonPhone)
        : '';
      lines.push(
        `${t('pickupInfoCard')}: ${[pickupPersonName.trim(), phone]
          .filter(Boolean)
          .join(' · ')}`,
      );
    }
    if (pickupNotes.trim()) {
      lines.push(`${t('partyNotesOptional')}: ${pickupNotes.trim()}`);
    }
    if (pickupAddressDetail.trim()) {
      lines.push(`${t('detailedAddress')}: ${pickupAddressDetail.trim()}`);
    }
    if (dropoffAddressDetail.trim()) {
      lines.push(
        `${t('deliveryInfoCard')} · ${t('detailedAddress')}: ${dropoffAddressDetail.trim()}`,
      );
    }
    const hasShipmentDetail =
      Boolean(packageDescription.trim()) ||
      Boolean(packageWeightDimensions.trim()) ||
      fragile ||
      Boolean(amount.trim()) ||
      Boolean(notes.trim());
    if (hasShipmentDetail) {
      if (packageDescription.trim()) {
        lines.push(`${t('packageDescription')}: ${packageDescription.trim()}`);
      }
      if (packageWeightDimensions.trim()) {
        lines.push(
          `${t('packageWeightDimensions')}: ${packageWeightDimensions.trim()}`,
        );
      }
      if (fragile) {
        lines.push(t('packageFragile'));
      }
    }
    if (altPhone.trim()) {
      lines.push(
        `${t('recipientAltPhone')}: ${toE164(countryIso, altPhone)}`,
      );
    }
    if (landmark.trim()) {
      lines.push(`${t('recipientLandmark')}: ${landmark.trim()}`);
    }
    if (notes.trim()) {
      lines.push(`${t('orderNotesOptional')}: ${notes.trim()}`);
    }
    return lines.join('\n');
  };

  const onSubmit = () => {
    if (!canCreate) {
      showToast(ToastType.error, t('workflowRequestFailed'));
      return;
    }
    if (!hasAnyOrderDetail) {
      showToast(ToastType.error, t('orderFormAtLeastOne'));
      return;
    }
    if (
      pickupPersonPhone.trim() &&
      !isValidNationalNumber(countryIso, pickupPersonPhone)
    ) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (
      customerPhone.trim() &&
      !isValidNationalNumber(countryIso, customerPhone)
    ) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (altPhone.trim() && !isValidNationalNumber(countryIso, altPhone)) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }

    const amountJod = Number.parseFloat(amount);
    const pickupContact = [
      pickupPersonName.trim(),
      pickupPersonPhone.trim()
        ? toE164(countryIso, pickupPersonPhone)
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const pickupWithNote = isPublicLocationFilled(pickupLocation)
      ? ({
          ...pickupLocation,
          countryCode: 'JO' as const,
          placeNameAr:
            pickupAddressDetail.trim() ||
            pickupLocation.placeNameAr ||
            null,
          placeNameEn:
            pickupAddressDetail.trim() ||
            pickupLocation.placeNameEn ||
            null,
          note:
            [pickupContact, pickupNotes.trim()].filter(Boolean).join(' · ') ||
            pickupLocation.note ||
            null,
        } satisfies PublicOrderLocation)
      : null;
    const dropoffWithNote = isPublicLocationFilled(dropoffLocation)
      ? ({
          ...dropoffLocation,
          countryCode: 'JO' as const,
          placeNameAr:
            dropoffAddressDetail.trim() ||
            dropoffLocation.placeNameAr ||
            null,
          placeNameEn:
            dropoffAddressDetail.trim() ||
            dropoffLocation.placeNameEn ||
            null,
          note: landmark.trim() || dropoffLocation.note || null,
        } satisfies PublicOrderLocation)
      : null;
    const composedNotes = buildOrderNotes();
    const addressOnlyNotes = [
      !pickupWithNote && pickupAddressDetail.trim()
        ? `${t('pickupInfoCard')}: ${pickupAddressDetail.trim()}`
        : '',
      !dropoffWithNote && dropoffAddressDetail.trim()
        ? `${t('deliveryInfoCard')}: ${dropoffAddressDetail.trim()}`
        : '',
      pickupContact && !pickupWithNote
        ? `${t('pickupInfoCard')}: ${pickupContact}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    const finalNotes = [composedNotes, addressOnlyNotes]
      .filter(Boolean)
      .join('\n');

    createOrder.mutate(
      {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim()
          ? toE164(countryIso, customerPhone)
          : '',
        pickupLocation: pickupWithNote,
        dropoffLocation: dropoffWithNote,
        pickupAddress: pickupWithNote
          ? formatPublicLocation(pickupWithNote, locale)
          : pickupAddressDetail.trim(),
        dropoffAddress: dropoffWithNote
          ? formatPublicLocation(dropoffWithNote, locale)
          : dropoffAddressDetail.trim() || landmark.trim(),
        amountJod: Number.isFinite(amountJod) ? amountJod : 0,
        isCod,
        notes: finalNotes || undefined,
      },
      {
        onSuccess: result => {
          showToast(
            ToastType.success,
            t('orderCreatedToast', {defaultValue: 'Order created'}),
          );
          navigation.replace('OrderDetails', {orderId: result.orderId});
        },
        onError: error =>
          showToast(
            ToastType.error,
            t(getWorkflowErrorTranslationKey(error)),
          ),
      },
    );
  };

  const pickupGovLabel = (() => {
    if (!isPublicLocationFilled(pickupLocation)) {
      return '';
    }
    return (
      (locale === 'ar'
        ? pickupLocation.governorateAr
        : pickupLocation.governorateEn) || ''
    ).trim();
  })();

  const pickupAreaLabel = (() => {
    if (!isPublicLocationFilled(pickupLocation)) {
      return '';
    }
    return (
      (locale === 'ar' ? pickupLocation.areaAr : pickupLocation.areaEn) || ''
    ).trim();
  })();

  const pickupMapRegion =
    typeof pickupLocation?.lat === 'number' &&
    typeof pickupLocation?.lng === 'number'
      ? {
          latitude: pickupLocation.lat,
          longitude: pickupLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : AMMAN_REGION;

  const pickupBody = (
    <View style={styles.pickupForm}>
      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('pickupPersonName')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={pickupPersonName}
            onChangeText={value => {
              setPickupPersonName(value);
              if (useMyProfile) {
                clearProfileLink();
              }
            }}
            placeholder={t('pickupPersonNamePlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <User color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('pickupPersonPhone')}</AppText>
        <View style={styles.pickupField}>
          <View style={styles.pickupPhonePrefix}>
            <AppText style={styles.pickupFlag}>{country.flag}</AppText>
            <AppText style={styles.pickupDial}>{country.dialCode}</AppText>
          </View>
          <TextInput
            value={pickupPersonPhone}
            onChangeText={value => {
              setPickupPersonPhone(
                normalizeNationalDigits(countryIso, value),
              );
              if (useMyProfile) {
                clearProfileLink();
              }
            }}
            placeholder={phonePlaceholder(countryIso)}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={country.nationalLength}
            style={styles.pickupPhoneInput}
          />
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('detailedAddress')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={pickupAddressDetail}
            onChangeText={setPickupAddressDetail}
            placeholder={t('detailedAddressPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <Home color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <View style={styles.pickupRow}>
        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('governorate')}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => openLocation('pickup')}
            style={({pressed}) => [
              styles.pickupField,
              pressed && styles.pickupFieldPressed,
            ]}>
            <ChevronDown color="#94A3B8" size={15} strokeWidth={2.2} />
            <AppText
              style={
                pickupGovLabel
                  ? styles.pickupValueText
                  : styles.pickupPlaceholder
              }
              numberOfLines={1}>
              {pickupGovLabel || t('selectGovernorate')}
            </AppText>
            <View style={styles.pickupFieldIconSlot}>
              <MapPin color={iconNavy} size={17} strokeWidth={2} />
            </View>
          </Pressable>
        </View>

        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('areaNeighborhood')}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => openLocation('pickup')}
            style={({pressed}) => [
              styles.pickupField,
              pressed && styles.pickupFieldPressed,
            ]}>
            <ChevronDown color="#94A3B8" size={15} strokeWidth={2.2} />
            <AppText
              style={
                pickupAreaLabel
                  ? styles.pickupValueText
                  : styles.pickupPlaceholder
              }
              numberOfLines={1}>
              {pickupAreaLabel || t('selectArea')}
            </AppText>
            <View style={styles.pickupFieldIconSlot}>
              <Building2 color={iconNavy} size={17} strokeWidth={2} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapPreviewWrap}>
        <MapView
          style={styles.mapPreview}
          provider={PROVIDER_GOOGLE}
          region={pickupMapRegion}
          pointerEvents="none"
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}>
          {typeof pickupLocation?.lat === 'number' &&
          typeof pickupLocation?.lng === 'number' ? (
            <Marker
              coordinate={{
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng,
              }}
              pinColor="#0F172A"
            />
          ) : (
            <Marker
              coordinate={{
                latitude: AMMAN_REGION.latitude,
                longitude: AMMAN_REGION.longitude,
              }}
              pinColor="#0F172A"
            />
          )}
        </MapView>
        <Pressable
          accessibilityRole="button"
          onPress={() => openLocation('pickup')}
          style={styles.mapCta}>
          <AppText style={styles.mapCtaText}>{t('selectOnMap')}</AppText>
          <Crosshair color="#0F172A" size={14} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('partyNotesOptional')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={pickupNotes}
            onChangeText={setPickupNotes}
            placeholder={t('partyNotesPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <FileText color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: useMyProfile}}
        onPress={() => {
          if (useMyProfile) {
            clearProfileLink();
          } else {
            applyProfileInfo();
          }
        }}
        style={[
          styles.profileToggle,
          useMyProfile && styles.profileToggleActive,
        ]}>
        <AppText
          style={[
            styles.profileToggleText,
            useMyProfile && styles.profileToggleTextActive,
          ]}>
          {t('useMyProfileInfo')}
        </AppText>
        <View
          style={[
            styles.profileToggleDot,
            useMyProfile && styles.profileToggleDotActive,
          ]}
        />
      </Pressable>
    </View>
  );

  const dropoffGovLabel = (() => {
    if (!isPublicLocationFilled(dropoffLocation)) {
      return '';
    }
    return (
      (locale === 'ar'
        ? dropoffLocation.governorateAr
        : dropoffLocation.governorateEn) || ''
    ).trim();
  })();

  const dropoffAreaLabel = (() => {
    if (!isPublicLocationFilled(dropoffLocation)) {
      return '';
    }
    return (
      (locale === 'ar' ? dropoffLocation.areaAr : dropoffLocation.areaEn) || ''
    ).trim();
  })();

  const dropoffMapRegion =
    typeof dropoffLocation?.lat === 'number' &&
    typeof dropoffLocation?.lng === 'number'
      ? {
          latitude: dropoffLocation.lat,
          longitude: dropoffLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : AMMAN_REGION;

  const recipientBody = (
    <View style={styles.pickupForm}>
      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('customerName')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={t('customerNamePlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <User color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('customerPhone')}</AppText>
        <View style={styles.pickupField}>
          <View style={styles.pickupPhonePrefix}>
            <AppText style={styles.pickupFlag}>{country.flag}</AppText>
            <AppText style={styles.pickupDial}>{country.dialCode}</AppText>
          </View>
          <TextInput
            value={customerPhone}
            onChangeText={value =>
              setCustomerPhone(normalizeNationalDigits(countryIso, value))
            }
            placeholder={phonePlaceholder(countryIso)}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={country.nationalLength}
            style={styles.pickupPhoneInput}
          />
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('recipientAltPhone')}</AppText>
        <View style={styles.pickupField}>
          <View style={styles.pickupPhonePrefix}>
            <AppText style={styles.pickupFlag}>{country.flag}</AppText>
            <AppText style={styles.pickupDial}>{country.dialCode}</AppText>
          </View>
          <TextInput
            value={altPhone}
            onChangeText={value =>
              setAltPhone(normalizeNationalDigits(countryIso, value))
            }
            placeholder={phonePlaceholder(countryIso)}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={country.nationalLength}
            style={styles.pickupPhoneInput}
          />
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('detailedAddress')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={dropoffAddressDetail}
            onChangeText={setDropoffAddressDetail}
            placeholder={t('detailedAddressPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <Home color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <View style={styles.pickupRow}>
        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('governorate')}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => openLocation('dropoff')}
            style={({pressed}) => [
              styles.pickupField,
              pressed && styles.pickupFieldPressed,
            ]}>
            <ChevronDown color="#94A3B8" size={15} strokeWidth={2.2} />
            <AppText
              style={
                dropoffGovLabel
                  ? styles.pickupValueText
                  : styles.pickupPlaceholder
              }
              numberOfLines={1}>
              {dropoffGovLabel || t('selectGovernorate')}
            </AppText>
            <View style={styles.pickupFieldIconSlot}>
              <MapPin color={iconNavy} size={17} strokeWidth={2} />
            </View>
          </Pressable>
        </View>

        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('areaNeighborhood')}</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => openLocation('dropoff')}
            style={({pressed}) => [
              styles.pickupField,
              pressed && styles.pickupFieldPressed,
            ]}>
            <ChevronDown color="#94A3B8" size={15} strokeWidth={2.2} />
            <AppText
              style={
                dropoffAreaLabel
                  ? styles.pickupValueText
                  : styles.pickupPlaceholder
              }
              numberOfLines={1}>
              {dropoffAreaLabel || t('selectArea')}
            </AppText>
            <View style={styles.pickupFieldIconSlot}>
              <Building2 color={iconNavy} size={17} strokeWidth={2} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapPreviewWrap}>
        <MapView
          style={styles.mapPreview}
          provider={PROVIDER_GOOGLE}
          region={dropoffMapRegion}
          pointerEvents="none"
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}>
          <Marker
            coordinate={{
              latitude:
                typeof dropoffLocation?.lat === 'number'
                  ? dropoffLocation.lat
                  : AMMAN_REGION.latitude,
              longitude:
                typeof dropoffLocation?.lng === 'number'
                  ? dropoffLocation.lng
                  : AMMAN_REGION.longitude,
            }}
            pinColor="#0F172A"
          />
        </MapView>
        <Pressable
          accessibilityRole="button"
          onPress={() => openLocation('dropoff')}
          style={styles.mapCta}>
          <AppText style={styles.mapCtaText}>{t('selectOnMap')}</AppText>
          <Crosshair color="#0F172A" size={14} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('recipientLandmark')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder={t('recipientLandmarkPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <FileText color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>
    </View>
  );

  const shipmentBody = (
    <View style={styles.pickupForm}>
      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('packageDescription')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={packageDescription}
            onChangeText={setPackageDescription}
            placeholder={t('packageDescriptionPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <Package color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>
          {t('packageWeightDimensions')}
        </AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={packageWeightDimensions}
            onChangeText={setPackageWeightDimensions}
            placeholder={t('packageWeightDimensionsPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <Package color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected: fragile}}
        onPress={() => setFragile(prev => !prev)}
        style={[
          styles.pickupToggleRow,
          fragile && styles.pickupToggleRowActive,
        ]}>
        <AppText
          style={[
            styles.pickupToggleText,
            fragile && styles.pickupToggleTextActive,
          ]}>
          {t('packageFragile')}
        </AppText>
        <View
          style={[
            styles.pickupToggleDot,
            fragile && styles.pickupToggleDotActive,
          ]}
        />
      </Pressable>

      <View style={styles.pickupRow}>
        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('amountJod')}</AppText>
          <View style={styles.pickupField}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              style={styles.pickupInput}
            />
          </View>
        </View>
        <View style={styles.pickupCol}>
          <AppText style={styles.pickupLabel}>{t('paymentMethod')}</AppText>
          <View style={styles.pickupPayTrack}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: isCod}}
              onPress={() => setIsCod(true)}
              style={[
                styles.pickupPayOption,
                isCod && styles.pickupPayOptionActive,
              ]}>
              <AppText
                style={[
                  styles.pickupPayText,
                  isCod && styles.pickupPayTextActive,
                ]}
                numberOfLines={1}>
                {t('cod')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: !isCod}}
              onPress={() => setIsCod(false)}
              style={[
                styles.pickupPayOption,
                !isCod && styles.pickupPayOptionActive,
              ]}>
              <AppText
                style={[
                  styles.pickupPayText,
                  !isCod && styles.pickupPayTextActive,
                ]}
                numberOfLines={1}>
                {t('paymentPrepaid')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.pickupColFull}>
        <AppText style={styles.pickupLabel}>{t('orderNotesOptional')}</AppText>
        <View style={styles.pickupField}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('orderNotesPlaceholder')}
            placeholderTextColor="#94A3B8"
            style={styles.pickupInput}
          />
          <View style={styles.pickupFieldIconSlot}>
            <FileText color={iconNavy} size={17} strokeWidth={2} />
          </View>
        </View>
      </View>
    </View>
  );

  const sectionBody =
    activeSection === 'pickup'
      ? pickupBody
      : activeSection === 'recipient'
        ? recipientBody
        : shipmentBody;

  return (
    <ScreenContainer keyboardAvoiding navTitle={t('createOrder')}>
      <View style={styles.stack}>
        <View style={styles.hero}>
          <AppText style={styles.heroSubtitle}>{t('createOrderSubtitle')}</AppText>
        </View>

        <View style={styles.tabBar} accessibilityRole="tablist">
          <View style={styles.tabTrackWrap}>
            <View style={styles.tabTrackLine} pointerEvents="none" />
            <View style={styles.tabRow}>
              {tabs.map((tab, index) => {
                const active = activeSection === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="tab"
                    accessibilityState={{selected: active}}
                    onPress={() => selectSection(tab.key)}
                    style={styles.tab}>
                    <View
                      style={[styles.tabStep, active && styles.tabStepActive]}>
                      <AppText
                        style={[
                          styles.tabStepNum,
                          active && styles.tabStepNumActive,
                        ]}>
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText
                      style={[
                        styles.tabLabel,
                        active && styles.tabLabelActive,
                      ]}
                      numberOfLines={1}>
                      {tab.short}
                    </AppText>
                    <View
                      style={[
                        styles.tabUnderline,
                        active && styles.tabUnderlineActive,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.panelHeader}>
            <View
              style={[
                styles.panelHeaderIcon,
                activeSection === 'pickup' && styles.panelHeaderIconPickup,
                activeSection === 'recipient' &&
                  styles.panelHeaderIconDelivery,
                activeSection === 'shipment' &&
                  styles.panelHeaderIconShipment,
              ]}>
              {activeTab.icon}
            </View>
            <View style={styles.panelHeaderText}>
              <AppText style={styles.panelTitle}>{activeTab.title}</AppText>
              <AppText style={styles.panelLead}>{activeTab.lead}</AppText>
            </View>
          </View>
          <View style={styles.sectionBody}>{sectionBody}</View>
        </View>

        <View style={styles.submitWrap}>
          <AppButton
            title={t('submitDeliveryRequest')}
            onPress={onSubmit}
            loading={createOrder.isPending}
            disabled={createOrder.isPending || !canCreate || !hasAnyOrderDetail}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default CreateOrderScreen;
