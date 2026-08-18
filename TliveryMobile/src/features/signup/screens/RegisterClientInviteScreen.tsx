import {useEffect, useMemo, useRef, useState, type FC} from 'react';
import {Pressable, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Search,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {useUserStore} from '@app/features/user';
import type {RootStackParamList} from '@app/types/navigation';
import {isValidNationalNumber, toE164} from '@app/config/countries';
import {isRTL} from '@app/utils/directionalStyles';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '@app/constants/jordanLocations';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {services} from '@app/services/dependencies';
import {navigateAfterAuth} from '@app/navigation/navigateAfterAuth';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import CountryPhoneInput from '@app/components/country-phone-input';
import {createOrderStyles} from '@app/features/orders/screens/CreateOrder.styles';
import {signupStyles} from './Signup.styles';

type Route = RouteProp<RootStackParamList, 'RegisterClientInvite'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterClientInvite'>;

function phoneAccountExistsDetails(error: unknown): {email?: string} | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const code =
    'code' in error ? String((error as {code?: unknown}).code ?? '') : '';
  if (!code.includes('already-exists')) {
    return null;
  }
  const details =
    'details' in error
      ? ((error as {details?: {reason?: string; email?: string}}).details ??
        null)
      : null;
  if (details?.reason === 'phone-account-exists') {
    return {email: details.email};
  }
  const message =
    'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : '';
  if (message.toLowerCase().includes('sign in to join')) {
    return {email: details?.email};
  }
  return null;
}

const RegisterClientInviteScreen: FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction, language} = useLanguage();
  const {countryIso} = useCountry();
  const {t} = useTranslation();
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const locationStyles = useMemo(
    () => createOrderStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const Chevron = isRTL(direction) ? ChevronLeft : ChevronRight;

  const initialCode = (
    route.params?.inviteCode ??
    storage.getString(StorageKeys.PENDING_CLIENT_INVITE_CODE) ??
    ''
  )
    .trim()
    .toUpperCase();

  const phoneRef = useRef<TextInput>(null);
  const inviteRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultLocation, setDefaultLocation] =
    useState<PublicOrderLocation | null>(null);

  const normalizedCode = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const inviteQuery = useQuery({
    queryKey: ['clientInvite', normalizedCode],
    queryFn: () => services.workflow.getClientInvite(normalizedCode),
    enabled: normalizedCode.length >= 8,
    retry: false,
  });

  useEffect(() => {
    if (normalizedCode.length >= 8) {
      storage.set(StorageKeys.PENDING_CLIENT_INVITE_CODE, normalizedCode);
    }
  }, [normalizedCode]);

  useEffect(() => {
    const suggested = inviteQuery.data?.suggestedPhone;
    if (!suggested || phone) {
      return;
    }
    const digits = suggested.replace(/\D/g, '');
    if (digits.length >= 9) {
      setPhone(digits.slice(-9));
    }
  }, [inviteQuery.data?.suggestedPhone, phone]);

  useEffect(() => {
    const next = route.params?.defaultLocation;
    if (!next) {
      return;
    }
    setDefaultLocation(next);
    navigation.setParams({defaultLocation: undefined});
  }, [navigation, route.params?.defaultLocation]);

  const locationLines = useMemo(() => {
    if (!isPublicLocationFilled(defaultLocation)) {
      return {title: '', subtitle: ''};
    }
    const place = (
      (language === 'ar'
        ? defaultLocation.placeNameAr
        : defaultLocation.placeNameEn) || ''
    ).trim();
    const area = (
      (language === 'ar' ? defaultLocation.areaAr : defaultLocation.areaEn) ||
      ''
    ).trim();
    const gov = (
      (language === 'ar'
        ? defaultLocation.governorateAr
        : defaultLocation.governorateEn) || ''
    ).trim();
    const title =
      place || area || formatPublicLocation(defaultLocation, language);
    const subtitleParts: string[] = [];
    if (area && area !== title) {
      subtitleParts.push(area);
    }
    if (gov && gov !== title && gov !== area) {
      subtitleParts.push(gov);
    }
    return {title, subtitle: subtitleParts.join(' · ')};
  }, [defaultLocation, language]);

  const unavailable =
    inviteQuery.isSuccess && inviteQuery.data && !inviteQuery.data.available;

  const openLocationPicker = () => {
    navigation.push('MapLocationPicker', {
      kind: 'pickup',
      returnTo: 'RegisterClientInvite',
      pickupLocation: defaultLocation,
      dropoffLocation: null,
    });
  };

  const register = useMutation({
    mutationFn: async () => {
      if (normalizedCode.length < 6) {
        throw new Error('missing-invite');
      }
      if (!fullName.trim()) {
        throw new Error('invalid-name');
      }
      if (!isValidNationalNumber(countryIso, phone)) {
        throw new Error('invalid-phone');
      }
      if (password.length < 6) {
        throw new Error('weak-password');
      }
      if (password !== confirmPassword) {
        throw new Error('password-mismatch');
      }
      if (unavailable) {
        throw new Error('invite-unavailable');
      }
      const phoneNumber = toE164(countryIso, phone);
      const locationPayload = isPublicLocationFilled(defaultLocation)
        ? defaultLocation
        : undefined;
      try {
        const result = await services.workflow.registerClientWithInvite({
          inviteCode: normalizedCode,
          fullName: fullName.trim(),
          phoneNumber,
          password,
          defaultLocation: locationPayload,
        });
        const session = await services.auth.signInWithEmail({
          email: result.email,
          password,
        });
        return {session, joined: false};
      } catch (error) {
        const existing = phoneAccountExistsDetails(error);
        if (!existing) {
          throw error;
        }
        const signedIn = await services.auth.signInWithUsername({
          username: existing.email || phoneNumber,
          password,
        });
        setAuthSession(signedIn.user);
        await services.workflow.joinCompanyWithClientInvite({
          inviteCode: normalizedCode,
          fullName: fullName.trim(),
          defaultLocation: locationPayload,
        });
        const session = await services.auth.refreshSession();
        return {session, joined: true};
      }
    },
    onSuccess: async ({session, joined}) => {
      setAuthSession(session.user);
      storage.remove(StorageKeys.PENDING_CLIENT_INVITE_CODE);
      showToast(
        ToastType.success,
        t(joined ? 'clientInviteJoinedToast' : 'clientInviteRegisteredToast'),
      );
      await navigateAfterAuth(session);
    },
    onError: error => {
      const key =
        error instanceof Error && error.message === 'password-mismatch'
          ? 'signupPasswordMismatch'
          : error instanceof Error && error.message === 'weak-password'
            ? 'clientInvitePasswordHint'
            : error instanceof Error && error.message === 'invalid-phone'
              ? 'authErrorInvalidPhone'
              : error instanceof Error && error.message === 'invalid-name'
                ? 'clientInviteFullNameHint'
                : error instanceof Error && error.message === 'missing-invite'
                  ? 'clientInviteCodeRequired'
                  : error instanceof Error &&
                      error.message === 'invite-unavailable'
                    ? 'clientInviteAlreadyUsed'
                    : getWorkflowErrorTranslationKey(error);
      showToast(ToastType.error, t(key));
    },
  });

  return (
    <ScreenContainer
      keyboardAvoiding
      navTitle={t('signupRoleCustomer')}
      showBack
      onBackPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      }}>
      <View style={styles.header}>
        <AppText style={styles.title}>
          {inviteQuery.data?.companyName
            ? t('clientInviteRegisterHeading', {
                company: inviteQuery.data.companyName,
              })
            : t('signupCustomerTitle')}
        </AppText>
        <AppText style={styles.subtitle}>{t('signupCustomerLead')}</AppText>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label={t('clientFullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('clientFullNamePlaceholder')}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <AppText style={styles.subtitle}>{t('clientInviteFullNameHint')}</AppText>

        <CountryPhoneInput
          label={t('clientMobileNumber')}
          value={phone}
          onChangeText={setPhone}
          required
        />

        <View>
          <AppText style={styles.subtitle}>
            {t('clientInviteLocationOptional')}
          </AppText>
          {isPublicLocationFilled(defaultLocation) ? (
            <Pressable
              accessibilityRole="button"
              onPress={openLocationPicker}
              style={locationStyles.locationBody}>
              <View style={locationStyles.locationTextCol}>
                <AppText style={locationStyles.locationTitle}>
                  {locationLines.title}
                </AppText>
                {locationLines.subtitle ? (
                  <AppText style={locationStyles.locationSub}>
                    {locationLines.subtitle}
                  </AppText>
                ) : null}
              </View>
              <View style={locationStyles.locationFooter}>
                <View style={locationStyles.pinBadge}>
                  <MapPinned color="#FFFFFF" size={18} strokeWidth={2.4} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={openLocationPicker}
                  style={locationStyles.changeBtn}>
                  <AppText style={locationStyles.changeText}>
                    {t('changeLocation')}
                  </AppText>
                  <Chevron
                    color={theme.typography.secondary}
                    size={18}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={openLocationPicker}
              style={locationStyles.emptySearch}>
              <Search
                color={theme.typography.secondary}
                size={18}
                strokeWidth={2.2}
              />
              <AppText style={locationStyles.emptySearchText}>
                {t('selectPickupLocation')}
              </AppText>
              <Chevron
                color={theme.typography.secondary}
                size={18}
                strokeWidth={2.2}
              />
            </Pressable>
          )}
          {defaultLocation ? (
            <AppButton
              title={t('clientInviteClearLocation')}
              variant="secondary"
              onPress={() => setDefaultLocation(null)}
            />
          ) : (
            <AppText style={styles.subtitle}>
              {t('clientInviteLocationHint')}
            </AppText>
          )}
        </View>

        <AppTextInput
          ref={inviteRef}
          label={t('clientInviteCodeLabel')}
          value={inviteCode}
          onChangeText={text => setInviteCode(text.toUpperCase())}
          placeholder={t('clientInviteCodePlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AppText style={styles.subtitle}>{t('clientInviteCodeHint')}</AppText>
        {inviteQuery.isFetching ? (
          <AppText style={styles.subtitle}>{t('loading')}</AppText>
        ) : null}
        {unavailable ? (
          <AppText style={styles.subtitle}>{t('clientInviteAlreadyUsed')}</AppText>
        ) : null}
        {inviteQuery.isSuccess && inviteQuery.data?.available ? (
          <AppText style={styles.subtitle}>
            {t('clientInviteCodeValid', {
              company: inviteQuery.data.companyName,
            })}
          </AppText>
        ) : null}

        <AppTextInput
          ref={passwordRef}
          label={t('loginPassword')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <AppText style={styles.subtitle}>{t('clientInvitePasswordHint')}</AppText>

        <AppTextInput
          ref={confirmRef}
          label={t('confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={() => register.mutate()}
        />

        <AppButton
          title={t('createAccount')}
          onPress={() => register.mutate()}
          loading={register.isPending}
          disabled={register.isPending || unavailable}
        />
      </View>
    </ScreenContainer>
  );
};

export default RegisterClientInviteScreen;
