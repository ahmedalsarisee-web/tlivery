import {useCallback, useMemo, type FC} from 'react';
import {View} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import Column from '@app/components/column';
import Row from '@app/components/row';
import StatusChip from '@app/components/status-chip';
import {
  orderSourceI18nKey,
  orderStatusTone,
  resolveOrderSource,
} from '@app/features/orders/orderStatus';
import {useOrder} from '@app/hooks/useOrders';
import {space} from '@app/theme/tokens';
import {OrderStatus} from '../types';
import {orderDetailsStyles} from './OrderDetails.styles';

type DetailsRoute = RouteProp<RootStackParamList, 'ShipmentDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'ShipmentDetails'>;

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

const ShipmentDetailsScreen: FC = () => {
  const route = useRoute<DetailsRoute>();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const orderQuery = useOrder(route.params.orderId);
  const styles = useMemo(
    () => orderDetailsStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const order = orderQuery.data;

  const onRefresh = useCallback(async () => {
    await orderQuery.refetch();
  }, [orderQuery]);

  if (orderQuery.isLoading && !order) {
    return (
      <ScreenContainer
        navTitle={t('shipmentDetails')}
        loading
        pullToRefresh={{onRefresh}}>
        <View />
      </ScreenContainer>
    );
  }

  if (!order) {
    return (
      <ScreenContainer
        navTitle={t('shipmentDetails')}
        pullToRefresh={{onRefresh}}>
        <AppText variant="body">{t('orderNotFound')}</AppText>
        <AppButton
          title={t('goBack', {defaultValue: 'Go back'})}
          onPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

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
  const senderName =
    order.createdByName?.trim() ||
    (source === 'company' ? order.companyName?.trim() : '') ||
    t('orderPartyPlacer');

  return (
    <ScreenContainer
      navTitle={t('shipmentDetails')}
      pullToRefresh={{onRefresh}}>
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
          <StatusChip
            label={t(statusI18nKey(order.status))}
            tone={orderStatusTone(order.status)}
          />
        </Row>
      </Column>

      <View style={styles.detailCard}>
        <AppText style={styles.sectionTitle}>{t('shipmentDetails')}</AppText>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('orderPartyPlacer')}</AppText>
          <AppText style={styles.detailValue}>{senderName}</AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('orderPartyRecipient')}</AppText>
          <AppText style={styles.detailValue}>{order.customerName}</AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('pickupAddress')}</AppText>
          <AppText style={styles.detailValue}>{order.pickupAddress}</AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText style={styles.detailLabel}>{t('dropoffAddress')}</AppText>
          <AppText style={styles.detailValue}>{order.dropoffAddress}</AppText>
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

      <AppButton
        title={t('trackOrder')}
        onPress={() =>
          navigation.navigate('OrderDetails', {orderId: order.id})
        }
      />
    </ScreenContainer>
  );
};

export default ShipmentDetailsScreen;
