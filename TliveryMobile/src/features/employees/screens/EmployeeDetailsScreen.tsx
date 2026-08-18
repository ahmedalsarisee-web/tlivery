import {useEffect, useMemo, useState, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {AtSign, Mail, Phone, Shield} from 'lucide-react-native';
import type {RootStackParamList} from '@app/types/navigation';
import {
  useCompanyEmployees,
  useDeleteCompanyEmployee,
  useUpdateCompanyEmployee,
} from '@app/hooks/useWorkflow';
import {
  COMPANY_PERMISSIONS,
  type CompanyPermission,
} from '@app/constants/permissions';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import AppTextInput from '@app/components/app-text-input';
import Column from '@app/components/column';
import Row from '@app/components/row';
import CenterModal from '@app/components/center-modal';
import DetailsHeroHeader from '@app/components/details-hero-header';
import PermissionsChecklist from '@app/components/permissions-checklist';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import type {SoftTone} from '@app/theme/tokens';
import {space} from '@app/theme/tokens';

type Route = NativeStackScreenProps<RootStackParamList, 'EmployeeDetails'>['route'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'EmployeeDetails'>;

const employeeStatusTone = (status: string): SoftTone => {
  switch (status) {
    case 'active':
      return 'delivered';
    case 'suspended':
    case 'disabled':
      return 'cancelled';
    default:
      return 'waiting';
  }
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const EmployeeDetailsScreen: FC = () => {
  const {t} = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const employees = useCompanyEmployees({page: 1, pageSize: 50});
  const updateEmployee = useUpdateCompanyEmployee();
  const deleteEmployee = useDeleteCompanyEmployee();
  const employee = employees.data?.employees.find(
    item => item.id === route.params.employeeId,
  );
  const [displayName, setDisplayName] = useState('');
  const [permissions, setPermissions] = useState<CompanyPermission[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!employee) {
      return;
    }
    setDisplayName(employee.displayName);
    setPermissions(
      employee.permissions.filter((key): key is CompanyPermission =>
        COMPANY_PERMISSIONS.includes(key as CompanyPermission),
      ),
    );
  }, [employee]);

  const heroName =
    employee?.displayName || employee?.username || t('editPermissions');
  const statusLabel = employee
    ? t(`employeeStatus_${employee.status}`, {
        defaultValue: employee.status,
      })
    : t('employeeStatus_active');

  const permissionsLabel = useMemo(() => {
    if (!employee) {
      return t('noPermissions');
    }
    if (!employee.permissions.length) {
      return t('noPermissions');
    }
    return employee.permissions
      .map(key =>
        COMPANY_PERMISSIONS.includes(key as CompanyPermission)
          ? t(`perm_${key.replace(':', '_')}`)
          : key,
      )
      .join(' · ');
  }, [employee, t]);

  const metaRows = useMemo(() => {
    if (!employee) {
      return [];
    }
    const rows = [
      {icon: AtSign, text: employee.username},
      {icon: Shield, text: permissionsLabel},
    ];
    const phone = employee.phoneNumber?.trim();
    const email = employee.email?.trim();
    if (phone) {
      rows.push({icon: Phone, text: phone});
    }
    if (email) {
      rows.push({icon: Mail, text: email});
    }
    return rows;
  }, [employee, permissionsLabel]);

  const onSave = () => {
    if (!employee) {
      return;
    }
    updateEmployee.mutate(
      {
        employeeId: employee.id,
        displayName: displayName.trim() || employee.username,
        permissions,
      },
      {
        onSuccess: () => {
          showToast(ToastType.success, t('employeeUpdated'));
          navigation.goBack();
        },
        onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  const onConfirmDelete = () => {
    if (!employee) {
      return;
    }
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        showToast(ToastType.success, t('employeeDeleted'));
        navigation.goBack();
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  if (!employee && !employees.isLoading) {
    return (
      <ScreenContainer navTitle={t('editPermissions')}>
        <AppText>{t('workflowRequestFailed')}</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      keyboardAvoiding
      scrollable
      loading={employees.isLoading && !employee}
      navTitle={t('editPermissions')}>
      <Column gap={space.md}>
        {employee ? (
          <DetailsHeroHeader
            name={heroName}
            initials={initials(heroName)}
            statusLabel={statusLabel}
            statusTone={employeeStatusTone(employee.status)}
            metaRows={metaRows}
          />
        ) : null}

        <AppTextInput
          label={t('employeeFullName')}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <PermissionsChecklist value={permissions} onChange={setPermissions} />
        <AppButton
          title={t('save')}
          loading={updateEmployee.isPending}
          onPress={onSave}
        />
        <AppButton
          title={t('deleteEmployee')}
          variant="destructive"
          onPress={() => setConfirmDelete(true)}
        />
      </Column>

      <CenterModal
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('deleteEmployee')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('deleteEmployeeConfirm')}
          </AppText>
          <Row gap={space.sm}>
            <View style={styles.flex}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setConfirmDelete(false)}
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                title={t('delete')}
                variant="destructive"
                loading={deleteEmployee.isPending}
                onPress={onConfirmDelete}
              />
            </View>
          </Row>
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default EmployeeDetailsScreen;
