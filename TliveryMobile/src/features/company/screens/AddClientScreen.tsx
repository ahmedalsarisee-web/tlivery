import {useState, type FC} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '@app/types/navigation';
import {useCompany, useCreateCompanyClient} from '@app/hooks/useWorkflow';
import {selectUserCompanyId, useUserStore} from '@app/features/user';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import Column from '@app/components/column';
import ShareCredentialsSheet, {
  type ShareCredentialsPayload,
} from '@app/components/share-credentials-sheet';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import {space} from '@app/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddClient'>;

const AddClientScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const companyId = useUserStore(selectUserCompanyId);
  const company = useCompany(companyId);
  const createClient = useCreateCompanyClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sharePayload, setSharePayload] =
    useState<ShareCredentialsPayload | null>(null);

  const onSave = () => {
    if (username.trim().length < 3 || password.length < 8) {
      showToast(ToastType.error, t('employeeFormRequired'));
      return;
    }
    const user = username.trim().toLowerCase();
    const pass = password;
    createClient.mutate(
      {
        username: user,
        password: pass,
        displayName: displayName.trim() || undefined,
      },
      {
        onSuccess: result => {
          showToast(ToastType.success, t('clientCreated'));
          setSharePayload({
            roleLabel: t('roleClient'),
            username: result.username || user,
            password: pass,
            companyName: company.data?.name,
          });
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  return (
    <ScreenContainer keyboardAvoiding scrollable navTitle={t('addClient')}>
      <Column gap={space.md}>
        <AppTextInput
          label={t('employeeUsername')}
          value={username}
          onChangeText={setUsername}
          placeholder={t('employeeUsernamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          required
        />
        <AppTextInput
          label={t('employeePassword')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('employeePasswordPlaceholder')}
          secureTextEntry
          required
        />
        <AppTextInput
          label={t('employeeFullName')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('employeeFullNamePlaceholder')}
        />
        <AppButton
          title={t('createClient')}
          loading={createClient.isPending}
          onPress={onSave}
        />
      </Column>

      <ShareCredentialsSheet
        visible={sharePayload != null}
        credentials={sharePayload}
        onClose={() => {
          setSharePayload(null);
          navigation.goBack();
        }}
      />
    </ScreenContainer>
  );
};

export default AddClientScreen;
