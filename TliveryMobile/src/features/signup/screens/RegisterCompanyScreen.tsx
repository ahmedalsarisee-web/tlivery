import {useMemo, useRef, useState, FC} from 'react';
import {TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  Building2,
  Lock,
  MapPin,
  User,
} from 'lucide-react-native';
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
import SectionHeader from '@app/components/section-header';
import Column from '@app/components/column';
import {space} from '@app/theme/tokens';
import {isValidNationalNumber, toE164} from '@app/config/countries';
import {useCountry} from '@app/providers/CountryContext';
import {useUserStore} from '@app/features/user';
import {
  useEmailRegistration,
  useRefreshAuthSession,
  useSendVerificationEmail,
} from '@app/hooks/useAuth';
import {useSubmitCompanyApplication} from '@app/hooks/useWorkflow';
import {getAuthErrorTranslationKey} from '@app/utils/authError';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {signupStyles} from './Signup.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterCompany'>;

const RegisterCompanyScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const authUserId = useUserStore(state => state.id);
  const authEmail = useUserStore(state => state.email);
  const emailVerified = useUserStore(state => state.emailVerified);
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const register = useEmailRegistration();
  const resendVerification = useSendVerificationEmail();
  const refreshSession = useRefreshAuthSession();
  const submitApplication = useSubmitCompanyApplication();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {country, countryIso} = useCountry();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const cityPlaceholder = country.cities?.[0]
    ? t('signupCityPlaceholderExample', {city: country.cities[0]})
    : t('signupCityPlaceholder');

  const commercialRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [companyName, setCompanyName] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(authEmail ?? '');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmit = () => {
    if (!authUserId) {
      if (!contactName.trim() || !email.trim() || password.length < 8) {
        showToast(ToastType.error, t('signupMissingFields'));
        return;
      }
      if (password !== confirmPassword) {
        showToast(ToastType.error, t('signupPasswordMismatch'));
        return;
      }
      register.mutate(
        {displayName: contactName, email, password},
        {
          onSuccess: session => {
            setAuthSession(session.user);
            showToast(ToastType.success, t('verificationEmailSent'));
          },
          onError: error =>
            showToast(ToastType.error, t(getAuthErrorTranslationKey(error))),
        },
      );
      return;
    }

    if (!emailVerified) {
      showToast(ToastType.error, t('verifyEmailBeforeSubmit'));
      return;
    }
    if (
      !companyName.trim() ||
      !commercialRegister.trim() ||
      !contactName.trim() ||
      !isValidNationalNumber(countryIso, phone) ||
      !(authEmail ?? email).trim() ||
      !city.trim()
    ) {
      showToast(ToastType.error, t('signupMissingFields'));
      return;
    }

    submitApplication.mutate(
      {
        companyName,
        commercialRegistrationNumber: commercialRegister,
        contactName,
        phoneNumber: toE164(countryIso, phone),
        email: authEmail ?? email,
        city,
      },
      {
        onSuccess: result =>
          navigation.replace('RegisterPending', {
            role: 'company',
            referenceId: result.applicationId,
          }),
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  return (
    <ScreenContainer
      withNavHeader
      navVariant="page"
      navTitle={t('signupCompanyTitle')}
      keyboardAvoiding
      scrollable>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('signupCompanyHeading')}</AppText>
        <AppText style={styles.subtitle}>{t('signupCompanySubtitle')}</AppText>
      </View>

      <Column gap={space.xl} style={styles.form}>
        <Column gap={space.md}>
          <SectionHeader
            title={t('sectionCompanyInfo')}
            icon={<Building2 size={20} color={theme.brand.navy} />}
          />
          <AppTextInput
            label={t('signupCompanyName')}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder={t('signupCompanyNamePlaceholder')}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => commercialRef.current?.focus()}
          />
          <AppTextInput
            ref={commercialRef}
            label={t('signupCommercialRegister')}
            value={commercialRegister}
            onChangeText={setCommercialRegister}
            placeholder={t('signupCommercialRegisterPlaceholder')}
            autoCapitalize="characters"
            style={styles.ltrInput}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => contactRef.current?.focus()}
          />
        </Column>

        <Column gap={space.md}>
          <SectionHeader
            title={t('sectionContactInfo')}
            icon={<User size={20} color={theme.brand.navy} />}
          />
          <AppTextInput
            ref={contactRef}
            label={t('signupContactName')}
            value={contactName}
            onChangeText={setContactName}
            placeholder={t('signupContactNamePlaceholder')}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => phoneRef.current?.focus()}
          />
          <CountryPhoneInput
            ref={phoneRef}
            label={t('signupPhone')}
            value={phone}
            onChangeText={setPhone}
            required
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <AppTextInput
            ref={emailRef}
            label={t('signupEmail')}
            value={email}
            onChangeText={setEmail}
            editable={!authUserId}
            placeholder={t('signupEmailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            style={styles.ltrInput}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => cityRef.current?.focus()}
          />
        </Column>

        <Column gap={space.md}>
          <SectionHeader
            title={t('sectionAddressInfo')}
            icon={<MapPin size={20} color={theme.brand.navy} />}
          />
          <AppTextInput
            ref={cityRef}
            label={t('signupCity')}
            value={city}
            onChangeText={setCity}
            placeholder={cityPlaceholder}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </Column>

        {!authUserId ? (
          <Column gap={space.md}>
            <SectionHeader
              title={t('sectionAccountSecurity')}
              icon={<Lock size={20} color={theme.brand.navy} />}
            />
            <AppTextInput
              ref={passwordRef}
              label={t('loginPassword')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('loginPasswordPlaceholder')}
              secureTextEntry
              keyboardType="default"
              textContentType="newPassword"
              autoComplete="password-new"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              style={styles.ltrInput}
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
              keyboardType="default"
              textContentType="newPassword"
              autoComplete="password-new"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              style={styles.ltrInput}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          </Column>
        ) : null}

        {authUserId && !emailVerified ? (
          <Column gap={space.md}>
            <AppText style={styles.subtitle}>
              {t('verifyCompanyEmailBody')}
            </AppText>
            <AppButton
              title={t('reloadVerification')}
              variant="secondary"
              loading={refreshSession.isPending}
              onPress={() =>
                refreshSession.mutate(undefined, {
                  onSuccess: session => setAuthSession(session.user),
                  onError: () =>
                    showToast(ToastType.error, t('workflowRequestFailed')),
                })
              }
            />
            <AppButton
              title={t('resendVerification')}
              variant="secondary"
              loading={resendVerification.isPending}
              onPress={() =>
                resendVerification.mutate(undefined, {
                  onSuccess: () =>
                    showToast(ToastType.success, t('verificationEmailSent')),
                })
              }
            />
          </Column>
        ) : null}

        <AppButton
          title={
            authUserId ? t('signupSubmitCompany') : t('createCompanyAccount')
          }
          loading={register.isPending || submitApplication.isPending}
          onPress={onSubmit}
        />
      </Column>
    </ScreenContainer>
  );
};

export default RegisterCompanyScreen;
