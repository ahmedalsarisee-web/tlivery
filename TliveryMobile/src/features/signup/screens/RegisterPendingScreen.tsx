import {useMemo, FC} from 'react';
import {View} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {ClipboardCheck} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import {useUserStore} from '@app/features/user';
import {
  useCompanyApplication,
  useDriverApplication,
} from '@app/hooks/useWorkflow';
import {signupStyles} from './Signup.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RegisterPending'>;
type Route = RouteProp<RootStackParamList, 'RegisterPending'>;

const RegisterPendingScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => signupStyles(theme, direction, isDark),
    [theme, direction, isDark],
  );

  const {role, referenceId} = route.params;
  const userId = useUserStore(state => state.id);
  const companyApplication = useCompanyApplication(
    role === 'company' ? userId : null,
  );
  const driverApplication = useDriverApplication(
    role === 'driver' ? userId : null,
  );
  const application =
    role === 'company' ? companyApplication.data : driverApplication.data;
  const status = application?.status ?? 'pending';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  return (
    <ScreenContainer
      withNavHeader
      navVariant="page"
      navTitle={t('signupPendingTitle')}
      showBack={false}>
      <View style={styles.pendingWrap}>
        <View style={styles.pendingIconWrap}>
          <ClipboardCheck size={34} color={accent} />
        </View>
        <AppText style={styles.pendingTitle}>
          {status === 'rejected'
            ? t('signupRejectedHeading')
            : status === 'approved'
              ? t('signupApprovedHeading')
              : t('signupPendingHeading')}
        </AppText>
        <AppText style={styles.pendingBody}>
          {status === 'rejected'
            ? application?.rejectionReason || t('signupRejectedBody')
            : status === 'approved'
              ? t('signupApprovedBody')
            : role === 'company'
              ? t('signupPendingCompanyBody')
              : t('signupPendingDriverBody')}
        </AppText>

        <View style={styles.referenceBox}>
          <AppText style={styles.referenceLabel}>
            {t('signupReferenceLabel')}
          </AppText>
          <AppText style={styles.referenceValue}>
            {application?.id ?? referenceId}
          </AppText>
        </View>

        {status === 'rejected' ? (
          <AppButton
            title={t('editAndResubmit')}
            variant="secondary"
            onPress={() =>
              navigation.replace(
                role === 'company' ? 'RegisterCompany' : 'RegisterDriver',
              )
            }
          />
        ) : null}
        {status === 'approved' ? (
          <AppButton
            title={t('continueToApp')}
            onPress={() =>
              navigation.reset({index: 0, routes: [{name: 'Splash'}]})
            }
          />
        ) : null}
        <AppButton
          title={t('signupBackToLogin')}
          onPress={() => navigation.reset({index: 0, routes: [{name: 'Login'}]})}
        />
      </View>
    </ScreenContainer>
  );
};

export default RegisterPendingScreen;
