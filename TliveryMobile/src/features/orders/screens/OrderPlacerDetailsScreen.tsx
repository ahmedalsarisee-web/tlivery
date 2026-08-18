import {useCallback, useMemo, type FC} from 'react';
import {FlatList, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  Building2,
  ClipboardList,
  Mail,
  Phone,
  Store,
  UserRound,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import type {RootStackParamList} from '@app/types/navigation';
import {useUserProfile} from '@app/hooks/useWorkflow';
import {useAccountOrders} from '@app/hooks/useOrders';
import {
  selectIsCompanyStaff,
  useUserStore,
} from '@app/features/user';
import {resolveOrderSource} from '@app/features/orders/orderStatus';
import type {WaselOrder} from '@app/features/orders/types';
import {useCompanyOrderCardActions} from '@app/features/orders/hooks/useCompanyOrderCardActions';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import DetailsHeroHeader from '@app/components/details-hero-header';
import CompanyOrderCard from '@app/components/order-card/CompanyOrderCard';
import EmptyState from '@app/components/empty-state';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {space} from '@app/theme/tokens';
import {getHeight} from '@app/utils/responsive-design';
import {orderPlacerDetailsStyles} from './OrderPlacerDetails.styles';

type Route = NativeStackScreenProps<
  RootStackParamList,
  'OrderPlacerDetails'
>['route'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'OrderPlacerDetails'>;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const OrderPlacerDetailsScreen: FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const listInsets = useScreenListInsets();
  const styles = useMemo(
    () => orderPlacerDetailsStyles(theme, direction),
    [theme, direction],
  );

  const {
    userId,
    role,
    displayName: paramDisplayName,
    companyName,
    accountId: paramAccountId,
  } = route.params;

  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const source = resolveOrderSource(role);
  const isIssuedAccount = role === 'client' || role === 'merchant';
  const accountId =
    paramAccountId?.trim() ||
    (isIssuedAccount ? userId : undefined);

  const profileQuery = useUserProfile(userId || null);
  const ordersQuery = useAccountOrders(
    isCompanyStaff && isIssuedAccount ? accountId ?? null : null,
  );
  const orderActions = useCompanyOrderCardActions();

  const profile = profileQuery.data;
  const orders = ordersQuery.data?.orders ?? [];

  const roleLabel = useMemo(() => {
    if (role === 'merchant') {
      return t('orderSourceMerchant');
    }
    if (role === 'client') {
      return t('orderSourceClient');
    }
    if (role === 'company_admin') {
      return t('orderPlacerRoleAdmin');
    }
    if (role === 'company_employee') {
      return t('orderPlacerRoleEmployee');
    }
    return t('orderSourceCompany');
  }, [role, t]);

  const displayName =
    profile?.displayName?.trim() ||
    paramDisplayName?.trim() ||
    (source === 'company' ? companyName?.trim() : '') ||
    roleLabel;

  const phone = profile?.phoneNumber?.trim() || '';
  const email = profile?.email?.trim() || '';

  const metaRows = useMemo(() => {
    const rows = [
      {
        icon: source === 'company' ? Building2 : role === 'merchant' ? Store : UserRound,
        text: roleLabel,
      },
    ];
    if (source === 'company' && companyName?.trim()) {
      rows.push({icon: Building2, text: companyName.trim()});
    }
    if (phone) {
      rows.push({icon: Phone, text: phone});
    }
    if (email) {
      rows.push({icon: Mail, text: email});
    }
    return rows;
  }, [companyName, email, phone, role, roleLabel, source]);

  const canManage =
    isCompanyStaff &&
    Boolean(userId) &&
    (isIssuedAccount ||
      role === 'company_admin' ||
      role === 'company_employee');

  const onManage = () => {
    if (!canManage) {
      return;
    }
    if (isIssuedAccount && accountId) {
      navigation.navigate('IssuedAccountDetails', {
        accountId,
        kind: role === 'merchant' ? 'merchant' : 'client',
        displayName,
      });
      return;
    }
    navigation.navigate('EmployeeDetails', {employeeId: userId});
  };

  const onRefreshData = useCallback(async () => {
    await Promise.all([
      profileQuery.refetch(),
      isCompanyStaff && isIssuedAccount ? ordersQuery.refetch() : Promise.resolve(),
    ]);
  }, [isCompanyStaff, isIssuedAccount, ordersQuery, profileQuery]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const openOrder = useCallback(
    (orderId: string) => {
      navigation.navigate('OrderDetails', {orderId});
    },
    [navigation],
  );

  const listHeader = (
    <Column gap={space.md}>
      <DetailsHeroHeader
        name={displayName}
        initials={initials(displayName)}
        statusLabel={roleLabel}
        statusTone="accepted"
        metaRows={metaRows}
        footer={
          canManage ? (
            <AppButton title={t('orderPlacerManage')} onPress={onManage} />
          ) : null
        }
      />

      {isCompanyStaff && isIssuedAccount ? (
        <View>
          <AppText style={styles.sectionTitle}>
            {t('accountOrderHistory')}
          </AppText>
          <AppText style={styles.sectionHint}>
            {t('accountOrderHistoryHint', {count: orders.length})}
          </AppText>
        </View>
      ) : null}
    </Column>
  );

  const renderItem = useCallback(
    ({item}: {item: WaselOrder}) => (
      <CompanyOrderCard
        order={item}
        onPress={() => openOrder(item.id)}
        {...orderActions.bind(item)}
      />
    ),
    [openOrder, orderActions.bind, orderActions.extraData],
  );

  const showOrdersList = isCompanyStaff && isIssuedAccount;

  return (
    <ScreenContainer
      navTitle={t('senderDetailsTitle')}
      scrollable={!showOrdersList}
      padded={!showOrdersList}
      bottomInset={!showOrdersList}
      loading={profileQuery.isLoading && !profile && !paramDisplayName}
      refreshing={refreshing || ordersQuery.isFetching}>
      {showOrdersList ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={orderActions.extraData}
          ListHeaderComponent={
            <View
              style={[
                styles.headerBlock,
                {
                  paddingHorizontal: listInsets.paddingHorizontal,
                  paddingTop: listInsets.paddingTop,
                },
              ]}>
              {listHeader}
            </View>
          }
          ListEmptyComponent={
            ordersQuery.isLoading ? null : (
              <EmptyState
                illustration={
                  <ClipboardList
                    size={56}
                    color={theme.typography.caption}
                    strokeWidth={1.5}
                  />
                }
                title={t('emptyAccountOrdersTitle')}
                description={t('emptyAccountOrdersDesc')}
              />
            )
          }
          ItemSeparatorComponent={() => (
            <View style={{height: getHeight(space.sm)}} />
          )}
          refreshControl={
            <AppRefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={listInsets.progressViewOffset}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.flex}
          contentContainerStyle={{
            paddingBottom: listInsets.paddingBottom,
            paddingHorizontal: listInsets.paddingHorizontal,
            ...(orders.length === 0 ? {flexGrow: 1} : null),
          }}
        />
      ) : (
        <Column gap={space.md}>{listHeader}</Column>
      )}
      {orderActions.modals}
    </ScreenContainer>
  );
};

export default OrderPlacerDetailsScreen;
