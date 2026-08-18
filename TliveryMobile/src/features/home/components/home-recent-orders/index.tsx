import {useMemo, FC} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import type {WaselOrder} from '@app/features/orders/types';
import {
  HOME_RECENT_ORDERS,
  HomeOrderBadge,
  type HomeRecentOrder,
} from '../../data/homeDashboard';
import {homeStyles} from '../../screens/Home.styles';

interface Props {
  onViewAll?: () => void;
  onOrderPress?: (id: string) => void;
  orders?: WaselOrder[];
  isSample?: boolean;
}

const statusI18n = (s: HomeOrderBadge) => {
  switch (s) {
    case 'delivered':
      return 'homeStatusDelivered';
    case 'onRoute':
      return 'homeStatusOnRoute';
    case 'arrivedPickup':
      return 'homeStatusPickup';
    default:
      return 'homeStatusNew';
  }
};

const toBadge = (order: WaselOrder): HomeOrderBadge => {
  if (order.status === 'delivered' || order.status === 'completed') {
    return 'delivered';
  }
  if (
    order.status === 'onRoute' ||
    order.status === 'shipped' ||
    order.status === 'nearCustomer' ||
    order.status === 'pickedUp' ||
    order.status === 'driverOnTheWay'
  ) {
    return 'onRoute';
  }
  if (order.status === 'arrivedPickup') {
    return 'arrivedPickup';
  }
  return 'pendingCompany';
};

const toRecentOrder = (order: WaselOrder): HomeRecentOrder => ({
  id: order.id,
  reference: order.reference,
  customerName: order.customerName,
  address: order.dropoffAddress,
  company: order.companyName ?? '—',
  driver: order.driverName ?? '—',
  status: toBadge(order),
});

const HomeRecentOrders: FC<Props> = ({
  onViewAll,
  onOrderPress,
  orders,
  isSample = false,
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const rows = orders ? orders.map(toRecentOrder) : HOME_RECENT_ORDERS;

  const badgeColors = (s: HomeOrderBadge) => {
    switch (s) {
      case 'delivered':
        return {
          bg: `${theme.status.success}22`,
          fg: theme.status.success,
        };
      case 'onRoute':
        return {bg: `${theme.status.info}22`, fg: theme.status.info};
      case 'arrivedPickup':
        return {bg: `${theme.status.warning}22`, fg: theme.status.warning};
      default:
        return {
          bg: theme.ui.borderLight,
          fg: theme.typography.secondary,
        };
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>{t('viewAll')}</Text>
        </Pressable>
      </View>
      {isSample ? (
        <Text style={styles.sampleDataNotice}>
          {t('dashboardSampleOrdersNotice')}
        </Text>
      ) : null}

      <View style={styles.ordersCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colRef]}>
                {t('colOrderId')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCustomer]}>
                {t('colCustomer')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colAddress]}>
                {t('colAddress')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCompany]}>
                {t('colCompany')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDriver]}>
                {t('colDriver')}
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>
                {t('colStatus')}
              </Text>
              <View style={styles.chevronCol} />
            </View>

            {rows.map(order => {
              const colors = badgeColors(order.status);
              return (
                <Pressable
                  key={order.id}
                  onPress={() => onOrderPress?.(order.id)}
                  style={styles.tableRow}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colRef,
                      styles.tableReference,
                    ]}
                  >
                    {order.reference}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCustomer]}
                    numberOfLines={1}
                  >
                    {order.customerName}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colAddress]}
                    numberOfLines={1}
                  >
                    {order.address}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCompany]}
                    numberOfLines={1}
                  >
                    {order.company}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colDriver]}
                    numberOfLines={1}
                  >
                    {order.driver}
                  </Text>
                  <View style={styles.colStatus}>
                    <View
                      style={[styles.statusBadge, {backgroundColor: colors.bg}]}
                    >
                      <Text style={[styles.statusBadgeText, {color: colors.fg}]}>
                        {t(statusI18n(order.status))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chevronCol}>
                    <Chevron
                      size={14}
                      color={theme.typography.caption}
                      strokeWidth={2}
                    />
                  </View>
                </Pressable>
              );
            })}
            {rows.length === 0 ? (
              <View style={styles.emptyOrders}>
                <Text style={styles.emptyOrdersText}>
                  {t('dashboardNoMatchingOrders')}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeRecentOrders;
