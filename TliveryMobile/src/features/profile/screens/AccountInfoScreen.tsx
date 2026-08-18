import {useMemo, type FC} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  selectUserEmail,
  selectUserName,
  selectUserPhoneNumber,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import Column from '@app/components/column';
import {profileStyles} from '../Profile.styles';

const AccountInfoScreen: FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => profileStyles(theme, direction),
    [theme, direction],
  );
  const name = useUserStore(selectUserName);
  const email = useUserStore(selectUserEmail);
  const phone = useUserStore(selectUserPhoneNumber);
  const role = useUserStore(selectUserRole);

  const rows = [
    {label: t('accountFullName'), value: name?.trim() || '—'},
    {label: t('accountPhone'), value: phone?.trim() || '—'},
    {label: t('accountEmail'), value: email?.trim() || '—'},
    {
      label: t('accountRole'),
      value: role ? t(`role_${role}`, {defaultValue: role}) : '—',
    },
  ];

  return (
    <ScreenContainer navTitle={t('accountInfo')}>
      <Card>
        <Column gap={0}>
          {rows.map((row, index) => (
            <View key={row.label}>
              {index > 0 ? <View style={styles.infoDivider} /> : null}
              <View style={styles.infoRow}>
                <AppText variant="caption" style={styles.infoLabel}>
                  {row.label}
                </AppText>
                <AppText variant="label" style={styles.infoValue}>
                  {row.value}
                </AppText>
              </View>
            </View>
          ))}
        </Column>
      </Card>
    </ScreenContainer>
  );
};

export default AccountInfoScreen;
