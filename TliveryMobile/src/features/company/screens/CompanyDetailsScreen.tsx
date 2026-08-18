import {useMemo, FC} from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import Card from '@app/components/card';
import Row from '@app/components/row';
import Column from '@app/components/column';
import {useUserStore} from '@app/features/user';
import {useCompany, useCompanyDrivers} from '@app/hooks/useWorkflow';
import {companyStyles} from './Company.styles';

const CompanyDetailsScreen: FC = () => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const companyId = useUserStore(state => state.companyId);
  const companyQuery = useCompany(companyId);
  const driversQuery = useCompanyDrivers(companyId);
  const company = companyQuery.data;
  const drivers = driversQuery.data?.drivers ?? [];
  const driverTotal = driversQuery.data?.total ?? drivers.length;
  const styles = useMemo(
    () => companyStyles(theme, direction),
    [theme, direction],
  );

  if (!company && !companyQuery.isLoading) {
    return (
      <ScreenContainer navTitle={t('companyDetails')}>
        <AppText variant="body">{t('companyNotFound')}</AppText>
      </ScreenContainer>
    );
  }

  if (!company) {
    return (
      <ScreenContainer
        navTitle={t('companyDetails')}
        loading={companyQuery.isLoading || driversQuery.isLoading}
      />
    );
  }

  const statusColor =
    company.status === 'active'
      ? theme.status.success
      : company.status === 'suspended'
        ? theme.status.error
        : theme.status.warning;

  return (
    <ScreenContainer
      navTitle={t('companyDetails')}
      loading={driversQuery.isLoading && !driverTotal}>
      <Row justify="space-between" align="flex-start">
        <Column gap={2} flex={1}>
          <AppText variant="heading">{company.name}</AppText>
          <AppText variant="subtitle">{company.code}</AppText>
        </Column>
        <View style={[styles.badge, {backgroundColor: statusColor}]}>
          <AppText variant="caption" tone="inverse">
            {t(`companyStatus_${company.status}`)}
          </AppText>
        </View>
      </Row>

      <Card>
        <AppText variant="heading">{t('companySectionProfile')}</AppText>
        <Column gap={8}>
          <AppText variant="caption">{t('commercialRegister')}</AppText>
          <AppText variant="body">
            {company.commercialRegistrationNumber}
          </AppText>
          <AppText variant="caption">{t('companyEmail')}</AppText>
          <AppText variant="body">{company.contact.email}</AppText>
          <AppText variant="caption">{t('companyPhone')}</AppText>
          <AppText variant="body">{company.contact.phoneNumber}</AppText>
        </Column>
      </Card>

      <Card>
        <AppText variant="heading">{t('companySectionLocation')}</AppText>
        <Column gap={8}>
          <AppText variant="caption">{t('companyCity')}</AppText>
          <AppText variant="body">{company.address.city}</AppText>
          <AppText variant="caption">{t('companyAddress')}</AppText>
          <AppText variant="body">{company.address.details}</AppText>
        </Column>
      </Card>

      <Card>
        <AppText variant="heading">{t('companySectionContact')}</AppText>
        <Column gap={8}>
          <AppText variant="caption">{t('contactName')}</AppText>
          <AppText variant="body">{company.contact.name}</AppText>
        </Column>
      </Card>

      <Card>
        <AppText variant="heading">{t('companyFleet')}</AppText>
        <Column gap={8}>
          <Row justify="space-between">
            <AppText variant="caption">{t('driversTotal')}</AppText>
            <AppText variant="label">
              {driverTotal}/{company.maxDrivers}
            </AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('driversOnline')}</AppText>
            <AppText variant="label">
              {drivers.filter(driver => driver.status === 'active').length}
            </AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('openOrders')}</AppText>
            <AppText variant="label">—</AppText>
          </Row>
          <Row justify="space-between">
            <AppText variant="caption">{t('pendingAssign')}</AppText>
            <AppText variant="label">—</AppText>
          </Row>
        </Column>
      </Card>
    </ScreenContainer>
  );
};

export default CompanyDetailsScreen;
