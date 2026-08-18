import {useState, type FC} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '@app/types/navigation';
import {useCreateCompanyEmployee} from '@app/hooks/useWorkflow';
import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  type CompanyPermission,
} from '@app/constants/permissions';
import ScreenContainer from '@app/components/screen-container';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import Column from '@app/components/column';
import PermissionsChecklist from '@app/components/permissions-checklist';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {space} from '@app/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddEmployee'>;

const AddEmployeeScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const createEmployee = useCreateCompanyEmployee();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [permissions, setPermissions] = useState<CompanyPermission[]>(
    DEFAULT_EMPLOYEE_PERMISSIONS,
  );

  const onSave = () => {
    if (username.trim().length < 3 || password.length < 8) {
      showToast(ToastType.error, t('employeeFormRequired'));
      return;
    }
    createEmployee.mutate(
      {
        username: username.trim().toLowerCase(),
        password,
        displayName: displayName.trim() || undefined,
        permissions,
      },
      {
        onSuccess: () => {
          showToast(ToastType.success, t('employeeCreated'));
          navigation.goBack();
        },
        onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  return (
    <ScreenContainer
      keyboardAvoiding
      scrollable
      navTitle={t('addEmployee')}>
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
        <PermissionsChecklist value={permissions} onChange={setPermissions} />
        <AppButton
          title={t('createEmployee')}
          loading={createEmployee.isPending}
          onPress={onSave}
        />
      </Column>
    </ScreenContainer>
  );
};

export default AddEmployeeScreen;
