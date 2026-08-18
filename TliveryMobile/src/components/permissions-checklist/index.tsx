import {useMemo, type FC} from 'react';
import {useTranslation} from 'react-i18next';
import {
  COMPANY_PERMISSIONS,
  type CompanyPermission,
} from '@app/constants/permissions';
import AppCheckbox from '@app/components/app-checkbox';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import Column from '@app/components/column';
import {space} from '@app/theme/tokens';

type PermissionsChecklistProps = {
  value: CompanyPermission[];
  onChange: (next: CompanyPermission[]) => void;
  /** Hide sensitive permissions (e.g. employees:manage for non-admins). */
  exclude?: CompanyPermission[];
};

const PermissionsChecklist: FC<PermissionsChecklistProps> = ({
  value,
  onChange,
  exclude = [],
}) => {
  const {t} = useTranslation();

  const options = useMemo(
    () =>
      COMPANY_PERMISSIONS.filter(key => !exclude.includes(key)).map(key => ({
        key,
        label: t(`perm_${key.replace(':', '_')}`),
      })),
    [exclude, t],
  );

  const toggle = (key: CompanyPermission, checked: boolean) => {
    if (checked) {
      onChange(value.includes(key) ? value : [...value, key]);
      return;
    }
    onChange(value.filter(item => item !== key));
  };

  return (
    <Card>
      <Column gap={space.sm}>
        <AppText variant="label">{t('employeePermissions')}</AppText>
        {options.map(option => (
          <AppCheckbox
            key={option.key}
            checked={value.includes(option.key)}
            label={option.label}
            onChange={checked => toggle(option.key, checked)}
          />
        ))}
      </Column>
    </Card>
  );
};

export default PermissionsChecklist;
