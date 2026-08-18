import {useCallback, useEffect, useMemo, useState, type FC} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {MapPinned} from 'lucide-react-native';
import FullScreenMapChrome from '@app/components/live-tracking/FullScreenMapChrome';
import TrackOrderMap from '@app/components/live-tracking/TrackOrderMap';
import TrackingSheetMetrics from '@app/components/live-tracking/TrackingSheetMetrics';
import AppText from '@app/components/app-text';
import {useDriverLiveLocation} from '@app/hooks/useDriverLiveLocation';
import {useOrder} from '@app/hooks/useOrders';
import {selectUserRole, useUserStore} from '@app/features/user';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {RootStackParamList} from '@app/types/navigation';
import {isRTL} from '@app/utils/directionalStyles';
import {formatDistanceLabel} from '@app/utils/geo';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius} from '@app/theme/tokens';

type ScreenRoute = RouteProp<RootStackParamList, 'LiveTracking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type RouteStats = {
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Company / customer / merchant live map (watch only).
 * Drivers use Order Details → device maps (no in-app map billing).
 */
const LiveTrackingScreen: FC = () => {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction, language} = useLanguage();
  const insets = useSafeAreaInsets();
  const role = useUserStore(selectUserRole);
  const {orderId, driverId} = route.params;
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const resolvedDriverId = driverId ?? order?.driverId ?? null;
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  useEffect(() => {
    if (role === 'driver') {
      navigation.replace('OrderDetails', {orderId});
    }
  }, [role, orderId, navigation]);

  useEffect(() => {
    if (!order) {
      return;
    }
    if (
      order.status === 'delivered' ||
      order.status === 'completed' ||
      order.status === 'cancelled' ||
      order.status === 'failedDelivery' ||
      order.status === 'returned' ||
      order.status === 'refunded'
    ) {
      navigation.replace('OrderDetails', {orderId});
    }
  }, [order, orderId, navigation]);

  const tripStarted = Boolean(
    order && isOrderInDeliveryTracking(order.status),
  );
  const goingToPickup = Boolean(order && !tripStarted && resolvedDriverId);

  const {location, loading, error, isListening} = useDriverLiveLocation(
    resolvedDriverId,
    {
      pauseWhenBlurred: true,
      enabled: Boolean(resolvedDriverId) && role !== 'driver',
    },
  );

  const tripLocation =
    location && location.driverId === resolvedDriverId
      ? !location.orderId || location.orderId === orderId || !tripStarted
        ? location
        : null
      : null;

  const pickup = useMemo(() => {
    const loc = order?.pickupLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      return null;
    }
    return {latitude: loc.lat, longitude: loc.lng};
  }, [order?.pickupLocation]);

  const dropoff = useMemo(() => {
    const loc = order?.dropoffLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      return null;
    }
    return {latitude: loc.lat, longitude: loc.lng};
  }, [order?.dropoffLocation]);

  const destination = tripStarted ? dropoff : pickup;
  const showPickupPin = !tripStarted && Boolean(pickup);

  const onRouteStats = useCallback((stats: RouteStats | null) => {
    setRouteStats(stats);
  }, []);

  const etaMinutes = useMemo(() => {
    if (!routeStats?.durationSeconds) {
      return null;
    }
    return Math.max(1, Math.round(routeStats.durationSeconds / 60));
  }, [routeStats?.durationSeconds]);

  const distanceLabel = useMemo(() => {
    if (routeStats?.distanceMeters == null) {
      return '—';
    }
    return formatDistanceLabel(routeStats.distanceMeters);
  }, [routeStats?.distanceMeters]);

  const arrivalLabel = useMemo(() => {
    if (etaMinutes == null) {
      return '—';
    }
    const at = new Date(Date.now() + etaMinutes * 60_000);
    return at.toLocaleTimeString(language === 'ar' ? 'ar-JO' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [etaMinutes, language]);

  const addressTitle = useMemo(() => {
    if (tripStarted && order?.dropoffAddress) {
      return order.dropoffAddress.split('·')[0]?.trim() || order.dropoffAddress;
    }
    if (!tripStarted && order?.pickupAddress) {
      return order.pickupAddress.split('·')[0]?.trim() || order.pickupAddress;
    }
    return t('liveTracking');
  }, [tripStarted, order, t]);

  const phaseLabel = tripStarted
    ? t('driverTripPhaseDropoff')
    : goingToPickup
      ? t('driverTripPhasePickup')
      : t('trackingWaitingReceive');

  const emptyHint = useMemo(() => {
    if (!destination && !tripLocation) {
      return t('trackingNoCoordinates');
    }
    if (!destination) {
      return t('trackingOrderCoordsMissing');
    }
    if (!tripLocation && !loading) {
      return t('trackingDriverPinMissing');
    }
    return undefined;
  }, [destination, tripLocation, loading, t]);

  const etaLabel =
    etaMinutes != null
      ? t('etaMinShort', {minutes: etaMinutes})
      : t('etaPending');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        phaseChip: {
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: getWidth(6),
          paddingVertical: getHeight(6),
          paddingHorizontal: getWidth(10),
          borderRadius: radius.pill,
          backgroundColor: theme.backgrounds.surface,
          borderWidth: 1,
          borderColor: theme.ui.border,
          elevation: 4,
        },
        phaseText: {
          flex: 1,
          color: theme.typography.primary,
          fontSize: fontSize.caption,
          ...cairoFont('medium'),
        },
        destRow: {
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: getWidth(8),
        },
        destDot: {
          width: getWidth(8),
          height: getWidth(8),
          borderRadius: getWidth(4),
          flexShrink: 0,
        },
        destDotPickup: {
          backgroundColor: '#22C55E',
        },
        destDotDropoff: {
          backgroundColor: '#EF4444',
        },
        destBody: {
          flex: 1,
          minWidth: 0,
          gap: getHeight(1),
        },
        destLabel: {
          fontSize: fontSize.label,
          color: theme.typography.caption,
          ...cairoFont('regular'),
          textAlign: rtl ? 'right' : 'left',
        },
        destTitle: {
          fontSize: fontSize.body,
          color: theme.typography.primary,
          ...cairoFont('medium'),
          textAlign: rtl ? 'right' : 'left',
        },
        meta: {
          fontSize: fontSize.label,
          color: theme.typography.secondary,
          ...cairoFont('regular'),
          textAlign: rtl ? 'right' : 'left',
        },
      }),
    [theme, rtl],
  );

  if (role === 'driver') {
    return <View style={{flex: 1}} />;
  }

  const phaseChip = (
    <View style={styles.phaseChip} pointerEvents="none">
      <MapPinned size={14} color={accent} strokeWidth={2.2} />
      <AppText style={styles.phaseText} numberOfLines={1}>
        {phaseLabel}
      </AppText>
    </View>
  );

  const sheetContent = (
    <>
      <TrackingSheetMetrics
        etaLabel={etaLabel}
        distanceLabel={distanceLabel}
        arrivalLabel={arrivalLabel}
      />

      <View style={styles.destRow}>
        <View
          style={[
            styles.destDot,
            tripStarted ? styles.destDotDropoff : styles.destDotPickup,
          ]}
        />
        <View style={styles.destBody}>
          <AppText style={styles.destLabel} numberOfLines={1}>
            {tripStarted ? t('dropoffAddress') : t('pickupAddress')}
          </AppText>
          <AppText style={styles.destTitle} numberOfLines={1}>
            {addressTitle}
          </AppText>
        </View>
      </View>

      {order?.driverName ? (
        <AppText style={styles.meta} numberOfLines={1}>
          {t('trackingDriver', {name: order.driverName})}
          {isListening ? ` · ${t('live')}` : ''}
        </AppText>
      ) : null}

      {goingToPickup && !order?.driverName ? (
        <AppText style={styles.meta} numberOfLines={1}>
          {t('trackingWaitingReceive')}
        </AppText>
      ) : null}

      {error ? (
        <AppText style={styles.meta} numberOfLines={2}>
          {error.message}
        </AppText>
      ) : null}
    </>
  );

  return (
    <View style={{flex: 1}}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <FullScreenMapChrome
        phaseChip={phaseChip}
        sheetContent={sheetContent}
        map={
          <TrackOrderMap
            driverLocation={tripLocation}
            destination={destination}
            pickup={pickup}
            showPickup={showPickupPin}
            driverLabel={order?.driverName ?? undefined}
            loading={loading}
            emptyHint={emptyHint}
            edgePadding={{
              top: 80 + insets.top,
              right: 48,
              bottom: 220 + insets.bottom,
              left: 48,
            }}
            onRouteStats={onRouteStats}
          />
        }
      />
    </View>
  );
};

export default LiveTrackingScreen;
