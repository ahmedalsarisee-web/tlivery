import {useCallback, useEffect, useMemo, useRef, useState, type FC} from 'react';
import {FlatList, Platform, Pressable, View} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Truck, Plus} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import Row from '@app/components/row';
import EmptyState from '@app/components/empty-state';
import WaselMark from '@app/components/wasel-mark';
import CenterModal from '@app/components/center-modal';
import SegmentedTabBar from '@app/components/segmented-tab-bar';
import ListScreenHeader from '@app/components/list-screen-header';
import {listScreenHeaderStyles} from '@app/components/list-screen-header/styles';
import DriverCard from '@app/components/driver-card';
import InviteCard from '@app/components/invite-card';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {useUserStore} from '@app/features/user';
import {
  useCompany,
  useCompanyDrivers,
  useDriverInvites,
  useRevokeDriverInvite,
} from '@app/hooks/useWorkflow';
import type {Driver, DriverInvite} from '@app/models/workflow.model';
import {useListQueryState} from '@app/hooks/useListQueryState';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {useSafeListEndReached} from '@app/hooks/useSafeListEndReached';
import ListLoadingFooter from '@app/components/list-loading-footer';
import {TAB_BAR_HEIGHT} from '@app/navigation/components/main-tab-bar/styles';
import {space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {
  buildDriverInviteDeepLink,
  openWhatsAppInvite,
  shareInviteCode,
} from '@app/utils/whatsappInvite';
import {driversStyles} from './Drivers.styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DriversSegment = 'drivers' | 'invites';

const SEARCH_DEBOUNCE_MS = 400;

const DriversScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const listInsets = useScreenListInsets();
  const styles = useMemo(
    () => driversStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const headerStyles = useMemo(
    () => listScreenHeaderStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );
  const fabBottom =
    TAB_BAR_HEIGHT +
    (Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 8)) +
    getHeight(10);
  const companyId = useUserStore(state => state.companyId);
  const filters = useListQueryState(8);
  const debouncedQ = useDebouncedValue(filters.state.q, SEARCH_DEBOUNCE_MS);
  const [segment, setSegment] = useState<DriversSegment>('drivers');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');
  const driversQuery = useCompanyDrivers(isFocused ? companyId : null, {
    q: debouncedQ,
    status: filters.state.status,
    page: filters.state.page,
    pageSize: filters.state.pageSize,
  });
  const driversPage = driversQuery.data;
  const [driverRows, setDriverRows] = useState<Driver[]>([]);
  const fleetTotal = driversPage?.total ?? driverRows.length;
  const companyQuery = useCompany(isFocused ? companyId : null);
  const company = companyQuery.data;
  // Defer invites until that segment is opened (badge shows 0 until then).
  const invitesQuery = useDriverInvites(
    isFocused && segment === 'invites' ? companyId : null,
  );
  const invites = invitesQuery.data ?? [];
  const revokeInvite = useRevokeDriverInvite();
  const [pendingRevokeCode, setPendingRevokeCode] = useState<string | null>(
    null,
  );

  const onRefreshData = useCallback(async () => {
    filters.setPage(1);
    const tasks = [driversQuery.refetch(), companyQuery.refetch()];
    if (segment === 'invites') {
      tasks.push(invitesQuery.refetch());
    }
    await Promise.all(tasks);
  }, [companyQuery, driversQuery, filters, invitesQuery, segment]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const pendingInvites = useMemo(
    () => invites.filter(invite => invite.status === 'pending'),
    [invites],
  );

  const tabs = useMemo(
    () => [
      {
        key: 'drivers' as const,
        label: `${t('activeDrivers')} (${fleetTotal})`,
      },
      {
        key: 'invites' as const,
        label: `${t('pendingDriverInvites')} (${pendingInvites.length})`,
      },
    ],
    [pendingInvites.length, t, fleetTotal],
  );

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('allDrivers')},
      {value: 'active', label: t('driverStatus_active')},
      {value: 'offline', label: t('driverStatus_offline')},
      {value: 'busy', label: t('driverStatus_busy')},
      {value: 'suspended', label: t('driverStatus_suspended')},
    ],
    [t],
  );

  const sortedDriverRows = useMemo(() => {
    const rows = [...driverRows];
    if (sortBy === 'rating') {
      rows.sort((a, b) => b.rating - a.rating || a.fullName.localeCompare(b.fullName));
    } else {
      rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return rows;
  }, [driverRows, sortBy]);

  const hasMore = driversPage?.hasMore ?? false;

  // After first load, filter/search must use the pull refresh spinner — not logo.
  const initialLoadDoneRef = useRef(false);
  if (
    driverRows.length > 0 ||
    driversQuery.isSuccess ||
    (driversQuery.isFetched && !driversQuery.isFetching) ||
    (segment === 'invites' &&
      (invitesQuery.isSuccess ||
        (invitesQuery.isFetched && !invitesQuery.isFetching)))
  ) {
    initialLoadDoneRef.current = true;
  }

  useEffect(() => {
    if (!driversPage) {
      return;
    }
    if ((driversPage.page ?? filters.state.page) <= 1) {
      setDriverRows(driversPage.drivers);
      return;
    }
    setDriverRows(prev => {
      const seen = new Set(prev.map(item => item.id));
      const next = driversPage.drivers.filter(item => !seen.has(item.id));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [driversPage, filters.state.page]);

  const showInitialLoading =
    !initialLoadDoneRef.current &&
    ((segment === 'drivers' &&
      driversQuery.isLoading &&
      !driversQuery.data) ||
      (segment === 'invites' &&
        invitesQuery.isLoading &&
        !invitesQuery.data) ||
      (companyQuery.isLoading && !companyQuery.data));

  const listRefreshing =
    refreshing ||
    (initialLoadDoneRef.current &&
      ((segment === 'drivers' &&
        driversQuery.isFetching &&
        (driversPage?.page ?? filters.state.page) <= 1) ||
        (segment === 'invites' && invitesQuery.isFetching)));

  const inviteMessage = (code: string) =>
    t('whatsappDriverInviteMessage', {
      companyName: company?.name ?? 'Wasel',
      code,
      link: buildDriverInviteDeepLink(code),
    });

  const onConfirmRevoke = () => {
    if (!pendingRevokeCode) {
      return;
    }
    revokeInvite.mutate(pendingRevokeCode, {
      onSuccess: () => {
        setPendingRevokeCode(null);
        showToast(ToastType.success, t('inviteRevoked'));
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onEndReachedLoad = useCallback(() => {
    if (segment !== 'drivers') {
      return;
    }
    filters.loadMore(hasMore);
  }, [filters, hasMore, segment]);

  const {
    onEndReached,
    onScrollBeginDrag,
    onEndReachedThreshold,
  } = useSafeListEndReached(
    onEndReachedLoad,
    segment === 'drivers' && hasMore,
  );

  const onSegmentChange = useCallback(
    (key: DriversSegment) => {
      setSegment(key);
      filters.setPage(1);
    },
    [filters],
  );

  const listHeader = (
    <ListScreenHeader
      topSlot={
        <SegmentedTabBar
          plain
          activeKey={segment}
          onChange={onSegmentChange}
          tabs={tabs}
        />
      }
      {...(segment === 'drivers'
        ? {
            search: {
              value: filters.state.q,
              onChangeText: filters.setQuery,
              placeholder: t('searchDriversPlaceholder'),
            },
            filters: {
              options: statusOptions,
              value: filters.state.status,
              onChange: filters.setStatus,
            },
            countLabel: t('driversCount', {count: fleetTotal}),
            trailingAction: (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setSortBy(prev => (prev === 'name' ? 'rating' : 'name'))
                }
                style={headerStyles.sortBtn}
                hitSlop={8}>
                <AppText style={headerStyles.sortLabel}>
                  {sortBy === 'name' ? t('sortByName') : t('sortByRating')}
                </AppText>
              </Pressable>
            ),
            showClear: Boolean(
              filters.state.q || filters.state.status !== 'all',
            ),
            onClearFilters: filters.reset,
          }
        : {})}
    />
  );

  const renderDriver = useCallback(
    ({item}: {item: Driver}) => (
      <DriverCard
        driver={item}
        onPress={() =>
          navigation.navigate('DriverDetails', {driverId: item.id})
        }
      />
    ),
    [navigation],
  );

  const renderInvite = useCallback(
    ({item}: {item: DriverInvite}) => {
      const revokingThis =
        revokeInvite.isPending && revokeInvite.variables === item.code;
      return (
        <InviteCard
          invite={item}
          revoking={revokingThis}
          onWhatsApp={
            item.phoneNumber
              ? () => {
                  void openWhatsAppInvite({
                    phoneE164: item.phoneNumber!,
                    message: inviteMessage(item.code),
                  }).catch(() =>
                    showToast(ToastType.error, t('whatsappOpenFailed')),
                  );
                }
              : undefined
          }
          onShare={() => {
            void shareInviteCode(item.code).then(() =>
              showToast(ToastType.success, t('inviteCodeCopied')),
            );
          }}
          onRevoke={() => setPendingRevokeCode(item.code || item.id)}
        />
      );
    },
    // inviteMessage closes over company/t — recreate when those change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company?.name, revokeInvite.isPending, revokeInvite.variables, t],
  );

  const driversEmpty =
    fleetTotal === 0 &&
    !filters.state.q &&
    filters.state.status === 'all' ? (
      <EmptyState
        illustration={<WaselMark size={72} />}
        title={t('emptyDriversTitle')}
        description={t('emptyDriversDesc')}
        actionTitle={t('addDriver')}
        onAction={() => navigation.navigate('AddDriver')}
        actionVariant="gold"
      />
    ) : (
      <EmptyState
        illustration={
          <Truck
            size={48}
            color={theme.typography.caption}
            strokeWidth={1.4}
          />
        }
        title={t('emptyDriversTitle')}
        description={t('emptyDriversFiltered')}
        actionTitle={t('clearFilters')}
        onAction={filters.reset}
      />
    );

  const invitesEmpty = (
    <EmptyState
      illustration={<WaselMark size={72} />}
      title={t('emptyInvitesTitle')}
      description={t('emptyInvitesDesc')}
      actionTitle={t('addDriver')}
      onAction={() => navigation.navigate('AddDriver')}
      actionVariant="gold"
    />
  );

  const listData = segment === 'drivers' ? sortedDriverRows : pendingInvites;
  const listEmpty =
    segment === 'drivers'
      ? sortedDriverRows.length === 0
        ? driversEmpty
        : null
      : pendingInvites.length === 0
        ? invitesEmpty
        : null;

  return (
    <ScreenContainer
      navTitle={t('tabDrivers')}
      scrollable={false}
      padded={false}
      bottomInset={false}
      refreshing={listRefreshing}
      loading={showInitialLoading}
      trackApiLoading={false}>
      <FlatList
        data={listData as Array<Driver | DriverInvite>}
        keyExtractor={item => item.id}
        renderItem={
          segment === 'drivers'
            ? (renderDriver as never)
            : (renderInvite as never)
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          showInitialLoading || listRefreshing ? null : listEmpty
        }
        ListFooterComponent={
          segment === 'drivers' ? (
            <ListLoadingFooter
              visible={Boolean(
                hasMore &&
                  driversQuery.isFetching &&
                  (driversPage?.page ?? filters.state.page) > 1,
              )}
            />
          ) : null
        }
        ItemSeparatorComponent={() => (
          <View style={{height: getHeight(space.sm)}} />
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
          paddingTop: listInsets.paddingTop,
          paddingBottom: listInsets.paddingBottom + getHeight(88),
          paddingHorizontal: listInsets.paddingHorizontal,
          ...(listData.length === 0 ? {flexGrow: 1} : null),
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('addDriver')}
        onPress={() => navigation.navigate('AddDriver')}
        style={[
          styles.fab,
          {
            end: getWidth(16),
            bottom: fabBottom,
          },
        ]}>
        <View style={styles.fabCircle}>
          <Plus
            size={26}
            color={themeType === 'dark' ? theme.brand.navy : theme.base.white}
            strokeWidth={2.6}
          />
        </View>
        <AppText style={styles.fabLabel} numberOfLines={1}>
          {t('addDriver')}
        </AppText>
      </Pressable>

      <CenterModal
        visible={pendingRevokeCode != null}
        onClose={() => setPendingRevokeCode(null)}
        title={t('revokeInviteTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('revokeInviteBody', {code: pendingRevokeCode ?? ''})}
          </AppText>
          <Row gap={space.sm}>
            <View style={styles.flex}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setPendingRevokeCode(null)}
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                title={t('revokeInvite')}
                loading={revokeInvite.isPending}
                onPress={onConfirmRevoke}
              />
            </View>
          </Row>
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default DriversScreen;
