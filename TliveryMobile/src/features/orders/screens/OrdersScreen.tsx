import {useCallback, useEffect, useMemo, useRef, useState, type FC} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Filter,
  Plus,
  Search,
  Truck,
} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import Row from '@app/components/row';
import CompanyOrderCard from '@app/components/order-card/CompanyOrderCard';
import EmptyState from '@app/components/empty-state';
import SearchBar from '@app/components/search-bar';
import FilterChips from '@app/components/filter-chips';
import DayMonthPicker from '@app/components/day-month-picker';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {
  useCanCreateOrder,
  useOrders,
} from '@app/hooks/useOrders';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {
  selectProfileReady,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {listOrders as filterOrders} from '@app/services/OrdersListService';
import {applyOrderListFilter} from '@app/features/orders/applyOrderListFilter';
import {
  COMPANY_ACTIVE_ORDER_STATUSES,
  COMPANY_PENDING_ORDER_STATUSES,
  DONE_ORDER_STATUSES,
  isCompanyStaffRole,
  isDriverDistanceSort,
  orderFilterI18nKey,
  orderFilterToApiStatus,
  orderFiltersForRole,
} from '@app/features/orders/orderStatus';
import {useDriverSortCoordinate} from '@app/hooks/useDriverSortCoordinate';
import {useListQueryState} from '@app/hooks/useListQueryState';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {useSafeListEndReached} from '@app/hooks/useSafeListEndReached';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {
  TAB_BAR_HEIGHT,
  TAB_HUMP_RISE,
} from '@app/navigation/components/main-tab-bar/styles';
import {useCompanyOrderCardActions} from '../hooks/useCompanyOrderCardActions';
import type {WaselOrder} from '../types';
import {ordersStyles} from './Orders.styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

const SEARCH_DEBOUNCE_MS = 400;
const COMPANY_STICKY_BAR_HEIGHT = 68;

const OrdersScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const isFocused = useIsFocused();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const canCreate = useCanCreateOrder();
  const profileReady = useUserStore(selectProfileReady);
  const role = useUserStore(selectUserRole);
  const orderActions = useCompanyOrderCardActions();
  const isDriver = role === 'driver';
  const isCompany = isCompanyStaffRole(role);
  const listInsets = useScreenListInsets(!isCompany);
  const filters = useListQueryState(5);
  const debouncedQ = useDebouncedValue(filters.state.q, SEARCH_DEBOUNCE_MS);
  const roleFilters = useMemo(() => orderFiltersForRole(role), [role]);
  const apiStatus =
    orderFilterToApiStatus(filters.state.status, role) ?? 'all';
  const ordersQuery = useOrders(apiStatus, debouncedQ, isFocused);
  const source = ordersQuery.data?.orders ?? [];
  const sortByDistance = isDriver && isDriverDistanceSort(filters.state.status);
  const driverCoord = useDriverSortCoordinate(sortByDistance);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const companyTabsScrollRef = useRef<ScrollView>(null);
  const tabsViewportW = useRef(0);
  const tabLayoutsRef = useRef<Record<string, {x: number; w: number}>>({});
  const tabsAlignedRef = useRef(false);
  const styles = useMemo(
    () => ordersStyles(theme, direction, themeType),
    [direction, theme, themeType],
  );
  const rtl = isRTL(direction);

  const canListRole =
    role === 'client' ||
    role === 'merchant' ||
    role === 'driver' ||
    role === 'company_admin' ||
    role === 'company_employee';

  useEffect(() => {
    const params = route.params as {initialStatus?: string} | undefined;
    const initial = params?.initialStatus;
    if (!initial) {
      return;
    }
    if (roleFilters.includes(initial as (typeof roleFilters)[number])) {
      filters.setStatus(initial);
    }
    navigation.setParams({initialStatus: undefined} as never);
  }, [route.params, roleFilters, filters.setStatus, navigation]);

  useEffect(() => {
    if (
      filters.state.status !== 'all' &&
      !roleFilters.includes(
        filters.state.status as (typeof roleFilters)[number],
      )
    ) {
      filters.setStatus('all');
    }
  }, [filters.state.status, filters.setStatus, roleFilters]);

  const initialLoadDoneRef = useRef(false);
  if (
    source.length > 0 ||
    ordersQuery.isSuccess ||
    (ordersQuery.isFetched && !ordersQuery.isFetching)
  ) {
    initialLoadDoneRef.current = true;
  }

  const showInitialLoading =
    !initialLoadDoneRef.current &&
    source.length === 0 &&
    !ordersQuery.isError &&
    (!profileReady || (canListRole && !ordersQuery.isFetched));

  const onRefreshData = useCallback(async () => {
    filters.setPage(1);
    await ordersQuery.refetch();
  }, [filters, ordersQuery]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const listRefreshing =
    refreshing || (initialLoadDoneRef.current && ordersQuery.isFetching);

  const statusOptions = useMemo(
    () =>
      roleFilters.map(filter => ({
        value: filter,
        label: t(orderFilterI18nKey(filter)),
      })),
    [roleFilters, t],
  );

  const companyTabOptions = useMemo(
    () => (rtl ? [...statusOptions].reverse() : statusOptions),
    [rtl, statusOptions],
  );

  const scrollTabIntoView = useCallback((value: string, animated = true) => {
    const layout = tabLayoutsRef.current[value];
    const viewport = tabsViewportW.current;
    if (!layout || viewport <= 0) {
      return;
    }
    const x = Math.max(0, layout.x - Math.max(0, viewport - layout.w) / 2);
    companyTabsScrollRef.current?.scrollTo({x, animated});
  }, []);

  const onCompanyTabLayout = useCallback(
    (value: string, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout;
      tabLayoutsRef.current[value] = {x, w: width};
      if (
        !tabsAlignedRef.current &&
        Object.keys(tabLayoutsRef.current).length >= statusOptions.length &&
        tabsViewportW.current > 0
      ) {
        tabsAlignedRef.current = true;
        scrollTabIntoView(filters.state.status, false);
      }
    },
    [filters.state.status, scrollTabIntoView, statusOptions.length],
  );

  const onSelectCompanyTab = useCallback(
    (value: string) => {
      filters.setStatus(value);
      requestAnimationFrame(() => scrollTabIntoView(value, true));
    },
    [filters, scrollTabIntoView],
  );

  useEffect(() => {
    tabsAlignedRef.current = false;
    tabLayoutsRef.current = {};
  }, [rtl, statusOptions.length]);

  const page = useMemo(() => {
    const prepared = applyOrderListFilter(source, filters.state.status, {
      role,
      driverCoord,
    });
    return filterOrders(prepared, {
      ...filters.params,
      status: 'all',
      q: undefined,
    });
  }, [source, filters.params, filters.state.status, role, driverCoord]);

  const companyStats = useMemo(() => {
    const delivered = source.filter(o => DONE_ORDER_STATUSES.has(o.status))
      .length;
    const onTheWay = source.filter(o =>
      COMPANY_ACTIVE_ORDER_STATUSES.has(o.status),
    ).length;
    const pending = source.filter(o =>
      COMPANY_PENDING_ORDER_STATUSES.has(o.status),
    ).length;
    return {
      delivered,
      onTheWay,
      pending,
      total: source.length,
    };
  }, [source]);

  const dateLabel = filters.state.from
    ? filters.state.from
    : t('filterAnyDate');

  const onEndReachedLoad = useCallback(() => {
    filters.loadMore(page.hasMore);
  }, [filters, page.hasMore]);

  const {onEndReached, onScrollBeginDrag, onEndReachedThreshold} =
    useSafeListEndReached(onEndReachedLoad, page.hasMore);

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

  const companyTabsBar = (
    <View style={styles.companyTabsBar}>
      <ScrollView
        ref={companyTabsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces
        alwaysBounceHorizontal={false}
        decelerationRate="normal"
        nestedScrollEnabled
        directionalLockEnabled
        overScrollMode="never"
        contentContainerStyle={styles.companyTabsRow}
        onLayout={event => {
          tabsViewportW.current = event.nativeEvent.layout.width;
        }}>
        {companyTabOptions.map(option => {
          const active = filters.state.status === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{selected: active}}
              onPress={() => onSelectCompanyTab(option.value)}
              onLayout={event => onCompanyTabLayout(option.value, event)}
              style={[
                styles.companyTab,
                active && styles.companyTabActive,
              ]}>
              <AppText
                style={[
                  styles.companyTabText,
                  active && styles.companyTabTextActive,
                ]}
                numberOfLines={1}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const companyListHeader = (
    <Column gap={space.md}>
      <View style={styles.companyStatsRow}>
        <View
          style={[styles.companyStatCard, {backgroundColor: '#E8F8EF'}]}>
          <CheckCircle2 color="#15803D" size={16} strokeWidth={2.4} />
          <AppText style={styles.companyStatValue}>
            {companyStats.delivered}
          </AppText>
          <AppText style={styles.companyStatLabel} numberOfLines={2}>
            {t('companyOrdersStatDelivered')}
          </AppText>
        </View>
        <View
          style={[styles.companyStatCard, {backgroundColor: '#E8F1FF'}]}>
          <Truck color="#1D4ED8" size={16} strokeWidth={2.4} />
          <AppText style={styles.companyStatValue}>
            {companyStats.onTheWay}
          </AppText>
          <AppText style={styles.companyStatLabel} numberOfLines={2}>
            {t('companyOrdersStatOnTheWay')}
          </AppText>
        </View>
        <View
          style={[styles.companyStatCard, {backgroundColor: '#FFF4E0'}]}>
          <Clock3 color="#B45309" size={16} strokeWidth={2.4} />
          <AppText style={styles.companyStatValue}>
            {companyStats.pending}
          </AppText>
          <AppText style={styles.companyStatLabel} numberOfLines={2}>
            {t('companyOrdersStatPending')}
          </AppText>
        </View>
        <View
          style={[styles.companyStatCard, {backgroundColor: '#F3E8FF'}]}>
          <ClipboardList color="#7E22CE" size={16} strokeWidth={2.4} />
          <AppText style={styles.companyStatValue}>
            {companyStats.total}
          </AppText>
          <AppText style={styles.companyStatLabel} numberOfLines={2}>
            {t('companyOrdersStatTotal')}
          </AppText>
        </View>
      </View>

      <View style={styles.companySearchWrap}>
        <Search color="#94A3B8" size={17} strokeWidth={2.2} />
        <TextInput
          value={filters.state.q}
          onChangeText={filters.setQuery}
          placeholder={t('companyOrdersSearchPlaceholder')}
          placeholderTextColor="#94A3B8"
          style={styles.companySearchInput}
          returnKeyType="search"
        />
      </View>
    </Column>
  );

  const defaultListHeader = (
    <Column gap={space.sm}>
      <SearchBar
        value={filters.state.q}
        onChangeText={filters.setQuery}
        placeholder={t('searchOrdersPlaceholder')}
      />

      <FilterChips
        options={statusOptions}
        value={filters.state.status}
        onChange={filters.setStatus}
      />

      <Row gap={space.xs} justify="space-between" align="center">
        <Pressable
          accessibilityRole="button"
          onPress={() => setCalendarOpen(true)}
          style={[
            styles.dateChip,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <Calendar size={15} color={theme.typography.secondary} />
          <AppText variant="caption" tone="secondary">
            {dateLabel}
          </AppText>
        </Pressable>
        {filters.state.q ||
        filters.state.status !== 'all' ||
        filters.state.from ? (
          <Pressable
            accessibilityRole="button"
            onPress={filters.reset}
            hitSlop={8}
            style={styles.clearBtn}>
            <AppText variant="caption" style={{color: theme.brand.navy}}>
              {t('clearFilters')}
            </AppText>
          </Pressable>
        ) : null}
      </Row>

      {canCreate ? (
        <AppButton
          title={t('createOrder')}
          onPress={() => navigation.navigate('CreateOrder')}
        />
      ) : null}

      <View style={{height: getHeight(space.xs)}} />
    </Column>
  );

  const stickyBottomPad =
    isCompany && canCreate
      ? getHeight(COMPANY_STICKY_BAR_HEIGHT) + getHeight(12)
      : 0;

  const stickyBarOffset =
    TAB_BAR_HEIGHT + TAB_HUMP_RISE + Math.max(insets.bottom, 8);

  return (
    <ScreenContainer
      navTitle={isCompany ? t('companyOrdersTitle') : t('orders')}
      withNavHeader={!isCompany}
      scrollable={false}
      padded={false}
      bottomInset={false}
      refreshing={listRefreshing}
      loading={showInitialLoading}
      trackApiLoading={false}
      showDoodle={!isCompany}>
      {isCompany ? (
        <>
          <StatusBar
            translucent
            barStyle="light-content"
            backgroundColor="transparent"
          />
          <View
            style={[
              styles.companyChrome,
              {paddingTop: insets.top + getHeight(6)},
            ]}>
            <View style={styles.companyChromeTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('notifications')}
                onPress={() => navigation.navigate('Notifications')}
                style={styles.companyChromeIconBtn}
                hitSlop={8}>
                <Bell color="#FFFFFF" size={20} strokeWidth={2.2} />
                <View style={styles.companyChromeBellDot} />
              </Pressable>
              <View style={styles.companyChromeTitleWrap}>
                <AppText style={styles.companyChromeTitle}>
                  {t('companyOrdersTitle')}
                </AppText>
                <AppText style={styles.companyChromeSub}>
                  {t('companyOrdersSubtitle')}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('filterAnyDate')}
                onPress={() => setCalendarOpen(true)}
                style={styles.companyChromeIconBtn}
                hitSlop={8}>
                <Filter color="#FFFFFF" size={20} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>
        </>
      ) : null}

      <View style={isCompany ? styles.companyBody : {flex: 1}}>
        {isCompany ? companyTabsBar : null}
        <FlatList
          data={page.items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={orderActions.extraData}
          ListHeaderComponent={
            isCompany ? companyListHeader : defaultListHeader
          }
          ListEmptyComponent={
            showInitialLoading ? null : (
              <EmptyState
                illustration={
                  <ClipboardList
                    size={56}
                    color={theme.typography.caption}
                    strokeWidth={1.5}
                  />
                }
                title={t('emptyOrdersTitle')}
                description={t('emptyOrdersFiltered')}
                actionTitle={
                  filters.state.q ||
                  filters.state.status !== 'all' ||
                  filters.state.from
                    ? t('clearFilters')
                    : canCreate
                      ? t('createOrder')
                      : undefined
                }
                onAction={
                  filters.state.q ||
                  filters.state.status !== 'all' ||
                  filters.state.from
                    ? filters.reset
                    : canCreate
                      ? () => navigation.navigate('CreateOrder')
                      : undefined
                }
              />
            )
          }
          ItemSeparatorComponent={() => (
            <View style={styles.companyListGap} />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          onScrollBeginDrag={onScrollBeginDrag}
          refreshControl={
            <AppRefreshControl
              refreshing={listRefreshing}
              onRefresh={onRefresh}
              progressViewOffset={listInsets.progressViewOffset}
            />
          }
          showsVerticalScrollIndicator={false}
          style={{flex: 1}}
          contentContainerStyle={{
            paddingTop: isCompany ? getHeight(14) : listInsets.paddingTop,
            paddingBottom: listInsets.paddingBottom + stickyBottomPad,
            paddingHorizontal: getWidth(8),
            ...(page.items.length === 0 ? {flexGrow: 1} : null),
          }}
        />
      </View>

      {isCompany && canCreate ? (
        <View
          style={[
            styles.companyStickyBar,
            {
              bottom: stickyBarOffset,
              paddingBottom: getHeight(10),
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('CreateOrder')}
            style={styles.companyStickyPrimary}>
            <Plus color="#FFFFFF" size={16} strokeWidth={2.6} />
            <AppText style={styles.companyStickyPrimaryText}>
              {t('companyOrdersNewOrder')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <DayMonthPicker
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedIso={filters.state.from}
        onSelectDay={iso => {
          filters.setDateRange(iso, iso);
          setCalendarOpen(false);
        }}
      />
      {orderActions.modals}
    </ScreenContainer>
  );
};

export default OrdersScreen;
