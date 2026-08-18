import {useEffect, useMemo, useState, type FC} from 'react';
import {Alert, Pressable, TextInput, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Search,
} from 'lucide-react-native';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import CountryPhoneInput from '@app/components/country-phone-input';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {
  isValidNationalNumber,
  normalizeNationalDigits,
  toE164,
} from '@app/config/countries';
import {isRTL} from '@app/utils/directionalStyles';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {
  selectUserFullName,
  selectUserName,
  selectUserPhoneNumber,
  useUserStore,
} from '@app/features/user';
import {useLogout} from '@app/hooks/useAuth';
import {services} from '@app/services/dependencies';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '@app/constants/jordanLocations';
import {completeProfileStyles} from './CompleteClientProfile.styles';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CompleteClientProfile'
>;
type ScreenRoute = RouteProp<RootStackParamList, 'CompleteClientProfile'>;

const CompleteClientProfileScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const {t, i18n} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {countryIso} = useCountry();
  const setProfile = useUserStore(state => state.setProfile);
  const logout = useLogout();
  const userId = useUserStore(state => state.id);
  const role = useUserStore(state => state.role);
  const profileReady = useUserStore(state => state.profileReady);
  const profileComplete = useUserStore(state => state.profileComplete);
  const storedFullName = useUserStore(selectUserFullName);
  const storedName = useUserStore(selectUserName);
  const storedPhone = useUserStore(selectUserPhoneNumber);
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isDark = themeType === 'dark';
  const rtl = isRTL(direction);
  const styles = useMemo(
    () => completeProfileStyles(theme, direction, isDark),
    [direction, isDark, theme],
  );
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const gold = theme.brand.gold;

  useEffect(() => {
    if (!profileReady) {
      return;
    }
    if (role !== 'client' && role !== 'merchant') {
      navigation.replace('MainTabs');
      return;
    }
    if (profileComplete) {
      navigation.replace('MainTabs');
    }
  }, [navigation, profileComplete, profileReady, role]);

  const [fullName, setFullName] = useState(
    () => storedFullName?.trim() || storedName?.trim() || '',
  );
  const [phone, setPhone] = useState(() =>
    storedPhone ? normalizeNationalDigits(countryIso, storedPhone) : '',
  );
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(() =>
    Boolean(storedPhone && isValidNationalNumber(countryIso, normalizeNationalDigits(countryIso, storedPhone))),
  );
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState<string | null>(
    () =>
      storedPhone &&
      isValidNationalNumber(
        countryIso,
        normalizeNationalDigits(countryIso, storedPhone),
      )
        ? toE164(countryIso, normalizeNationalDigits(countryIso, storedPhone))
        : null,
  );
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [altPhone, setAltPhone] = useState('');
  const [location, setLocation] = useState<PublicOrderLocation | null>(null);
  const [locationNote, setLocationNote] = useState('');

  useEffect(() => {
    const next = route.params?.defaultLocation;
    if (!next) {
      return;
    }
    setLocation(next);
    if (next.note) {
      setLocationNote(next.note);
    }
    navigation.setParams({defaultLocation: undefined});
  }, [navigation, route.params?.defaultLocation]);

  useEffect(() => {
    if (!phoneVerified || !verifiedPhoneE164) {
      return;
    }
    const currentE164 = isValidNationalNumber(countryIso, phone)
      ? toE164(countryIso, phone)
      : '';
    if (currentE164 !== verifiedPhoneE164) {
      setPhoneVerified(false);
      setVerifiedPhoneE164(null);
      setOtpCode('');
      setDebugCode(null);
    }
  }, [countryIso, phone, phoneVerified, verifiedPhoneE164]);

  const requestOtp = useMutation({
    mutationFn: async () => {
      if (!isValidNationalNumber(countryIso, phone)) {
        throw new Error('invalid-phone');
      }
      return services.workflow.requestProfilePhoneOtp(
        toE164(countryIso, phone),
      );
    },
    onSuccess: result => {
      setPhoneVerified(false);
      setVerifiedPhoneE164(null);
      const nextCode = result.debugCode?.trim() || '';
      setOtpCode(nextCode);
      setDebugCode(nextCode || null);
      if (result.delivery === 'whatsapp') {
        showToast(ToastType.success, t('otpSentWhatsApp'));
        return;
      }
      showToast(ToastType.success, t('otpSentDebug'));
      if (nextCode) {
        Alert.alert(t('otpDebugTitle'), t('otpDebugHint', {code: nextCode}));
      }
    },
    onError: error => {
      showToast(
        ToastType.error,
        t(getWorkflowErrorTranslationKey(error)),
      );
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      if (!isValidNationalNumber(countryIso, phone)) {
        throw new Error('invalid-phone');
      }
      if (!otpCode.trim()) {
        throw new Error('missing-code');
      }
      return services.workflow.verifyProfilePhoneOtp(
        toE164(countryIso, phone),
        otpCode.trim(),
      );
    },
    onSuccess: result => {
      setPhoneVerified(true);
      setVerifiedPhoneE164(result.phoneNumber);
      setDebugCode(null);
      showToast(ToastType.success, t('otpVerified'));
    },
    onError: () => showToast(ToastType.error, t('otpVerifyFailed')),
  });

  const completeProfile = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) {
        throw new Error('missing-name');
      }
      if (!phoneVerified || !verifiedPhoneE164) {
        throw new Error('phone-unverified');
      }
      if (!isPublicLocationFilled(location)) {
        throw new Error('missing-location');
      }
      if (altPhone.trim() && !isValidNationalNumber(countryIso, altPhone)) {
        throw new Error('invalid-alt-phone');
      }
      return services.workflow.completeIssuedProfile({
        fullName: fullName.trim(),
        phoneNumber: verifiedPhoneE164,
        defaultLocation: {
          ...location!,
          note: locationNote.trim() || location!.note || null,
        },
        locationNote: locationNote.trim() || undefined,
        altPhoneNumber: altPhone.trim()
          ? toE164(countryIso, altPhone)
          : undefined,
      });
    },
    onSuccess: async () => {
      if (userId) {
        const profile = await services.workflow.repository.getUserProfile(
          userId,
        );
        setProfile(profile);
      }
      showToast(ToastType.success, t('profileCompletedToast'));
      navigation.replace('MainTabs');
    },
    onError: () => showToast(ToastType.error, t('profileCompleteFailed')),
  });

  const openLocation = () => {
    navigation.push('MapLocationPicker', {
      kind: 'profile',
      returnTo: 'CompleteClientProfile',
      pickupLocation: null,
      dropoffLocation: null,
      profileLocation: location,
    });
  };

  const locationTitle = (() => {
    if (!isPublicLocationFilled(location)) {
      return '';
    }
    const place = (
      (locale === 'ar' ? location.placeNameAr : location.placeNameEn) || ''
    ).trim();
    const area = (
      (locale === 'ar' ? location.areaAr : location.areaEn) || ''
    ).trim();
    return place || area || formatPublicLocation(location, locale);
  })();

  const locationSubtitle = (() => {
    if (!isPublicLocationFilled(location)) {
      return '';
    }
    const area = (
      (locale === 'ar' ? location.areaAr : location.areaEn) || ''
    ).trim();
    const gov = (
      (locale === 'ar' ? location.governorateAr : location.governorateEn) ||
      ''
    ).trim();
    return [area !== locationTitle ? area : '', gov]
      .filter(Boolean)
      .join(' · ');
  })();

  const canSubmit =
    fullName.trim().length > 0 &&
    phoneVerified &&
    isPublicLocationFilled(location) &&
    !completeProfile.isPending;

  const cancelCompletion = () => {
    Alert.alert(
      t('cancelCompleteProfileTitle'),
      t('cancelCompleteProfileBody'),
      [
        {text: t('cancel'), style: 'cancel'},
        {
          text: t('confirmCancelCompleteProfile'),
          style: 'destructive',
          onPress: () => {
            logout.mutate(undefined, {
              onSuccess: () => {
                navigation.reset({
                  index: 0,
                  routes: [{name: 'Login'}],
                });
              },
              onError: () =>
                showToast(ToastType.error, t('workflowRequestFailed')),
            });
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer
      keyboardAvoiding
      navTitle={t('completeClientProfileTitle')}
      showBack
      onBackPress={cancelCompletion}>
      <View style={styles.stack}>
        <AppText style={styles.intro}>{t('completeClientProfileIntro')}</AppText>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>
            {t('completeProfileBasics')}
          </AppText>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{t('clientFullName')}</AppText>
            <View style={styles.fieldBox}>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('clientFullNamePlaceholder')}
                placeholderTextColor={theme.typography.secondary}
                style={styles.fieldInput}
              />
            </View>
            <AppText style={styles.hint}>{t('clientFullNameHint')}</AppText>
          </View>

          <CountryPhoneInput
            label={t('clientMobileNumber')}
            value={phone}
            onChangeText={setPhone}
            required
          />

          <View style={styles.otpRow}>
            <AppButton
              title={t('sendWhatsAppOtp')}
              onPress={() => requestOtp.mutate()}
              loading={requestOtp.isPending}
              disabled={
                requestOtp.isPending ||
                !isValidNationalNumber(countryIso, phone)
              }
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{t('otpCode')}</AppText>
            <View style={styles.fieldBox}>
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="••••••"
                placeholderTextColor={theme.typography.secondary}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.fieldInput}
              />
            </View>
            {debugCode ? (
              <View style={styles.debugOtpBanner}>
                <AppText style={styles.debugOtpTitle}>{t('otpDebugTitle')}</AppText>
                <AppText style={styles.debugOtpCode}>{debugCode}</AppText>
                <AppText style={styles.debugOtpHint}>
                  {t('otpWhatsAppNotConfiguredHint')}
                </AppText>
              </View>
            ) : null}
            {phoneVerified ? (
              <AppText style={styles.verifiedText}>{t('otpVerified')}</AppText>
            ) : (
              <View style={styles.otpRow}>
                <AppButton
                  title={t('verifyOtp')}
                  onPress={() => verifyOtp.mutate()}
                  loading={verifyOtp.isPending}
                  disabled={verifyOtp.isPending || otpCode.trim().length < 4}
                />
              </View>
            )}
          </View>

          <CountryPhoneInput
            label={t('clientAltPhoneOptional')}
            value={altPhone}
            onChangeText={setAltPhone}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>
            {t('completeProfileLocation')}
          </AppText>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>{t('locationField')}</AppText>
            {isPublicLocationFilled(location) ? (
              <Pressable
                accessibilityRole="button"
                onPress={openLocation}
                style={styles.locationBody}>
                <View style={styles.locationTextCol}>
                  <AppText style={styles.locationTitle}>{locationTitle}</AppText>
                  {locationSubtitle ? (
                    <AppText style={styles.locationSub}>
                      {locationSubtitle}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.locationFooter}>
                  <View style={styles.pinBadge}>
                    <MapPinned color="#FFFFFF" size={18} strokeWidth={2.4} />
                  </View>
                  <View style={styles.changeBtn}>
                    <AppText style={styles.changeText}>
                      {t('changeLocation')}
                    </AppText>
                    <Chevron
                      color={theme.typography.secondary}
                      size={18}
                      strokeWidth={2.2}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={openLocation}
                style={styles.emptySearch}>
                <Search
                  color={theme.typography.secondary}
                  size={18}
                  strokeWidth={2.2}
                />
                <AppText style={styles.emptySearchText}>
                  {t('selectProfileLocation')}
                </AppText>
                <Chevron
                  color={theme.typography.secondary}
                  size={18}
                  strokeWidth={2.2}
                />
              </Pressable>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.fieldLabel}>
              {t('recipientLandmark')}
            </AppText>
            <View style={styles.fieldBox}>
              <TextInput
                value={locationNote}
                onChangeText={setLocationNote}
                placeholder={t('recipientLandmarkPlaceholder')}
                placeholderTextColor={theme.typography.secondary}
                style={styles.fieldInput}
              />
            </View>
          </View>
        </View>

        <AppButton
          title={t('saveClientProfile')}
          onPress={() => completeProfile.mutate()}
          loading={completeProfile.isPending}
          disabled={!canSubmit}
        />
        <AppButton
          title={t('cancelCompleteProfile')}
          variant="secondary"
          onPress={cancelCompletion}
          loading={logout.isPending}
          disabled={logout.isPending || completeProfile.isPending}
        />
        <AppText style={[styles.hint, {color: gold}]}>
          {t('completeClientProfileRequiredHint')}
        </AppText>
      </View>
    </ScreenContainer>
  );
};

export default CompleteClientProfileScreen;
