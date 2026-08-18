import {useCallback, useMemo, type FC} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Star} from 'lucide-react-native';
import RoleHomeLayout from '@app/features/home/components/role-home-layout/RoleHomeLayout';
import {
  firstNameOf,
  formatJod,
  isSameLocalDay,
  sparkHeightsFromValues,
} from '@app/features/home/utils/roleHomeHelpers';
import {useFinanceLedger} from '@app/hooks/useFinance';
import {useOrders} from '@app/hooks/useOrders';
import {useMyDriverProfile} from '@app/hooks/useWorkflow';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {useTheme} from '@app/providers/ThemeContext';
import {
  selectUserId,
  selectUserName,
  useUserStore,
} from '@app/features/user';
import type {RootStackParamList} from '@app/types/navigation';
import {toLocalIsoDate} from '@app/utils/calendarDateUtils';
import {roleHomeStyles} from './RoleHome.styles';
import {useLanguage} from '@app/providers/LangContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Driver home — earnings, trip stats, rating (device maps from order details).
 */
const DriverHomeScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const userId = useUserStore(selectUserId);
  const userName = useUserStore(selectUserName);

  const styles = useMemo(
    () => roleHomeStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const profileQuery = useMyDriverProfile(userId);
  const ledgerQuery = useFinanceLedger(undefined, Boolean(userId));
  const ordersQuery = useOrders('all', '', Boolean(userId));

  const driver = profileQuery.data;
  const displayName = firstNameOf(driver?.fullName || userName);
  const todayIso = toLocalIsoDate(new Date());
  const isOnline =
    driver?.status === 'active' || driver?.status === 'busy';

  const transactions = ledgerQuery.data?.transactions ?? [];
  const todayEarnings = useMemo(() => {
    return transactions
      .filter(
        row =>
          row.type === 'order_delivery' &&
          isSameLocalDay(row.createdAt, todayIso),
      )
      .reduce((sum, row) => sum + (Number(row.displayAmountJod) || 0), 0);
  }, [transactions, todayIso]);

  const sparkHeights = useMemo(() => {
    const recent = transactions
      .slice(0, 8)
      .map(row => Math.abs(Number(row.displayAmountJod) || 0))
      .reverse();
    return sparkHeightsFromValues(recent);
  }, [transactions]);

  const orders = ordersQuery.data?.orders ?? [];
  const inProgressCount = useMemo(() => {
    if (typeof driver?.activeOrders === 'number' && driver.activeOrders > 0) {
      return driver.activeOrders;
    }
    return orders.filter(
      o =>
        o.status === 'driverAssigned' || isOrderInDeliveryTracking(o.status),
    ).length;
  }, [driver?.activeOrders, orders]);

  const completedToday = useMemo(
    () =>
      orders.filter(
        o =>
          (o.status === 'delivered' || o.status === 'completed') &&
          isSameLocalDay(o.updatedAt ?? o.createdAt, todayIso),
      ).length,
    [orders, todayIso],
  );

  const rating =
    typeof driver?.rating === 'number' && driver.rating > 0
      ? driver.rating
      : null;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      profileQuery.refetch(),
      ledgerQuery.refetch(),
      ordersQuery.refetch(),
    ]);
  }, [profileQuery, ledgerQuery, ordersQuery]);

  const goAccounts = () => navigation.navigate('AccountsHub');
  const goOrders = useCallback(
    (initialStatus?: string) => {
      navigation.navigate(
        'Orders',
        initialStatus ? {initialStatus} : undefined,
      );
    },
    [navigation],
  );

  return (
    <RoleHomeLayout
      greeting={t('driverHomeFleetSubtitle')}
      name={t('driverHomeFleetTitle')}
      badgeLabel={
        isOnline ? t('driverHomeOnline') : t('driverHomeOffline')
      }
      badgeOnline={isOnline}
      heroLabel={t('driverHomeTodayEarnings')}
      heroValue={formatJod(todayEarnings)}
      onHeroPress={goAccounts}
      stats={[
        {
          value: String(completedToday),
          label: t('driverHomeOrders'),
          sub: t('driverHomeCompleted'),
          onPress: () => goOrders('delivered'),
        },
        {
          value: String(inProgressCount),
          label: t('driverHomeOrders'),
          sub: t('driverHomeInProgress'),
          onPress: () => goOrders(),
        },
        {
          value: '—',
          label: t('driverHomeKm'),
          sub: t('driverHomeTraveled'),
        },
        {
          value: rating != null ? rating.toFixed(1) : '—',
          label: t('driverHomeOrders'),
          sub: t('driverHomeRating'),
          footer: (
            <View style={styles.starRow}>
              <Star
                size={12}
                color={theme.brand.gold}
                fill={theme.brand.gold}
                strokeWidth={0}
              />
            </View>
          ),
        },
      ]}
      summaryTitle={displayName || t('driverHomeTodaySummary')}
      summaryLabel={t('driverHomeEarnings')}
      summaryValue={formatJod(todayEarnings)}
      sparkHeights={sparkHeights}
      breakRows={[
        {
          label: t('driverHomeBaseFare'),
          value: formatJod(todayEarnings),
        },
        {label: t('driverHomeTips'), value: formatJod(0)},
        {label: t('driverHomeIncentives'), value: formatJod(0)},
      ]}
      onViewAll={() => goOrders()}
      loading={profileQuery.isLoading && !driver}
      onRefresh={onRefresh}
    />
  );
};

export default DriverHomeScreen;
