import {useCallback, useMemo, useState, type FC} from 'react';
import {ActivityIndicator, Pressable, ScrollView, View} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Check, UserPlus, X} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import CenterModal from '@app/components/center-modal';
import Row from '@app/components/row';
import Column from '@app/components/column';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import SearchBar from '@app/components/search-bar';
import OrderStatusTimeline from '@app/components/order-status-timeline';
import StatusChip from '@app/components/status-chip';
import {orderStatusTone, resolveOrderSource, orderSourceI18nKey} from '@app/features/orders/orderStatus';
import {
  selectCanManageOrders,
  selectUserCompanyId,
  selectUserId,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {useCompanyDrivers} from '@app/hooks/useWorkflow';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {
  useAcceptOrder,
  useAssignDriverToOrder,
  useCancelOrder,
  useDeleteOrder,
  useDriverDeliverOrder,
  useDriverReceiveOrder,
  useOrder,
  useUnassignDriverFromOrder,
} from '@app/hooks/useOrders';
import {locationTracker} from '@app/services/locationTracker';
import OrderTrackingCard from '@app/components/live-tracking/OrderTrackingCard';
import {space} from '@app/theme/tokens';
import {OrderStatus} from '../types';
import {orderDetailsStyles} from './OrderDetails.styles';

type DetailsRoute = RouteProp<RootStackParamList, 'OrderDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusI18nKey = (status: OrderStatus): string => `orderStatus_${status}`;

const formatOrderDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const OrderDetailsScreen: FC = () => {
  const route = useRoute<DetailsRoute>();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const canManageOrders = useUserStore(selectCanManageOrders);
  const companyId = useUserStore(selectUserCompanyId);
  const role = useUserStore(selectUserRole);
  const userId = useUserStore(selectUserId);
  const orderQuery = useOrder(route.params.orderId);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const debouncedAssignSearch = useDebouncedValue(assignSearch, 250);
  const driversQuery = useCompanyDrivers(companyId, {
    forOrderAssign: true,
    q: debouncedAssignSearch,
    status: 'active',
  });
  const acceptMutation = useAcceptOrder();
  const cancelMutation = useCancelOrder();
  const assignMutation = useAssignDriverToOrder();
  const unassignMutation = useUnassignDriverFromOrder();
  const deleteMutation = useDeleteOrder();
  const receiveMutation = useDriverReceiveOrder();
  const deliverMutation = useDriverDeliverOrder();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const styles = useMemo(
    () => orderDetailsStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const order = orderQuery.data;
  const assignDrivers = driversQuery.data?.drivers ?? [];

  const onRefresh = useCallback(async () => {
    await Promise.all([orderQuery.refetch(), driversQuery.refetch()]);
  }, [driversQuery, orderQuery]);

  if (orderQuery.isLoading && !order) {
    return (
      <ScreenContainer
        navTitle={t('trackOrder')}
        loading
        pullToRefresh={{onRefresh}}>
        <View />
      </ScreenContainer>
    );
  }

  if (!order) {
    return (
      <ScreenContainer
        navTitle={t('trackOrder')}
        pullToRefresh={{onRefresh}}>
        <AppText variant="body">{t('orderNotFound')}</AppText>
        <AppButton title={t('goBack', {defaultValue: 'Go back'})} onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const canAssign =
    canManageOrders &&
    (order.status === 'driverAssigned' ||
      order.status === 'onRoute' ||
      order.status === 'shipped');
  const canAccept = canManageOrders && order.status === 'pendingCompany';
  const canCompletePickup =
    canManageOrders && order.status === 'companyAccepted';
  const canUnassign =
    canManageOrders &&
    Boolean(order.driverId) &&
    (order.status === 'onRoute' || order.status === 'shipped');
  const canDelete =
    canManageOrders &&
    (order.status === 'companyAccepted' ||
      (order.status === 'driverAssigned' && !order.driverId));
  const canDriverDeliver =
    role === 'driver' &&
    (order.status === 'onRoute' || order.status === 'shipped') &&
    Boolean(userId) &&
    order.driverId === userId;
  const isAssignedDriver =
    role === 'driver' && Boolean(userId) && order.driverId === userId;
  const lastUpdate = order.timeline[order.timeline.length - 1]?.at;
  const lastUpdateLabel = lastUpdate
    ? (() => {
        const date = new Date(lastUpdate);
        if (Number.isNaN(date.getTime())) {
          return lastUpdate;
        }
        return date.toLocaleString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      })()
    : null;
  const source = resolveOrderSource(order.createdByRole);
  const busy =
    acceptMutation.isPending ||
    cancelMutation.isPending ||
    assignMutation.isPending ||
    unassignMutation.isPending ||
    deleteMutation.isPending ||
    receiveMutation.isPending ||
    deliverMutation.isPending;

  const onAssign = (driverId: string) => {
    assignMutation.mutate(
      {orderId: order.id, driverId},
      {
        onSuccess: () => {
          setAssignOpen(false);
          showToast(ToastType.success, t('driverAssignedToast'));
        },
        onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  const onUnassign = () => {
    unassignMutation.mutate(order.id, {
      onSuccess: () =>
        showToast(ToastType.success, t('driverUnassignedToast')),
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onAccept = () => {
    acceptMutation.mutate(order.id, {
      onSuccess: () => showToast(ToastType.success, t('orderAcceptedToast')),
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onConfirmReject = () => {
    cancelMutation.mutate(order.id, {
      onSuccess: () => {
        setRejectOpen(false);
        showToast(ToastType.success, t('orderRejectedToast'));
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onConfirmDelete = () => {
    deleteMutation.mutate(order.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        showToast(ToastType.success, t('orderDeletedToast'));
        navigation.goBack();
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onCompletePickup = () => {
    receiveMutation.mutate(order.id, {
      onSuccess: () => {
        showToast(ToastType.success, t('pickupCompletedToast'));
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onDriverDeliver = () => {
    deliverMutation.mutate(order.id, {
      onSuccess: () => {
        showToast(ToastType.success, t('orderDeliveredToast'));
        void locationTracker.completeDelivery();
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  return (
    <ScreenContainer navTitle={t('trackOrder')} pullToRefresh={{onRefresh}}>
      <Column gap={space.xs}>
        <Row justify="space-between" align="center">
          <Column gap={2} flex={1}>
            <AppText variant="heading">{order.reference}</AppText>
            <AppText style={styles.headerMeta}>
              {`${order.customerName} · ${formatOrderDate(order.createdAt)}`}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {t(orderSourceI18nKey(source))}
            </AppText>
          </Column>
          <Column align="flex-end" gap={space.xs}>
            <StatusChip
              label={t(statusI18nKey(order.status))}
              tone={orderStatusTone(order.status)}
            />
            {canAccept ? (
              <Row gap={space.sm}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('acceptOrder')}
                  hitSlop={8}
                  disabled={busy}
                  onPress={onAccept}
                  style={[
                    styles.decisionBtn,
                    styles.decisionBtnAccept,
                    busy ? {opacity: 0.55} : null,
                  ]}>
                  {acceptMutation.isPending ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.status.success}
                    />
                  ) : (
                    <Check
                      size={22}
                      color={theme.status.success}
                      strokeWidth={2.6}
                    />
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('rejectOrder')}
                  hitSlop={8}
                  disabled={busy}
                  onPress={() => setRejectOpen(true)}
                  style={[
                    styles.decisionBtn,
                    styles.decisionBtnReject,
                    busy ? {opacity: 0.55} : null,
                  ]}>
                  <X size={22} color={theme.status.error} strokeWidth={2.6} />
                </Pressable>
              </Row>
            ) : null}
            {canCompletePickup ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('completePickup')}
                hitSlop={8}
                disabled={busy}
                onPress={onCompletePickup}
                style={[
                  styles.decisionBtn,
                  styles.decisionBtnAccept,
                  busy ? {opacity: 0.55} : null,
                ]}>
                {receiveMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.status.success}
                  />
                ) : (
                  <Check
                    size={22}
                    color={theme.status.success}
                    strokeWidth={2.6}
                  />
                )}
              </Pressable>
            ) : null}
            {canAssign && order.status === 'driverAssigned' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('assignDriver')}
                hitSlop={8}
                disabled={busy}
                onPress={() => setAssignOpen(true)}
                style={[
                  styles.assignChip,
                  busy ? {opacity: 0.55} : null,
                ]}>
                <Row gap={4} align="center">
                  <UserPlus
                    size={16}
                    color={themeType === 'dark' ? '#93C5FD' : '#1D4ED8'}
                    strokeWidth={2.4}
                  />
                  <AppText style={styles.assignChipText}>
                    {t('assignDriver')}
                  </AppText>
                </Row>
              </Pressable>
            ) : null}
          </Column>
        </Row>
      </Column>

      {canDriverDeliver ||
      (canAssign && order.status !== 'driverAssigned') ||
      canUnassign ||
      canDelete ? (
        <Column gap={space.xs}>
          {canAssign && order.status !== 'driverAssigned' ? (
            <AppButton
              title={
                order.driverId ? t('reassignDriver') : t('assignDriver')
              }
              onPress={() => setAssignOpen(true)}
              disabled={busy}
            />
          ) : null}
          {canUnassign ? (
            <AppButton
              title={t('unassignDriver')}
              variant="secondary"
              onPress={onUnassign}
              loading={unassignMutation.isPending}
              disabled={busy}
            />
          ) : null}
          {canDriverDeliver ? (
            <>
              <AppText variant="caption" tone="secondary">
                {t('driverDeliverHint')}
              </AppText>
              <AppButton
                title={t('deliverOrder')}
                onPress={onDriverDeliver}
                loading={deliverMutation.isPending}
                disabled={busy}
              />
            </>
          ) : null}
          {canDelete ? (
            <AppButton
              title={t('deleteOrder')}
              variant="destructive"
              onPress={() => setDeleteOpen(true)}
              disabled={busy}
            />
          ) : null}
        </Column>
      ) : null}

      <OrderStatusTimeline
        status={order.status}
        etaMinutes={order.etaMinutes}
        lastUpdateAt={lastUpdate}
      />

      <OrderTrackingCard
        order={order}
        isAssignedDriver={isAssignedDriver}
      />

      <View style={styles.detailCard}>
        <AppText style={styles.sectionTitle}>{t('shipmentDetails')}</AppText>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('pickupAddress')}</AppText>
          <AppText style={styles.detailValue} numberOfLines={3}>
            {order.pickupAddress}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('dropoffAddress')}</AppText>
          <AppText style={styles.detailValue} numberOfLines={3}>
            {order.dropoffAddress}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('lastUpdate')}</AppText>
          <AppText style={styles.detailValue}>
            {lastUpdateLabel
              ? `${lastUpdateLabel} · ${t(statusI18nKey(order.status))}`
              : t(statusI18nKey(order.status))}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('customerPhone')}</AppText>
          <AppText style={styles.detailValue}>{order.customerPhone}</AppText>
        </View>
        {order.notes?.trim() ? (
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>{t('shipmentNotes')}</AppText>
            <AppText style={styles.detailValue}>{order.notes.trim()}</AppText>
          </View>
        ) : null}
        <Row justify="space-between" align="center">
          <AppText style={styles.detailValue}>
            {order.amountJod.toFixed(2)} {t('jod')}
            {order.isCod ? ` · ${t('cod')}` : ''}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {order.assignmentMode === 'ai' ? t('aiAssign') : t('manualAssign')}
          </AppText>
        </Row>
      </View>

      <View style={styles.detailCard}>
        <AppText style={styles.sectionTitle}>{t('assignment')}</AppText>
        <AppText style={styles.detailValue}>
          {order.companyName ?? t('awaitingCompany')}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {order.driverName
            ? `${t('driver')}: ${order.driverName}`
            : t('awaitingDriver')}
        </AppText>
      </View>

      <BottomSheetModal
        visible={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setAssignSearch('');
        }}
        title={t('assignDriver')}
        subtitle={t('assignDriverHint')}
        minHeight={360}>
        <Column gap={8}>
          <SearchBar
            value={assignSearch}
            onChangeText={setAssignSearch}
            placeholder={t('searchDriversPlaceholder')}
          />
          <ScrollView
            style={{maxHeight: 320}}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Column gap={8}>
              {assignDrivers.map(driver => (
                <AppButton
                  key={driver.id}
                  title={`${driver.fullName}${
                    driver.vehicleType
                      ? ` · ${t(`vehicle_${driver.vehicleType}`, {
                          defaultValue: driver.vehicleType,
                        })}`
                      : ''
                  }`}
                  variant={
                    order.driverId === driver.id ? 'primary' : 'secondary'
                  }
                  loading={
                    assignMutation.isPending &&
                    assignMutation.variables?.driverId === driver.id
                  }
                  disabled={busy}
                  onPress={() => onAssign(driver.id)}
                />
              ))}
              {assignDrivers.length === 0 ? (
                <AppText variant="body" tone="secondary">
                  {debouncedAssignSearch.trim()
                    ? t('emptyDriversFiltered')
                    : t('noActiveDrivers')}
                </AppText>
              ) : null}
            </Column>
          </ScrollView>
        </Column>
      </BottomSheetModal>

      <CenterModal
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t('rejectOrderTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('rejectOrderBody', {ref: order.reference})}
          </AppText>
          <Row gap={space.sm}>
            <Column flex={1}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setRejectOpen(false)}
                disabled={cancelMutation.isPending}
              />
            </Column>
            <Column flex={1}>
              <AppButton
                title={t('rejectOrder')}
                variant="destructive"
                loading={cancelMutation.isPending}
                onPress={onConfirmReject}
              />
            </Column>
          </Row>
        </Column>
      </CenterModal>

      <CenterModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('deleteOrderTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('deleteOrderBody', {ref: order.reference})}
          </AppText>
          <Row gap={space.sm}>
            <Column flex={1}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setDeleteOpen(false)}
                disabled={deleteMutation.isPending}
              />
            </Column>
            <Column flex={1}>
              <AppButton
                title={t('delete')}
                variant="destructive"
                loading={deleteMutation.isPending}
                onPress={onConfirmDelete}
              />
            </Column>
          </Row>
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default OrderDetailsScreen;
