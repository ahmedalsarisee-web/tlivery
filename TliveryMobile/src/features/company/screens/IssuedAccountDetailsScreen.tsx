import {useCallback, useMemo, useState, type FC} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  AtSign,
  ClipboardList,
  Mail,
  Phone,
  Store,
  UserRound,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import {
  useCompanyClients,
  useCompanyMerchants,
  useDeleteCompanyClient,
  useDeleteCompanyMerchant,
} from '@app/hooks/useWorkflow';
import {
  selectCanManageCustomers,
  selectCanManageMerchants,
  useUserStore,
} from '@app/features/user';
import {useAccountOrders} from '@app/hooks/useOrders';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import Row from '@app/components/row';
import CenterModal from '@app/components/center-modal';
import DetailsHeroHeader from '@app/components/details-hero-header';
import CompanyOrderCard from '@app/components/order-card/CompanyOrderCard';
import EmptyState from '@app/components/empty-state';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import type {SoftTone} from '@app/theme/tokens';
import {space} from '@app/theme/tokens';
import {getHeight} from '@app/utils/responsive-design';
import type {WaselOrder} from '@app/features/orders/types';
import {useCompanyOrderCardActions} from '@app/features/orders/hooks/useCompanyOrderCardActions';

type Route = NativeStackScreenProps<
  RootStackParamList,
  'IssuedAccountDetails'
>['route'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'IssuedAccountDetails'>;

const accountStatusTone = (status: string): SoftTone => {
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

const IssuedAccountDetailsScreen: FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const listInsets = useScreenListInsets();
  const {accountId, kind} = route.params;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManageMerchants = useUserStore(selectCanManageMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const canDelete =
    kind === 'merchant' ? canManageMerchants : canManageCustomers;

  const clientsQuery = useCompanyClients(
    {page: 1, pageSize: 100},
    kind === 'client',
  );
  const merchantsQuery = useCompanyMerchants(
    {page: 1, pageSize: 100},
    kind === 'merchant',
  );
  const ordersQuery = useAccountOrders(accountId);
  const orderActions = useCompanyOrderCardActions();
  const deleteMerchant = useDeleteCompanyMerchant();
  const deleteClient = useDeleteCompanyClient();
  const deleteMutation = kind === 'merchant' ? deleteMerchant : deleteClient;

  const account = useMemo(() => {
    const items =
      kind === 'merchant'
        ? merchantsQuery.data?.items ?? []
        : clientsQuery.data?.items ?? [];
    return items.find(item => item.id === accountId) ?? null;
  }, [accountId, clientsQuery.data?.items, kind, merchantsQuery.data?.items]);

  const orders = ordersQuery.data?.orders ?? [];
  const accountLoading =
    kind === 'merchant' ? merchantsQuery.isLoading : clientsQuery.isLoading;

  const onRefreshData = useCallback(async () => {
    await Promise.all([
      kind === 'merchant' ? merchantsQuery.refetch() : clientsQuery.refetch(),
      ordersQuery.refetch(),
    ]);
  }, [clientsQuery, kind, merchantsQuery, ordersQuery]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const title =
    kind === 'merchant' ? t('merchantDetails') : t('clientDetails');
  const typeLabel =
    kind === 'merchant'
      ? t('accountTypeMerchant')
      : t('accountTypeCustomer');
  const displayName =
    account?.displayName || account?.username || route.params.displayName || '—';
  const phone = account?.phoneNumber?.trim() || '';
  const email = account?.email?.trim() || '';
  const statusLabel = account
    ? t(`employeeStatus_${account.status}`, {defaultValue: account.status})
    : t('employeeStatus_active');

  const metaRows = useMemo(() => {
    const rows = [
      {icon: AtSign, text: account?.username ?? '—'},
      {
        icon: kind === 'merchant' ? Store : UserRound,
        text: typeLabel,
      },
    ];
    if (phone) {
      rows.push({icon: Phone, text: phone});
    }
    if (email) {
      rows.push({icon: Mail, text: email});
    }
    return rows;
  }, [account?.username, email, kind, phone, typeLabel]);

  const onConfirmDelete = () => {
    deleteMutation.mutate(accountId, {
      onSuccess: () => {
        setConfirmDelete(false);
        showToast(
          ToastType.success,
          kind === 'merchant' ? t('merchantDeleted') : t('clientDeleted'),
        );
        navigation.goBack();
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const listHeader = (
    <Column gap={space.md}>
      <DetailsHeroHeader
        name={displayName}
        initials={initials(displayName)}
        statusLabel={statusLabel}
        statusTone={accountStatusTone(account?.status ?? 'active')}
        metaRows={metaRows}
        footer={
          canDelete ? (
            <AppButton
              title={
                kind === 'merchant' ? t('deleteMerchant') : t('deleteClient')
              }
              variant="destructive"
              onPress={() => setConfirmDelete(true)}
            />
          ) : null
        }
      />

      <AppText variant="subtitle">{t('accountOrderHistory')}</AppText>
      <AppText variant="caption" tone="secondary">
        {t('accountOrderHistoryHint', {count: orders.length})}
      </AppText>
    </Column>
  );

  const renderItem = useCallback(
    ({item}: {item: WaselOrder}) => (
      <CompanyOrderCard
        order={item}
        onPress={() =>
          navigation.navigate('OrderDetails', {orderId: item.id})
        }
        {...orderActions.bind(item)}
      />
    ),
    [navigation, orderActions.bind, orderActions.extraData],
  );

  return (
    <ScreenContainer
      navTitle={title}
      scrollable={false}
      padded={false}
      bottomInset={false}
      loading={accountLoading && !account}
      refreshing={refreshing || ordersQuery.isFetching}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={orderActions.extraData}
        ListHeaderComponent={
          <View
            style={{
              paddingHorizontal: listInsets.paddingHorizontal,
              paddingTop: listInsets.paddingTop,
              marginBottom: getHeight(space.sm),
            }}>
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

      <CenterModal
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={
          kind === 'merchant' ? t('deleteMerchant') : t('deleteClient')
        }>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {kind === 'merchant'
              ? t('deleteMerchantConfirm')
              : t('deleteClientConfirm')}
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
                loading={deleteMutation.isPending}
                onPress={onConfirmDelete}
              />
            </View>
          </Row>
        </Column>
      </CenterModal>
      {orderActions.modals}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default IssuedAccountDetailsScreen;
