import {useMemo, useState, FC} from 'react';
import {Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Building2, Check, Store, Truck} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import {SignupRole} from '../types';
import {signupStyles} from './Signup.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterRole'>;

const RegisterRoleScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );
  const [role, setRole] = useState<SignupRole | null>(null);
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  const onContinue = () => {
    if (role === 'company') {
      navigation.navigate('RegisterCompany');
      return;
    }
    if (role === 'driver') {
      navigation.navigate('RegisterDriverAccount');
      return;
    }
    if (role === 'customer') {
      navigation.navigate('RegisterClientInvite');
    }
  };

  return (
    <ScreenContainer
      withNavHeader
      navVariant="page"
      navTitle={t('signupTitle')}
      keyboardAvoiding
      scrollable>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('signupRoleTitle')}</AppText>
        <AppText style={styles.subtitle}>{t('signupRoleSubtitle')}</AppText>
      </View>

      <View style={styles.roleList}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setRole('company')}
          style={[styles.roleCard, role === 'company' && styles.roleCardActive]}>
          <View style={styles.roleIconWrap}>
            <Building2 size={22} color={accent} />
          </View>
          <View style={styles.roleTextCol}>
            <AppText style={styles.roleTitle}>{t('signupRoleCompany')}</AppText>
            <AppText style={styles.roleBody}>
              {t('signupRoleCompanyBody')}
            </AppText>
          </View>
          {role === 'company' ? (
            <Check size={18} color={accent} strokeWidth={2.4} />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setRole('driver')}
          style={[styles.roleCard, role === 'driver' && styles.roleCardActive]}>
          <View style={styles.roleIconWrap}>
            <Truck size={22} color={accent} />
          </View>
          <View style={styles.roleTextCol}>
            <AppText style={styles.roleTitle}>{t('signupRoleDriver')}</AppText>
            <AppText style={styles.roleBody}>
              {t('signupRoleDriverBody')}
            </AppText>
          </View>
          {role === 'driver' ? (
            <Check size={18} color={accent} strokeWidth={2.4} />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setRole('customer')}
          style={[
            styles.roleCard,
            role === 'customer' && styles.roleCardActive,
          ]}>
          <View style={styles.roleIconWrap}>
            <Store size={22} color={accent} />
          </View>
          <View style={styles.roleTextCol}>
            <AppText style={styles.roleTitle}>{t('signupRoleCustomer')}</AppText>
            <AppText style={styles.roleBody}>
              {t('signupRoleCustomerBody')}
            </AppText>
          </View>
          {role === 'customer' ? (
            <Check size={18} color={accent} strokeWidth={2.4} />
          ) : null}
        </Pressable>
      </View>

      <AppButton
        title={t('signupContinue')}
        disabled={!role}
        onPress={onContinue}
      />

      <Pressable
        accessibilityRole="button"
        style={styles.footerLink}
        onPress={() => navigation.navigate('Login')}>
        <AppText style={styles.footerLinkText}>
          {t('signupHaveAccount')}{' '}
          <AppText style={styles.footerLinkAccent}>{t('loginSignIn')}</AppText>
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
};

export default RegisterRoleScreen;
