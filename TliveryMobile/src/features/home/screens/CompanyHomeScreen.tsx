import {useCallback, useMemo, type FC} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import RoleHomeLayout from '@app/features/home/components/role-home-layout/RoleHomeLayout';
import FleetPromoCard from '@app/features/home/components/fleet-promo-card';
import {
  COMPANY_ACTIVE_ORDER_STATUSES,
  COMPANY_PENDING_ORDER_STATUSES,
  DONE_ORDER_STATUSES,
  firstNameOf,
  formatJod,
  greetingKeyForHour,
  isSameLocalDay,
  sparkHeightsFromValues,
} from '@app/features/home/utils/roleHomeHelpers';
import {useFinanceHub} from '@app/hooks/useFinance';
import {useOrders} from '@app/hooks/useOrders';
import {
  useCompany,
  useCompanyDrivers,
  usePendingDriverApplications,
} from '@app/hooks/useWorkflow';
import {
  selectCanManageDrivers,
  selectCanViewOrders,
  selectProfileReady,
  selectUserCompanyId,
  selectUserName,
  useUserStore,
} from '@app/features/user';
import type {RootStackParamList} from '@app/types/navigation';
import {toLocalIsoDate} from '@app/utils/calendarDateUtils';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Company staff home — live orders, drivers, applications, finance hub.
 */
const CompanyHomeScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const profileReady = useUserStore(selectProfileReady);
  const companyId = useUserStore(selectUserCompanyId);
  const userName = useUserStore(selectUserName);
  const canViewOrders = useUserStore(selectCanViewOrders);
  const canManageDrivers = useUserStore(selectCanManageDrivers);

  const companyQuery = useCompany(profileReady ? companyId : null);
  const driversQuery = useCompanyDrivers(
    canManageDrivers ? companyId : null,
  );
  const appsQuery = usePendingDriverApplications(
    canManageDrivers ? companyId : null,
  );
  const ordersQuery = useOrders('all', '', profileReady && canViewOrders);
  const financeQuery = useFinanceHub(profileReady);

  const todayIso = toLocalIsoDate(new Date());
  const greeting = t(greetingKeyForHour(new Date().getHours()));
  const companyName = companyQuery.data?.name?.trim() || '';
  const displayName = firstNameOf(userName) || t('companyHomeBadge');

  const drivers = driversQuery.data?.drivers ?? [];
  const applications = appsQuery.data ?? [];
  const orders = ordersQuery.data?.orders ?? [];

  const onlineDrivers = useMemo(
    () =>
      drivers.filter(d => d.status === 'active' || d.status === 'busy').length,
    [drivers],
  );
  const pendingApps = useMemo(
    () => applications.filter(a => a.status === 'pending').length,
    [applications],
  );
  const activeOrders = useMemo(
    () =>
      orders.filter(o => COMPANY_ACTIVE_ORDER_STATUSES.has(o.status)).length,
    [orders],
  );
  const deliveredToday = useMemo(
    () =>
      orders.filter(
        o =>
          DONE_ORDER_STATUSES.has(o.status) &&
          isSameLocalDay(o.updatedAt ?? o.createdAt, todayIso),
      ).length,
    [orders, todayIso],
  );
  const pendingOrders = useMemo(
    () =>
      orders.filter(o => COMPANY_PENDING_ORDER_STATUSES.has(o.status)).length,
    [orders],
  );

  const driversBalance = financeQuery.data?.drivers?.totalJod ?? 0;
  const clientsBalance = financeQuery.data?.clients?.totalJod ?? 0;
  const hubTotal = driversBalance + clientsBalance;

  const maxDrivers = companyQuery.data?.maxDrivers ?? 0;
  const fleetUsed = driversQuery.data?.total ?? drivers.length;
  const capacity = `${fleetUsed}/${Math.max(maxDrivers, fleetUsed || 1)}`;

  const sparkHeights = useMemo(() => {
    const buckets = [pendingOrders, activeOrders, deliveredToday, onlineDrivers];
    return sparkHeightsFromValues(buckets.map(n => Math.max(n, 0)));
  }, [pendingOrders, activeOrders, deliveredToday, onlineDrivers]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      companyQuery.refetch(),
      canManageDrivers ? driversQuery.refetch() : Promise.resolve(),
      canManageDrivers ? appsQuery.refetch() : Promise.resolve(),
      canViewOrders ? ordersQuery.refetch() : Promise.resolve(),
      financeQuery.refetch(),
    ]);
  }, [
    companyQuery,
    driversQuery,
    appsQuery,
    ordersQuery,
    financeQuery,
    canManageDrivers,
    canViewOrders,
  ]);

  const goOrders = useCallback(
    (initialStatus?: string) => {
      navigation.navigate(
        'Orders',
        initialStatus ? {initialStatus} : undefined,
      );
    },
    [navigation],
  );
  const goAccounts = () => navigation.navigate('AccountsHub');
  const goDriversMap = () => navigation.navigate('DriversMap');

  const loading =
    (canViewOrders && ordersQuery.isLoading && !ordersQuery.data) ||
    (canManageDrivers && driversQuery.isLoading && !driversQuery.data);

  return (
    <RoleHomeLayout
      greeting={greeting}
      name={displayName}
      badgeLabel={companyName || t('companyHomeBadge')}
      heroLabel={t('companyHomeAccountsBalance')}
      heroValue={formatJod(hubTotal)}
      onHeroPress={goAccounts}
      stats={[
        {
          value: String(onlineDrivers),
          label: t('companyHomeDrivers'),
          sub: t('companyHomeOnline'),
          onPress: goDriversMap,
        },
        {
          value: String(activeOrders),
          label: t('companyHomeOrders'),
          sub: t('companyHomeActive'),
          onPress: () => goOrders('onTheWay'),
        },
        {
          value: String(deliveredToday),
          label: t('companyHomeOrders'),
          sub: t('companyHomeDeliveredToday'),
          onPress: () => goOrders('delivered'),
        },
        {
          value: canManageDrivers ? String(pendingApps) : capacity,
          label: canManageDrivers
            ? t('companyHomeApplications')
            : t('companyHomeCapacity'),
          sub: canManageDrivers
            ? t('companyHomePending')
            : t('companyHomeDrivers'),
          onPress: canManageDrivers ? undefined : goDriversMap,
        },
      ]}
      summaryTitle={t('companyHomeOpsSummary')}
      summaryLabel={t('companyHomeAccountsBalance')}
      summaryValue={formatJod(hubTotal)}
      sparkHeights={sparkHeights}
      breakRows={[
        {
          label: t('companyHomeDriversBalance'),
          value: formatJod(driversBalance),
          onPress: goAccounts,
        },
        {
          label: t('companyHomeClientsBalance'),
          value: formatJod(clientsBalance),
          onPress: goAccounts,
        },
        {
          label: t('companyHomePendingOrders'),
          value: String(pendingOrders),
          onPress: () => goOrders('pending'),
        },
        {
          label: t('companyHomeActiveOrders'),
          value: String(activeOrders),
          onPress: () => goOrders('onTheWay'),
        },
      ]}
      onViewAll={() => goOrders()}
      extraContent={
        canManageDrivers ? (
          <FleetPromoCard
            used={fleetUsed}
            max={maxDrivers}
            online={onlineDrivers}
            onPressMap={goDriversMap}
          />
        ) : null
      }
      loading={loading}
      onRefresh={onRefresh}
    />
  );
};

export default CompanyHomeScreen;
