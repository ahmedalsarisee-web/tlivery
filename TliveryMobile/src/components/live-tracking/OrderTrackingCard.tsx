import {useCallback, useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {MapPin, Navigation} from 'lucide-react-native';
import AppText from '@app/components/app-text';
import type {WaselOrder} from '@app/features/orders/types';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import {openNativeNavigation} from '@app/utils/openNativeNavigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type Props = {
  order: WaselOrder;
  /** Assigned driver: device maps only (no in-app map — cost). */
  isAssignedDriver?: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TERMINAL_DONE = new Set(['delivered', 'completed']);
const TERMINAL_STOP = new Set([
  'cancelled',
  'failedDelivery',
  'refunded',
  'returned',
]);

const shortAddress = (value?: string | null): string => {
  if (!value?.trim()) {
    return '—';
  }
  return value.split('·')[0]?.trim() || value.trim();
};

const formatWhen = (iso: string | undefined, locale: string): string | null => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Track card on Order Details for every role.
 * - Company / customer: in-app live map when trip is active
 * - Driver: trip info + open device maps only (no Maps SDK / Directions in-app)
 */
const OrderTrackingCard: FC<Props> = ({order, isAssignedDriver = false}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {language} = useLanguage();
  const navigation = useNavigation<Nav>();
  const locale = language === 'ar' ? 'ar-JO' : 'en-US';
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  const isDone = TERMINAL_DONE.has(order.status);
  const isStopped = TERMINAL_STOP.has(order.status);
  const tripStarted = isOrderInDeliveryTracking(order.status);
  const canTrack =
    !isDone &&
    !isStopped &&
    Boolean(order.driverId) &&
    (order.status === 'driverAssigned' || tripStarted);

  const destinationAddress = tripStarted
    ? order.dropoffAddress
    : order.pickupAddress;

  const deliveredAt = useMemo(() => {
    const events = order.timeline;
    let hitAt: string | undefined;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const entry = events[i];
      if (entry.status === 'delivered' || entry.status === 'completed') {
        hitAt = entry.at;
        break;
      }
    }
    if (!hitAt && events.length > 0) {
      hitAt = events[events.length - 1]?.at;
    }
    return formatWhen(hitAt, locale);
  }, [order.timeline, locale]);

  const onOpenViewerMap = useCallback(() => {
    navigation.navigate('LiveTracking', {
      orderId: order.id,
      driverId: order.driverId ?? undefined,
    });
  }, [navigation, order.id, order.driverId]);

  const onOpenDeviceMaps = useCallback(() => {
    const loc = tripStarted ? order.dropoffLocation : order.pickupLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      showToast(ToastType.info, t('trackingOrderCoordsMissing'));
      return;
    }
    void openNativeNavigation(
      {latitude: loc.lat, longitude: loc.lng},
      {label: destinationAddress},
    ).then(ok => {
      if (!ok) {
        showToast(ToastType.error, t('trackingMapsOpenFailed'));
      }
    });
  }, [tripStarted, order, destinationAddress, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.ui.border,
          backgroundColor: theme.backgrounds.surface,
          paddingVertical: getHeight(space.sm),
          paddingHorizontal: getWidth(space.md),
          gap: getHeight(8),
        },
        title: {
          fontSize: fontSize.cardTitle,
          color: theme.typography.primary,
          ...cairoFont('bold'),
        },
        meta: {
          fontSize: fontSize.caption,
          color: theme.typography.secondary,
          ...cairoFont('medium'),
        },
        row: {
          gap: getHeight(2),
        },
        label: {
          fontSize: fontSize.label,
          color: theme.typography.caption,
          ...cairoFont('bold'),
          textTransform: 'uppercase',
          letterSpacing: 0.2,
        },
        value: {
          fontSize: fontSize.body,
          color: theme.typography.primary,
          ...cairoFont('medium'),
        },
        actions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: getWidth(8),
          marginTop: getHeight(2),
        },
        mapBtn: {
          flexGrow: 1,
          minHeight: getHeight(36),
          borderRadius: radius.md,
          borderWidth: 1.25,
          borderColor: accent,
          backgroundColor: theme.backgrounds.surface,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: getWidth(6),
          paddingHorizontal: getWidth(space.sm),
        },
        mapBtnPrimary: {
          backgroundColor: accent,
          borderColor: accent,
        },
        mapBtnLabel: {
          fontSize: fontSize.caption,
          color: accent,
          ...cairoFont('bold'),
        },
        mapBtnLabelOnAccent: {
          fontSize: fontSize.caption,
          color: isDark ? '#0F172A' : '#FFFFFF',
          ...cairoFont('bold'),
        },
      }),
    [theme, accent, isDark],
  );

  if (isDone) {
    return (
      <View style={styles.card}>
        <AppText style={styles.title}>{t('tripSummary')}</AppText>
        <AppText style={styles.meta}>
          {t('orderStatus_delivered')}
          {deliveredAt ? ` · ${deliveredAt}` : ''}
        </AppText>
        {order.driverName ? (
          <View style={styles.row}>
            <AppText style={styles.label}>{t('driver')}</AppText>
            <AppText style={styles.value}>{order.driverName}</AppText>
          </View>
        ) : null}
        <View style={styles.row}>
          <AppText style={styles.label}>{t('pickupAddress')}</AppText>
          <AppText style={styles.value} numberOfLines={2}>
            {shortAddress(order.pickupAddress)}
          </AppText>
        </View>
        <View style={styles.row}>
          <AppText style={styles.label}>{t('dropoffAddress')}</AppText>
          <AppText style={styles.value} numberOfLines={2}>
            {shortAddress(order.dropoffAddress)}
          </AppText>
        </View>
      </View>
    );
  }

  if (isStopped) {
    return (
      <View style={styles.card}>
        <AppText style={styles.title}>{t('tripSummary')}</AppText>
        <AppText style={styles.meta}>{t(`orderStatus_${order.status}`)}</AppText>
        {order.driverName ? (
          <AppText style={styles.value}>
            {t('trackingDriver', {name: order.driverName})}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{t('trackingSection')}</AppText>
      <AppText style={styles.meta}>
        {isAssignedDriver
          ? tripStarted
            ? t('driverTripPhaseDropoff')
            : t('driverTripPhasePickup')
          : order.etaMinutes != null
            ? t('etaMinutes', {minutes: order.etaMinutes})
            : canTrack
              ? t('trackingEtaHintShort')
              : t('etaPending')}
      </AppText>

      {isAssignedDriver ? (
        <View style={styles.row}>
          <AppText style={styles.label}>
            {tripStarted ? t('dropoffAddress') : t('pickupAddress')}
          </AppText>
          <AppText style={styles.value} numberOfLines={2}>
            {shortAddress(destinationAddress)}
          </AppText>
        </View>
      ) : order.driverName ? (
        <AppText style={styles.meta}>
          {t('trackingDriver', {name: order.driverName})}
        </AppText>
      ) : (
        <AppText style={styles.meta}>{t('awaitingDriver')}</AppText>
      )}

      {canTrack && isAssignedDriver ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenDeviceMaps}
            style={[styles.mapBtn, styles.mapBtnPrimary]}>
            <Navigation
              size={14}
              color={isDark ? '#0F172A' : '#FFFFFF'}
              strokeWidth={2.2}
            />
            <AppText style={styles.mapBtnLabelOnAccent} numberOfLines={1}>
              {tripStarted ? t('navigateToDropoff') : t('navigateToPickup')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {canTrack && !isAssignedDriver ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenViewerMap}
            style={styles.mapBtn}>
            <MapPin size={14} color={accent} strokeWidth={2.2} />
            <AppText style={styles.mapBtnLabel} numberOfLines={1}>
              {t('viewOnMap')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {isAssignedDriver && canTrack ? (
        <AppText style={styles.meta}>{t('driverNavigateHint')}</AppText>
      ) : null}
    </View>
  );
};

export default OrderTrackingCard;
