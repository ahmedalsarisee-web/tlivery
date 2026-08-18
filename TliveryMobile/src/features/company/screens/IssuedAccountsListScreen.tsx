import {useCallback, useMemo, useRef, type FC} from 'react';
import {FlatList, Platform, Pressable, StyleSheet, View} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Plus, Store, Users} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import type {CompanyIssuedAccount} from '@app/models/workflow.model';
import {
  useCompanyClients,
  useCompanyMerchants,
} from '@app/hooks/useWorkflow';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {
  selectCanManageCustomers,
  selectCanManageMerchants,
  selectCanViewMerchants,
  useUserStore,
} from '@app/features/user';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import EmptyState from '@app/components/empty-state';
import WaselMark from '@app/components/wasel-mark';
import ListLoadingFooter from '@app/components/list-loading-footer';
import IssuedAccountCard, {
  type IssuedAccountKind,
} from '@app/components/issued-account-card';
import ListScreenHeader from '@app/components/list-screen-header';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useListQueryState} from '@app/hooks/useListQueryState';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {useSafeListEndReached} from '@app/hooks/useSafeListEndReached';
import {TAB_BAR_HEIGHT} from '@app/navigation/components/main-tab-bar/styles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AccountKind = IssuedAccountKind;
type IssuedAccountRow = CompanyIssuedAccount & {accountKind: AccountKind};

type IssuedAccountsListScreenProps =
  | {
      unified: true;
      embedded?: boolean;
      kind?: never;
    }
  | {
      unified?: false;
      kind: AccountKind;
      embedded?: boolean;
    };

const SEARCH_DEBOUNCE_MS = 400;

const IssuedAccountsListScreen: FC<IssuedAccountsListScreenProps> = props => {
  const unified = props.unified === true;
  const kind = unified ? undefined : props.kind;
  const embedded = props.embedded ?? false;

  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const {theme, themeType} = useTheme();
  const listInsets = useScreenListInsets();
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;
  const onAccent = isDark ? theme.brand.navy : theme.base.white;
  const fabBottom =
    TAB_BAR_HEIGHT +
    (Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 8)) +
    getHeight(10);
  const fabStyles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: 'absolute',
          alignItems: 'center',
          gap: getHeight(4),
          zIndex: 30,
        },
        fabCircle: {
          width: getWidth(56),
          height: getWidth(56),
          borderRadius: getWidth(28),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.18,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: 4},
          elevation: 8,
        },
        fabLabel: {
          fontSize: fontSize.caption,
          color: theme.typography.primary,
          ...cairoFont('bold'),
          textAlign: 'center',
          textShadowColor: isDark
            ? 'rgba(0,0,0,0.55)'
            : 'rgba(255,255,255,0.9)',
          textShadowOffset: {width: 0, height: 1},
          textShadowRadius: 3,
        },
      }),
    [accent, isDark, theme.typography.primary],
  );
  const filters = useListQueryState(10);
  const debouncedQ = useDebouncedValue(filters.state.q, SEARCH_DEBOUNCE_MS);
  const canViewMerchants = useUserStore(selectCanViewMerchants);
  const canManageMerchants = useUserStore(selectCanManageMerchants);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const canShowMerchants = canViewMerchants || canManageMerchants;

  const listParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.state.status !== 'all' ? filters.state.status : undefined,
      page: unified ? 1 : filters.state.page,
      pageSize: unified ? 50 : filters.state.pageSize,
    }),
    [
      debouncedQ,
      filters.state.page,
      filters.state.pageSize,
      filters.state.status,
      unified,
    ],
  );

  const merchantsEnabled =
    isFocused && (unified ? canShowMerchants : kind === 'merchant');
  const clientsEnabled =
    isFocused && (unified ? canManageCustomers : kind === 'client');

  const merchantsQuery = useCompanyMerchants(listParams, merchantsEnabled);
  const clientsQuery = useCompanyClients(listParams, clientsEnabled);

  const accountsQuery = unified
    ? merchantsEnabled && clientsEnabled
      ? merchantsQuery.isLoading || clientsQuery.isLoading
        ? merchantsQuery
        : clientsQuery
      : merchantsEnabled
        ? merchantsQuery
        : clientsQuery
    : kind === 'merchant'
      ? merchantsQuery
      : clientsQuery;

  const canManage = unified
    ? canManageMerchants || canManageCustomers
    : kind === 'merchant'
      ? canManageMerchants
      : canManageCustomers;
  const addRoute = unified ? 'AddIssuedAccount' : kind === 'merchant' ? 'AddMerchant' : 'AddClient';

  const rows = useMemo(() => {
    if (!unified) {
      return (accountsQuery.data?.items ?? []).map(item => ({
        ...item,
        accountKind: kind as AccountKind,
      }));
    }

    const merged: IssuedAccountRow[] = [];
    if (canShowMerchants) {
      for (const item of merchantsQuery.data?.items ?? []) {
        merged.push({...item, accountKind: 'merchant'});
      }
    }
    if (canManageCustomers) {
      for (const item of clientsQuery.data?.items ?? []) {
        merged.push({...item, accountKind: 'client'});
      }
    }
    return merged.sort((a, b) =>
      (a.displayName || a.username).localeCompare(
        b.displayName || b.username,
        undefined,
        {sensitivity: 'base'},
      ),
    );
  }, [
    accountsQuery.data?.items,
    canManageCustomers,
    canShowMerchants,
    clientsQuery.data?.items,
    kind,
    merchantsQuery.data?.items,
    unified,
  ]);

  const listTotal = useMemo(() => {
    if (unified) {
      const merchantsTotal = canShowMerchants
        ? (merchantsQuery.data?.total ?? 0)
        : 0;
      const clientsTotal = canManageCustomers
        ? (clientsQuery.data?.total ?? 0)
        : 0;
      return merchantsTotal + clientsTotal;
    }
    return accountsQuery.data?.total ?? rows.length;
  }, [
    accountsQuery.data?.total,
    canManageCustomers,
    canShowMerchants,
    clientsQuery.data?.total,
    merchantsQuery.data?.total,
    rows.length,
    unified,
  ]);

  const countLabel = useMemo(() => {
    if (unified) {
      return t('issuedAccountsCount', {count: listTotal});
    }
    if (kind === 'merchant') {
      return t('merchantsCount', {count: listTotal});
    }
    return t('customersCount', {count: listTotal});
  }, [kind, listTotal, t, unified]);

  const hasMore = unified
    ? false
    : (accountsQuery.data?.hasMore ?? false);

  const onRefreshData = useCallback(async () => {
    filters.setPage(1);
    if (unified) {
      await Promise.all([
        merchantsEnabled ? merchantsQuery.refetch() : Promise.resolve(),
        clientsEnabled ? clientsQuery.refetch() : Promise.resolve(),
      ]);
      return;
    }
    await accountsQuery.refetch();
  }, [
    accountsQuery,
    clientsEnabled,
    clientsQuery,
    filters,
    merchantsEnabled,
    merchantsQuery,
    unified,
  ]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('employeeStatus_active')},
      {value: 'suspended', label: t('employeeStatus_suspended')},
      {value: 'disabled', label: t('employeeStatus_disabled')},
    ],
    [t],
  );

  const titles = useMemo(() => {
    if (unified) {
      return {
        nav: t('navIssuedAccounts'),
        lead: t('issuedAccountsUnifiedLead'),
        add: t('addIssuedAccount'),
        emptyTitle: t('emptyIssuedAccountsTitle'),
        emptyDesc: t('emptyIssuedAccountsDesc'),
        emptyFiltered: t('emptyIssuedAccountsFiltered'),
        search: t('searchIssuedAccountsPlaceholder'),
      };
    }
    if (kind === 'merchant') {
      return {
        nav: t('navMerchantAccounts'),
        lead: t('merchantsLead'),
        add: t('addMerchant'),
        emptyTitle: t('emptyMerchantsTitle'),
        emptyDesc: t('emptyMerchantsDesc'),
        emptyFiltered: t('emptyMerchantsFiltered'),
        search: t('searchMerchantsPlaceholder'),
      };
    }
    return {
      nav: t('navCustomerAccounts'),
      lead: t('clientsLead'),
      add: t('addClient'),
      emptyTitle: t('emptyClientsTitle'),
      emptyDesc: t('emptyClientsDesc'),
      emptyFiltered: t('emptyClientsFiltered'),
      search: t('searchClientsPlaceholder'),
    };
  }, [kind, t, unified]);

  const onEndReachedLoad = useCallback(() => {
    if (unified || accountsQuery.isFetching) {
      return;
    }
    filters.loadMore(hasMore);
  }, [accountsQuery.isFetching, filters, hasMore, unified]);

  const {
    onEndReached,
    onScrollBeginDrag,
    onEndReachedThreshold,
  } = useSafeListEndReached(onEndReachedLoad, hasMore);

  const isError = unified
    ? (merchantsEnabled && merchantsQuery.isError) ||
      (clientsEnabled && clientsQuery.isError)
    : accountsQuery.isError;

  const isFetching = unified
    ? (merchantsEnabled && merchantsQuery.isFetching) ||
      (clientsEnabled && clientsQuery.isFetching)
    : accountsQuery.isFetching;

  const hasQueryData = unified
    ? (merchantsEnabled && merchantsQuery.data != null) ||
      (clientsEnabled && clientsQuery.data != null)
    : accountsQuery.data != null;

  // Once the screen has received any list response, never show the full-screen
  // loader again — filter/search create new query keys that reset isFetched.
  const initialLoadDoneRef = useRef(false);
  if (
    hasQueryData ||
    merchantsQuery.isSuccess ||
    clientsQuery.isSuccess ||
    accountsQuery.isSuccess ||
    ((merchantsQuery.isFetched ||
      clientsQuery.isFetched ||
      accountsQuery.isFetched) &&
      !isFetching &&
      !isError)
  ) {
    initialLoadDoneRef.current = true;
  }

  const showInitialLoading =
    !initialLoadDoneRef.current && rows.length === 0 && !isError;

  const listHeader = (
    <ListScreenHeader
      search={{
        value: filters.state.q,
        onChangeText: filters.setQuery,
        placeholder: titles.search,
      }}
      filters={{
        options: statusOptions,
        value: filters.state.status,
        onChange: filters.setStatus,
      }}
      countLabel={countLabel}
      showClear={Boolean(filters.state.q || filters.state.status !== 'all')}
      onClearFilters={filters.reset}
      error={isError ? t('workflowRequestFailed') : null}
    />
  );

  const renderItem = useCallback(
    ({item}: {item: IssuedAccountRow}) => {
      const name = item.displayName || item.username;
      return (
        <IssuedAccountCard
          account={item}
          kind={item.accountKind}
          showKindLabel={unified}
          onPress={() =>
            navigation.navigate('IssuedAccountDetails', {
              accountId: item.id,
              kind: item.accountKind,
              displayName: name,
            })
          }
        />
      );
    },
    [navigation, unified],
  );

  const EmptyIcon = unified ? Users : kind === 'merchant' ? Store : Users;
  const listBottomPad =
    listInsets.paddingBottom + (canManage && !embedded ? getHeight(88) : 0);

  const accountList = (
    <FlatList
      data={rows}
      keyExtractor={item => `${item.accountKind}-${item.id}`}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        showInitialLoading || isError ? null : (
          <EmptyState
            illustration={
              filters.state.q || filters.state.status !== 'all' ? (
                <EmptyIcon
                  size={56}
                  color={theme.brand.gold}
                  strokeWidth={1.4}
                />
              ) : (
                <WaselMark size={72} />
              )
            }
            title={titles.emptyTitle}
            description={
              filters.state.q || filters.state.status !== 'all'
                ? titles.emptyFiltered
                : titles.emptyDesc
            }
            actionTitle={
              filters.state.q || filters.state.status !== 'all'
                ? t('clearFilters')
                : canManage
                  ? titles.add
                  : undefined
            }
            onAction={
              filters.state.q || filters.state.status !== 'all'
                ? filters.reset
                : canManage
                  ? () => navigation.navigate(addRoute)
                  : undefined
            }
            actionVariant="gold"
          />
        )
      }
      ListFooterComponent={
        <ListLoadingFooter
          visible={Boolean(hasMore && isFetching && !unified)}
        />
      }
      ItemSeparatorComponent={() => (
        <View style={{height: getHeight(space.md)}} />
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScrollBeginDrag={onScrollBeginDrag}
      refreshControl={
        <AppRefreshControl
          refreshing={
            refreshing ||
            (initialLoadDoneRef.current && isFetching && rows.length > 0)
          }
          onRefresh={onRefresh}
          progressViewOffset={embedded ? 0 : listInsets.progressViewOffset}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.flex}
      contentContainerStyle={{
        paddingTop: embedded ? 0 : listInsets.paddingTop,
        paddingBottom: listBottomPad,
        paddingHorizontal: embedded ? 0 : listInsets.paddingHorizontal,
        ...(rows.length === 0 ? {flexGrow: 1} : null),
      }}
    />
  );

  if (embedded) {
    return accountList;
  }

  return (
    <ScreenContainer
      navTitle={unified ? t('navMerchants') : titles.nav}
      scrollable={false}
      padded={false}
      bottomInset={false}
      refreshing={refreshing}
      loading={showInitialLoading}
      trackApiLoading={false}>
      {accountList}
      {canManage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={titles.add}
          onPress={() => navigation.navigate(addRoute)}
          style={[
            fabStyles.fab,
            {
              end: getWidth(16),
              bottom: fabBottom,
            },
          ]}>
          <View style={fabStyles.fabCircle}>
            <Plus size={26} color={onAccent} strokeWidth={2.6} />
          </View>
          <AppText style={fabStyles.fabLabel} numberOfLines={1}>
            {titles.add}
          </AppText>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default IssuedAccountsListScreen;
