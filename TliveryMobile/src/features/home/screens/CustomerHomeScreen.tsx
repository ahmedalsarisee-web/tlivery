import {useCallback, useMemo, useState, type FC} from 'react';
import {Modal, Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import RoleHomeLayout from '@app/features/home/components/role-home-layout/RoleHomeLayout';
import {
  ACCOUNT_ACTIVE_ORDER_STATUSES,
  ACCOUNT_PENDING_ORDER_STATUSES,
  DONE_ORDER_STATUSES,
  firstNameOf,
  formatJod,
  greetingKeyForHour,
  isSameLocalDay,
  sparkHeightsFromValues,
} from '@app/features/home/utils/roleHomeHelpers';
import {useFinanceLedger} from '@app/hooks/useFinance';
import {useOrders} from '@app/hooks/useOrders';
import {
  selectUserId,
  selectUserName,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import type {RootStackParamList} from '@app/types/navigation';
import {toLocalIsoDate} from '@app/utils/calendarDateUtils';
import {services} from '@app/services/dependencies';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getWorkflowErrorTranslationKey} from '@app/utils/workflowError';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import {useTheme} from '@app/providers/ThemeContext';
import {space} from '@app/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Client / merchant home — own orders + ledger balance from BE.
 */
const CustomerHomeScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const {theme} = useTheme();
  const queryClient = useQueryClient();
  const userId = useUserStore(selectUserId);
  const userName = useUserStore(selectUserName);
  const role = useUserStore(selectUserRole);
  const setAuthSession = useUserStore(state => state.setAuthSession);
  const setProfile = useUserStore(state => state.setProfile);
  const [switchOpen, setSwitchOpen] = useState(false);

  const ordersQuery = useOrders('all', '', Boolean(userId));
  const ledgerQuery = useFinanceLedger(undefined, Boolean(userId));
  const membershipsQuery = useQuery({
    queryKey: ['myCompanyMemberships', userId],
    queryFn: () => services.workflow.listMyCompanyMemberships(),
    enabled: Boolean(userId) && (role === 'client' || role === 'merchant'),
  });

  const memberships = membershipsQuery.data?.memberships ?? [];
  const activeMembership =
    memberships.find(item => item.active) ?? memberships[0] ?? null;

  const todayIso = toLocalIsoDate(new Date());
  const greeting = t(greetingKeyForHour(new Date().getHours()));
  const displayName = firstNameOf(userName) || t('customer');
  const roleBadge =
    activeMembership?.companyName ||
    (role === 'merchant' ? t('customerHomeMerchant') : t('customerHomeClient'));

  const orders = ordersQuery.data?.orders ?? [];
  const transactions = ledgerQuery.data?.transactions ?? [];
  const balance = ledgerQuery.data?.account?.displayBalanceJod ?? 0;

  const activeOrders = useMemo(
    () =>
      orders.filter(o => ACCOUNT_ACTIVE_ORDER_STATUSES.has(o.status)).length,
    [orders],
  );
  const pendingOrders = useMemo(
    () =>
      orders.filter(o => ACCOUNT_PENDING_ORDER_STATUSES.has(o.status)).length,
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
  const totalOrders = ordersQuery.data?.total ?? orders.length;

  const todaySpend = useMemo(() => {
    return transactions
      .filter(row => isSameLocalDay(row.createdAt, todayIso))
      .reduce((sum, row) => sum + Math.abs(Number(row.displayAmountJod) || 0), 0);
  }, [transactions, todayIso]);

  const sparkHeights = useMemo(() => {
    const recent = transactions
      .slice(0, 8)
      .map(row => Math.abs(Number(row.displayAmountJod) || 0))
      .reverse();
    return sparkHeightsFromValues(recent);
  }, [transactions]);

  const switchCompany = useMutation({
    mutationFn: async (companyId: string) => {
      await services.workflow.switchActiveCompany(companyId);
      const session = await services.auth.refreshSession();
      const profile = await services.workflow.repository.getUserProfile(
        session.user.id,
      );
      return {session, profile, companyId};
    },
    onSuccess: async ({session, profile, companyId}) => {
      setAuthSession(session.user);
      setProfile(profile);
      setSwitchOpen(false);
      const name =
        memberships.find(item => item.companyId === companyId)?.companyName ||
        t('appName');
      showToast(
        ToastType.success,
        t('companySwitchedToast', {company: name}),
      );
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['orders']}),
        queryClient.invalidateQueries({queryKey: ['finance']}),
        queryClient.invalidateQueries({queryKey: ['myCompanyMemberships']}),
      ]);
    },
    onError: error =>
      showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([
      ordersQuery.refetch(),
      ledgerQuery.refetch(),
      membershipsQuery.refetch(),
    ]);
  }, [ordersQuery, ledgerQuery, membershipsQuery]);

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

  return (
    <>
      <RoleHomeLayout
        greeting={greeting}
        name={displayName}
        badgeLabel={roleBadge}
        onBadgePress={
          memberships.length > 1 ? () => setSwitchOpen(true) : undefined
        }
        heroLabel={t('customerHomeAccountBalance')}
        heroValue={formatJod(balance)}
        onHeroPress={goAccounts}
        stats={[
          {
            value: String(activeOrders),
            label: t('customerHomeOrders'),
            sub: t('customerHomeInProgress'),
            onPress: () => goOrders('active'),
          },
          {
            value: String(pendingOrders),
            label: t('customerHomeOrders'),
            sub: t('customerHomePending'),
            onPress: () => goOrders('pending'),
          },
          {
            value: String(deliveredToday),
            label: t('customerHomeOrders'),
            sub: t('customerHomeDeliveredToday'),
            onPress: () => goOrders('delivered'),
          },
          {
            value: String(totalOrders),
            label: t('customerHomeOrders'),
            sub: t('customerHomeTotal'),
            onPress: () => goOrders(),
          },
        ]}
        summaryTitle={t('customerHomeTodaySummary')}
        summaryLabel={t('customerHomeTodayActivity')}
        summaryValue={formatJod(todaySpend)}
        sparkHeights={sparkHeights}
        breakRows={[
          {
            label: t('customerHomeAccountBalance'),
            value: formatJod(balance),
            onPress: goAccounts,
          },
          {
            label: t('customerHomeActiveOrders'),
            value: String(activeOrders),
            onPress: () => goOrders('active'),
          },
          {
            label: t('customerHomePendingOrders'),
            value: String(pendingOrders),
            onPress: () => goOrders('pending'),
          },
          {
            label: t('customerHomeDeliveredToday'),
            value: String(deliveredToday),
            onPress: () => goOrders('delivered'),
          },
        ]}
        onViewAll={() => goOrders()}
        loading={ordersQuery.isLoading && !ordersQuery.data}
        onRefresh={onRefresh}
      />

      <Modal
        visible={switchOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitchOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setSwitchOpen(false)}>
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: theme.backgrounds.surface,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: space.lg,
              gap: space.sm,
            }}>
            <AppText variant="heading">{t('switchCompany')}</AppText>
            <AppText variant="caption">{t('activeCompany')}</AppText>
            {memberships.map(item => (
              <AppButton
                key={item.companyId}
                title={
                  item.active
                    ? `${item.companyName} ✓`
                    : item.companyName
                }
                variant={item.active ? 'primary' : 'secondary'}
                disabled={switchCompany.isPending || item.active}
                onPress={() => switchCompany.mutate(item.companyId)}
              />
            ))}
            <AppButton
              title={t('cancel')}
              variant="secondary"
              onPress={() => setSwitchOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default CustomerHomeScreen;
