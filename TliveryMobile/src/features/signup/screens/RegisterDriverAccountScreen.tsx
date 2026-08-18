import {useMemo, useRef, useState, type FC} from 'react';
import {Pressable, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {useUserStore} from '@app/features/user';
import {useRegisterDriverAccount} from '@app/hooks/useAuth';
import type {RootStackParamList} from '@app/types/navigation';
import {isValidNationalNumber, toE164} from '@app/config/countries';
import {getAuthErrorTranslationKey} from '@app/utils/authError';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import CountryPhoneInput from '@app/components/country-phone-input';
import {signupStyles} from './Signup.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterDriverAccount'>;
type Route = RouteProp<RootStackParamList, 'RegisterDriverAccount'>;

const RegisterDriverAccountScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {countryIso} = useCountry();
  const {t} = useTranslation();
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const register = useRegisterDriverAccount();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inviteCode =
    route.params?.inviteCode ??
    storage.getString(StorageKeys.PENDING_DRIVER_INVITE_CODE) ??
    undefined;

  const onSubmit = () => {
    if (!fullName.trim()) {
      showToast(ToastType.error, t('signupMissingFields'));
      return;
    }
    if (!isValidNationalNumber(countryIso, phone)) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (password.length < 8) {
      showToast(ToastType.error, t('authErrorWeakPassword'));
      return;
    }
    if (password !== confirmPassword) {
      showToast(ToastType.error, t('signupPasswordMismatch'));
      return;
    }

    register.mutate(
      {
        phoneNumber: toE164(countryIso, phone),
        password,
        displayName: fullName.trim(),
      },
      {
        onSuccess: session => {
          setAuthSession(session.user);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'RegisterDriver',
                params: inviteCode ? {inviteCode} : undefined,
              },
            ],
          });
        },
        onError: error =>
          showToast(ToastType.error, t(getAuthErrorTranslationKey(error))),
      },
    );
  };

  return (
    <ScreenContainer
      withNavHeader
      navVariant="page"
      navTitle={t('signupDriverAccountTitle')}
      keyboardAvoiding
      scrollable>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('signupDriverAccountHeading')}</AppText>
        <AppText style={styles.subtitle}>
          {t('signupDriverAccountSubtitle')}
        </AppText>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label={t('signupFullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('signupFullNamePlaceholder')}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <CountryPhoneInput
          label={t('signupPhone')}
          value={phone}
          onChangeText={setPhone}
          required
        />
        <AppTextInput
          ref={passwordRef}
          label={t('loginPassword')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('loginPasswordPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <AppTextInput
          ref={confirmRef}
          label={t('signupConfirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('signupConfirmPasswordPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        <AppButton
          title={t('signupCreateDriverAccount')}
          loading={register.isPending}
          onPress={onSubmit}
        />
        <Pressable
          accessibilityRole="button"
          style={styles.footerLink}
          onPress={() => navigation.navigate('Login', {method: 'phone'})}>
          <AppText style={styles.footerLinkText}>
            {t('signupHaveAccount')}{' '}
            <AppText style={styles.footerLinkAccent}>{t('loginSignIn')}</AppText>
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

export default RegisterDriverAccountScreen;
