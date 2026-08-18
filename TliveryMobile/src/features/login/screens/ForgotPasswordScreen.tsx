import {useState, type FC} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useForgotPassword} from '@app/hooks/useAuth';
import type {RootStackParamList} from '@app/types/navigation';
import {getAuthErrorTranslationKey} from '@app/utils/authError';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppTextInput from '@app/components/app-text-input';
import AppButton from '@app/components/app-button';
import Card from '@app/components/card';
import Column from '@app/components/column';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const forgotPassword = useForgotPassword();
  const {t} = useTranslation();
  const [email, setEmail] = useState('');

  const onSend = () => {
    forgotPassword.mutate(
      {email},
      {
        onSuccess: () => {
          showToast(ToastType.success, t('passwordResetSent'));
          navigation.goBack();
        },
        onError: error => {
          showToast(
            ToastType.error,
            t(getAuthErrorTranslationKey(error)),
          );
        },
      },
    );
  };

  return (
    <ScreenContainer keyboardAvoiding navTitle={t('forgotPassword')}>
      <Column gap={4}>
        <AppText variant="subtitle">{t('forgotPasswordSubtitle')}</AppText>
      </Column>

      <Card>
        <AppTextInput
          label={t('loginEmail')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('loginEmailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          required
        />
      </Card>

      <AppButton
        title={t('sendResetLink')}
        loading={forgotPassword.isPending}
        disabled={!email.trim()}
        onPress={onSend}
      />
    </ScreenContainer>
  );
};

export default ForgotPasswordScreen;
