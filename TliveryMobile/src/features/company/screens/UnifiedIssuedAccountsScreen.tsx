import {useMemo, type FC} from 'react';
import {useTranslation} from 'react-i18next';
import {
  selectCanManageCustomers,
  selectCanManageMerchants,
  selectCanViewMerchants,
  useUserStore,
} from '@app/features/user';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import IssuedAccountsListScreen from '@app/features/company/screens/IssuedAccountsListScreen';

const UnifiedIssuedAccountsScreen: FC = () => {
  const {t} = useTranslation();
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageMerchants = useUserStore(selectCanManageMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const canMerchants = canViewMerchants || canManageMerchants;
  const canCustomers = canManageCustomers;

  const allowed = useMemo(
    () => canMerchants || canCustomers,
    [canCustomers, canMerchants],
  );

  if (!allowed) {
    return (
      <ScreenContainer navTitle={t('navMerchants')}>
        <AppText variant="body" tone="secondary">
          {t('sectionComingSoon')}
        </AppText>
      </ScreenContainer>
    );
  }

  // Full-screen FlatList (not nested in a Column) so the list can fill the screen.
  return <IssuedAccountsListScreen unified />;
};

export default UnifiedIssuedAccountsScreen;
