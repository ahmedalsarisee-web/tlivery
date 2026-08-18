import {useEffect, useMemo, useRef, useState, FC} from 'react';
import {Pressable, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import CountryPhoneInput from '@app/components/country-phone-input';
import {toE164, normalizeNationalDigits} from '@app/config/countries';
import {useCountry} from '@app/providers/CountryContext';
import FormField from '@app/components/form-field';
import {useUserStore} from '@app/features/user';
import {useAcceptDriverInvite} from '@app/hooks/useWorkflow';
import {services} from '@app/services/dependencies';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {VehicleType} from '../types';
import {signupStyles} from './Signup.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterDriver'>;
type Route = RouteProp<RootStackParamList, 'RegisterDriver'>;

const VEHICLE_OPTIONS: VehicleType[] = ['motorcycle', 'car', 'van'];

const inviteErrorMessage = (
  error: unknown,
  t: (key: string) => string,
): string => {
  const message =
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as {message?: unknown}).message === 'string'
      ? (error as {message: string}).message
      : '';
  if (message.includes('another phone number')) {
    return t('invitePhoneMismatch');
  }
  if (message.includes('expired')) {
    return t('inviteExpired');
  }
  if (message.includes('not available') || message.includes('not found')) {
    return t('inviteUnavailable');
  }
  return t('workflowRequestFailed');
};

const RegisterDriverScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {countryIso} = useCountry();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );

  const plateRef = useRef<TextInput>(null);
  const licenseRef = useRef<TextInput>(null);
  const companyCodeRef = useRef<TextInput>(null);
  const authPhoneNumber = useUserStore(state => state.phoneNumber);
  const authId = useUserStore(state => state.id);
  const authName = useUserStore(state => state.name);
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const setProfile = useUserStore(state => state.setProfile);
  const acceptInvite = useAcceptDriverInvite();

  const pendingStored = storage.getString(StorageKeys.PENDING_DRIVER_INVITE_CODE);
  const [fullName, setFullName] = useState(authName ?? '');
  const [phone] = useState(
    normalizeNationalDigits(countryIso, authPhoneNumber ?? ''),
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [companyCode, setCompanyCode] = useState(
    route.params?.inviteCode ?? pendingStored ?? '',
  );

  useEffect(() => {
    if (!authId) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'RegisterDriverAccount',
            params: pendingStored ? {inviteCode: pendingStored} : undefined,
          },
        ],
      });
    }
  }, [authId, navigation, pendingStored]);

  useEffect(() => {
    if (route.params?.inviteCode) {
      setCompanyCode(route.params.inviteCode);
      storage.set(StorageKeys.PENDING_DRIVER_INVITE_CODE, route.params.inviteCode);
    }
  }, [route.params?.inviteCode]);

  if (!authId) {
    return null;
  }

  const vehicleLabel = (type: VehicleType) => {
    if (type === 'motorcycle') {
      return t('signupVehicleMotorcycle');
    }
    if (type === 'car') {
      return t('signupVehicleCar');
    }
    return t('signupVehicleVan');
  };

  const onSubmit = () => {
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !plateNumber.trim() ||
      !licenseNumber.trim() ||
      !companyCode.trim()
    ) {
      showToast(ToastType.error, t('signupMissingFields'));
      return;
    }

    acceptInvite.mutate(
      {
        inviteCode: companyCode,
        fullName,
        phoneNumber: authPhoneNumber || toE164(countryIso, phone),
        vehicleType,
        plateNumber,
        licenseNumber,
      },
      {
        onSuccess: async () => {
          storage.remove(StorageKeys.PENDING_DRIVER_INVITE_CODE);
          try {
            const session = await services.auth.refreshSession();
            setAuthSession(session.user);
            const profile = await services.workflow.repository.getUserProfile(
              session.user.id,
            );
            setProfile(profile);
            showToast(ToastType.success, t('driverInviteAccepted'));
            navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
          } catch {
            navigation.reset({index: 0, routes: [{name: 'Splash'}]});
          }
        },
        onError: error =>
          showToast(ToastType.error, inviteErrorMessage(error, t)),
      },
    );
  };

  return (
    <ScreenContainer
      withNavHeader
      navVariant="page"
      navTitle={t('signupDriverTitle')}
      keyboardAvoiding
      scrollable>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('signupDriverHeading')}</AppText>
        <AppText style={styles.subtitle}>{t('signupDriverSubtitle')}</AppText>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label={t('signupFullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('signupFullNamePlaceholder')}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => plateRef.current?.focus()}
        />
        <CountryPhoneInput
          label={t('signupPhone')}
          value={phone}
          onChangeText={() => undefined}
          editable={false}
          required
        />

        <FormField label={t('signupVehicleType')}>
          <View style={styles.chipRow}>
            {VEHICLE_OPTIONS.map(option => {
              const active = vehicleType === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setVehicleType(option)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <AppText
                    style={[
                      styles.chipLabel,
                      active && styles.chipLabelActive,
                    ]}>
                    {vehicleLabel(option)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </FormField>

        <AppTextInput
          ref={plateRef}
          label={t('signupPlateNumber')}
          value={plateNumber}
          onChangeText={setPlateNumber}
          placeholder={t('signupPlateNumberPlaceholder')}
          autoCapitalize="characters"
          style={styles.ltrInput}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => licenseRef.current?.focus()}
        />
        <AppTextInput
          ref={licenseRef}
          label={t('signupLicenseNumber')}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder={t('signupLicenseNumberPlaceholder')}
          autoCapitalize="characters"
          style={styles.ltrInput}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => companyCodeRef.current?.focus()}
        />
        <AppTextInput
          ref={companyCodeRef}
          label={t('signupCompanyCode')}
          value={companyCode}
          onChangeText={setCompanyCode}
          placeholder={t('signupCompanyCodePlaceholder')}
          autoCapitalize="characters"
          style={styles.ltrInput}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          hint={t('signupInviteCodeHint')}
          required
        />

        <AppButton
          title={t('signupAcceptInvite')}
          loading={acceptInvite.isPending}
          onPress={onSubmit}
        />
      </View>
    </ScreenContainer>
  );
};

export default RegisterDriverScreen;
