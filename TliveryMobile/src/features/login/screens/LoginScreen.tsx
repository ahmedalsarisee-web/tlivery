import {useEffect, useMemo, useRef, useState, type FC} from 'react';
import {Pressable, Keyboard, Platform, Text, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage, type LangPreference} from '@app/providers/LangContext';
import {useUserStore} from '@app/features/user';
import {
  useEmailLogin,
  usePhonePasswordLogin,
  useUsernameLogin,
} from '@app/hooks/useAuth';
import type {AuthSession} from '@app/models/auth.model';
import type {RootStackParamList} from '@app/types/navigation';
import {isRTL} from '@app/utils/directionalStyles';
import {getAuthErrorTranslationKey} from '@app/utils/authError';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {navigationRef} from '@app/navigation/RootNavigation';
import {navigateAfterAuth} from '@app/navigation/navigateAfterAuth';
import ScreenContainer from '@app/components/screen-container';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import BrandLogo from '@app/components/brand-logo';
import Column from '@app/components/column';
import CountryPhoneInput from '@app/components/country-phone-input';
import WaselLoader from '@app/components/wasel-loader';
import {isValidNationalNumber, toE164} from '@app/config/countries';
import {useCountry} from '@app/providers/CountryContext';
import {loginStyles} from './Login.styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRoute = RouteProp<RootStackParamList, 'Login'>;
type SignInMethod = 'account' | 'phone';

const LOGIN_LANGUAGE_OPTIONS: Array<'en' | 'ar'> = ['en', 'ar'];
const LANGUAGE_FLAGS: Record<'en' | 'ar', string> = {
  en: '🇪🇺',
  ar: '🇸🇦',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Android ignores autoCapitalize on secure fields unless visible-password. */
const PASSWORD_KEYBOARD =
  Platform.OS === 'android' ? 'visible-password' : 'default';

const goAfterAuth = async (session: AuthSession) => {
  useUserStore.getState().setAuthSession(session.user);
  const pendingCode = storage.getString(StorageKeys.PENDING_DRIVER_INVITE_CODE);
  const isDriverApplicant =
    !session.user.companyId &&
    (Boolean(session.user.phoneNumber) ||
      Boolean(session.user.email?.endsWith('@drivers.wasel.app')));
  if (pendingCode && isDriverApplicant) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [
          {name: 'RegisterDriver', params: {inviteCode: pendingCode}},
        ],
      });
    }
    return;
  }
  await navigateAfterAuth(session);
};

const LoginScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRoute>();
  const emailLogin = useEmailLogin();
  const usernameLogin = useUsernameLogin();
  const phoneLogin = usePhonePasswordLogin();
  const {theme, themeType} = useTheme();
  const {direction, language, languagePreference, changeLanguage} =
    useLanguage();
  const {countryIso} = useCountry();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const rtl = isRTL(direction);
  const styles = useMemo(
    () => loginStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const passwordRef = useRef<TextInput>(null);

  const initialMethod: SignInMethod =
    route.params?.method === 'phone' ? 'phone' : 'account';
  const [method, setMethod] = useState<SignInMethod>(initialMethod);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [enteringApp, setEnteringApp] = useState(false);

  useEffect(() => {
    if (route.params?.method === 'phone') {
      setMethod('phone');
    } else if (route.params?.method === 'email') {
      setMethod('account');
    }
  }, [route.params?.method]);

  const activeLangCode: 'en' | 'ar' =
    languagePreference === 'en' || languagePreference === 'ar'
      ? languagePreference
      : language;

  const checkColor = isDark ? theme.brand.gold : theme.brand.navy;
  const phoneNumber = toE164(countryIso, localPhoneNumber);
  const isAccountMethod = method === 'account';
  const isSubmitting = isAccountMethod
    ? emailLogin.isPending || usernameLogin.isPending
    : phoneLogin.isPending;
  const showCenteredLoader = isSubmitting || enteringApp;

  const finishAuth = async (session: AuthSession) => {
    setEnteringApp(true);
    try {
      await goAfterAuth(session);
    } catch {
      setEnteringApp(false);
    }
  };

  const onAccountSignIn = () => {
    const trimmed = identifier.trim();

    if (!trimmed) {
      showToast(ToastType.error, t('loginIdentifierRequired'));
      return;
    }

    if (!password) {
      showToast(ToastType.error, t('loginPasswordRequired'));
      return;
    }

    setIdentifierError(undefined);
    setPasswordError(undefined);

    const onSuccess = (session: AuthSession) => {
      void finishAuth(session);
    };

    const onError = (error: unknown) => {
      showToast(ToastType.error, t(getAuthErrorTranslationKey(error)));
    };

    if (EMAIL_PATTERN.test(trimmed.toLowerCase())) {
      emailLogin.mutate(
        {email: trimmed.toLowerCase(), password},
        {onSuccess, onError},
      );
      return;
    }

    usernameLogin.mutate({username: trimmed, password}, {onSuccess, onError});
  };

  const onPhoneSignIn = () => {
    if (!localPhoneNumber.trim()) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (!isValidNationalNumber(countryIso, localPhoneNumber)) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (!password) {
      showToast(ToastType.error, t('loginPasswordRequired'));
      return;
    }
    setPasswordError(undefined);
    phoneLogin.mutate(
      {phoneNumber, password},
      {
        onSuccess: session => {
          void finishAuth(session);
        },
        onError: error => {
          const key = getAuthErrorTranslationKey(error);
          const detail =
            __DEV__ &&
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof (error as {message?: unknown}).message === 'string'
              ? ` (${(error as {message: string}).message})`
              : '';
          showToast(ToastType.error, `${t(key)}${detail}`);
        },
      },
    );
  };

  const onPrimaryAction = () => {
    Keyboard.dismiss();
    if (isAccountMethod) {
      onAccountSignIn();
      return;
    }
    onPhoneSignIn();
  };

  const onSelectLanguage = (item: 'en' | 'ar') => {
    setLanguageModalVisible(false);
    if (item === languagePreference) {
      return;
    }
    changeLanguage(item as LangPreference);
  };

  const onSelectMethod = (next: SignInMethod) => {
    setMethod(next);
    setIdentifierError(undefined);
    setPasswordError(undefined);
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        withNavHeader={false}
        edges={['top', 'bottom']}
        keyboardAvoiding
        scrollable={false}
        padded={false}
        bottomInset={false}
        trackApiLoading={false}
        contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('loginLanguage')}
            onPress={() => setLanguageModalVisible(true)}
            style={styles.languageBadgeButton}>
            <Text
              allowFontScaling={false}
              style={[
                styles.languageBadgeText,
                language === 'ar' && styles.languageBadgeTextAr,
              ]}>
              {language === 'ar' ? 'ع' : 'EN'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.main}>
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <BrandLogo
                tone={themeType === 'dark' ? 'onDark' : 'onLight'}
                size="header"
              />
            </View>
            <AppText style={styles.welcome}>{t('signInTitle')}</AppText>
            <AppText style={styles.subtitle}>{t('signInSubtitle')}</AppText>
          </View>

          <View style={styles.methodToggle}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: isAccountMethod}}
              onPress={() => onSelectMethod('account')}
              style={[
                styles.methodChip,
                isAccountMethod && styles.methodChipActive,
              ]}>
              <AppText
                style={[
                  styles.methodChipLabel,
                  isAccountMethod && styles.methodChipLabelActive,
                ]}>
                {t('signInWithEmailOrUsername')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{selected: method === 'phone'}}
              onPress={() => onSelectMethod('phone')}
              style={[
                styles.methodChip,
                method === 'phone' && styles.methodChipActive,
              ]}>
              <AppText
                style={[
                  styles.methodChipLabel,
                  method === 'phone' && styles.methodChipLabelActive,
                ]}>
                {t('signInMethodPhone')}
              </AppText>
            </Pressable>
          </View>

          {isAccountMethod ? (
            <Column gap={6} style={styles.form}>
              <AppTextInput
                label={t('loginIdentifier')}
                value={identifier}
                onChangeText={text => {
                  setIdentifier(text);
                  if (identifierError) {
                    setIdentifierError(undefined);
                  }
                }}
                placeholder={t('loginIdentifierPlaceholder')}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                keyboardType="default"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={identifierError}
                style={rtl ? styles.identifierInputRtl : undefined}
              />

              <AppTextInput
                ref={passwordRef}
                label={t('loginPassword')}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) {
                    setPasswordError(undefined);
                  }
                }}
                placeholder={t('loginPasswordPlaceholder')}
                secureTextEntry
                keyboardType={PASSWORD_KEYBOARD}
                textContentType="password"
                autoComplete="password"
                importantForAutofill="yes"
                autoCapitalize="sentences"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                onSubmitEditing={onAccountSignIn}
                error={passwordError}
              />
              <Pressable
                accessibilityRole="button"
                style={styles.forgotPasswordLink}
                onPress={() => navigation.navigate('ForgotPassword')}>
                <AppText style={styles.footerLinkAccent}>
                  {t('forgotPassword')}
                </AppText>
              </Pressable>
            </Column>
          ) : (
            <Column gap={6} style={styles.form}>
              <CountryPhoneInput
                label={t('loginPhoneOrFleetId')}
                value={localPhoneNumber}
                onChangeText={setLocalPhoneNumber}
                required
              />
              <AppTextInput
                ref={passwordRef}
                label={t('loginPassword')}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) {
                    setPasswordError(undefined);
                  }
                }}
                placeholder={t('loginPasswordPlaceholder')}
                secureTextEntry
                keyboardType={PASSWORD_KEYBOARD}
                textContentType="password"
                autoComplete="password"
                importantForAutofill="yes"
                autoCapitalize="sentences"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                onSubmitEditing={onPhoneSignIn}
                error={passwordError}
              />
            </Column>
          )}

          <View style={styles.actions}>
            <AppButton
              title={t('loginSignIn')}
              loading={isSubmitting}
              onPress={onPrimaryAction}
            />
            <Pressable
              accessibilityRole="button"
              style={styles.footerLink}
              onPress={() =>
                navigation.navigate(
                  isAccountMethod ? 'RegisterRole' : 'RegisterDriverAccount',
                )
              }>
              <AppText style={styles.footerLinkText}>
                {t('loginNoAccount')}{' '}
                <AppText style={styles.footerLinkAccent}>
                  {t('loginSignUp')}
                </AppText>
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>

      {showCenteredLoader ? <WaselLoader fullScreen size="md" /> : null}

      <BottomSheetModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title={t('loginLanguageSheetTitle')}
        subtitle={t('loginLanguageSheetSubtitle')}
        minHeight={180}>
        <View style={styles.sheetList}>
          {LOGIN_LANGUAGE_OPTIONS.map(item => {
            const active = activeLangCode === item;
            return (
              <Pressable
                key={item}
                style={[styles.sheetItem, active && styles.sheetItemActive]}
                onPress={() => onSelectLanguage(item)}>
                <AppText style={styles.flagText}>
                  {LANGUAGE_FLAGS[item]}
                </AppText>
                <AppText
                  style={[
                    styles.itemLabel,
                    active && styles.itemLabelActive,
                  ]}>
                  {item === 'en' ? t('english') : t('arabic')}
                </AppText>
                {active ? (
                  <Check color={checkColor} size={18} strokeWidth={2.4} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default LoginScreen;
