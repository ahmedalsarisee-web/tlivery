import {useCallback, useState, type ReactNode} from 'react';
import {ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '@app/types/navigation';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import CenterModal from '@app/components/center-modal';
import Column from '@app/components/column';
import Row from '@app/components/row';
import SearchBar from '@app/components/search-bar';
import {
  selectCanManageOrders,
  selectUserCompanyId,
  useUserStore,
} from '@app/features/user';
import {
  useAcceptOrder,
  useAssignDriverToOrder,
  useCancelOrder,
  useDriverReceiveOrder,
} from '@app/hooks/useOrders';
import {useCompanyDrivers} from '@app/hooks/useWorkflow';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {orderPlacerNavParams} from '@app/features/orders/utils/orderPlacerNav';
import type {WaselOrder} from '@app/features/orders/types';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {space} from '@app/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type CompanyOrderCardActionProps = {
  canDecide: boolean;
  canCompletePickup: boolean;
  canAssignDriver: boolean;
  deciding: 'accept' | 'reject' | 'pickup' | null;
  assigning: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCompletePickup: () => void;
  onAssignDriver: () => void;
  onShipmentDetails: () => void;
  onSenderDetails: () => void;
  onDriverDetails: () => void;
};

export function useCompanyOrderCardActions(): {
  bind: (order: WaselOrder) => CompanyOrderCardActionProps;
  extraData: string;
  modals: ReactNode;
} {
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const canManage = useUserStore(selectCanManageOrders);
  const companyId = useUserStore(selectUserCompanyId);
  const acceptMutation = useAcceptOrder();
  const cancelMutation = useCancelOrder();
  const receiveMutation = useDriverReceiveOrder();
  const assignMutation = useAssignDriverToOrder();
  const [rejectTarget, setRejectTarget] = useState<WaselOrder | null>(null);
  const [assignTarget, setAssignTarget] = useState<WaselOrder | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const debouncedAssignSearch = useDebouncedValue(assignSearch, 250);
  const driversQuery = useCompanyDrivers(assignTarget ? companyId : null, {
    forOrderAssign: true,
    q: debouncedAssignSearch,
    status: 'active',
  });
  const assignDrivers = driversQuery.data?.drivers ?? [];

  const closeAssign = useCallback(() => {
    setAssignTarget(null);
    setAssignSearch('');
  }, []);

  const bind = useCallback(
    (order: WaselOrder): CompanyOrderCardActionProps => {
      const deciding =
        acceptMutation.isPending && acceptMutation.variables === order.id
          ? 'accept'
          : cancelMutation.isPending && cancelMutation.variables === order.id
            ? 'reject'
            : receiveMutation.isPending &&
                receiveMutation.variables === order.id
              ? 'pickup'
              : null;
      return {
        canDecide: canManage && order.status === 'pendingCompany',
        canCompletePickup: canManage && order.status === 'companyAccepted',
        canAssignDriver: canManage && order.status === 'driverAssigned',
        deciding,
        assigning:
          assignMutation.isPending && assignTarget?.id === order.id,
        onAccept: () => {
          acceptMutation.mutate(order.id, {
            onSuccess: () =>
              showToast(ToastType.success, t('orderAcceptedToast')),
            onError: () =>
              showToast(ToastType.error, t('workflowRequestFailed')),
          });
        },
        onReject: () => setRejectTarget(order),
        onCompletePickup: () => {
          receiveMutation.mutate(order.id, {
            onSuccess: () =>
              showToast(ToastType.success, t('pickupCompletedToast')),
            onError: () =>
              showToast(ToastType.error, t('workflowRequestFailed')),
          });
        },
        onAssignDriver: () => setAssignTarget(order),
        onShipmentDetails: () =>
          navigation.navigate('ShipmentDetails', {orderId: order.id}),
        onSenderDetails: () => {
          const params = orderPlacerNavParams(order);
          if (!params) {
            showToast(ToastType.info, t('senderUnavailable'));
            return;
          }
          navigation.navigate('OrderPlacerDetails', params);
        },
        onDriverDetails: () => {
          const driverId = order.driverId?.trim();
          if (!driverId) {
            showToast(ToastType.info, t('driverUnavailable'));
            return;
          }
          navigation.navigate('DriverDetails', {driverId});
        },
      };
    },
    [
      acceptMutation,
      assignMutation.isPending,
      assignTarget?.id,
      canManage,
      cancelMutation,
      navigation,
      receiveMutation,
      t,
    ],
  );

  const onConfirmReject = () => {
    if (!rejectTarget) {
      return;
    }
    cancelMutation.mutate(rejectTarget.id, {
      onSuccess: () => {
        setRejectTarget(null);
        showToast(ToastType.success, t('orderRejectedToast'));
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onAssign = (driverId: string) => {
    if (!assignTarget) {
      return;
    }
    assignMutation.mutate(
      {orderId: assignTarget.id, driverId},
      {
        onSuccess: () => {
          closeAssign();
          showToast(ToastType.success, t('driverAssignedToast'));
        },
        onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  const extraData = [
    canManage,
    acceptMutation.isPending,
    acceptMutation.variables,
    cancelMutation.isPending,
    cancelMutation.variables,
    receiveMutation.isPending,
    receiveMutation.variables,
    assignMutation.isPending,
    assignTarget?.id,
  ].join(':');

  const modals = (
    <>
      <CenterModal
        visible={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={t('rejectOrderTitle')}>
        <Column gap={space.md}>
          <AppText variant="body" tone="secondary">
            {t('rejectOrderBody', {ref: rejectTarget?.reference ?? ''})}
          </AppText>
          <Row gap={space.sm}>
            <Column flex={1}>
              <AppButton
                title={t('cancel')}
                variant="secondary"
                onPress={() => setRejectTarget(null)}
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

      <BottomSheetModal
        visible={Boolean(assignTarget)}
        onClose={closeAssign}
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
                    assignTarget?.driverId === driver.id
                      ? 'primary'
                      : 'secondary'
                  }
                  loading={
                    assignMutation.isPending &&
                    assignMutation.variables?.driverId === driver.id
                  }
                  disabled={assignMutation.isPending}
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
    </>
  );

  return {bind, extraData, modals};
}
