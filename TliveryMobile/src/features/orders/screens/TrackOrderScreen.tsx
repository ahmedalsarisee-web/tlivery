import {useCallback, useEffect, useMemo, useState, type FC} from 'react';
import {Pressable, StatusBar, StyleSheet, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ArrowLeft, ArrowRight, MapPinned, Navigation} from 'lucide-react-native';
import TrackOrderMap from '@app/components/live-tracking/TrackOrderMap';
import TrackingSheetMetrics from '@app/components/live-tracking/TrackingSheetMetrics';
import AppText from '@app/components/app-text';
import {useDriverLiveLocation} from '@app/hooks/useDriverLiveLocation';
import {useDriverDeliverOrder, useOrder} from '@app/hooks/useOrders';
import {selectUserId, selectUserRole, useUserStore} from '@app/features/user';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {locationTracker} from '@app/services/locationTracker';
import type {RootStackParamList} from '@app/types/navigation';
import {isRTL} from '@app/utils/directionalStyles';
import {formatDistanceLabel} from '@app/utils/geo';
import {openNativeNavigation} from '@app/utils/openNativeNavigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';

type ScreenRoute = RouteProp<RootStackParamList, 'LiveTracking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type RouteStats = {
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Driver trip map: live route preview + open device maps + End Trip.
 * Turn-by-turn lives in Google/Apple Maps — not duplicated here.
 */
const TrackOrderScreen: FC = () => {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<Nav>();
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction, language} = useLanguage();
  const insets = useSafeAreaInsets();
  const role = useUserStore(selectUserRole);
  const userId = useUserStore(selectUserId);
  const {orderId} = route.params;
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;
  const deliverMutation = useDriverDeliverOrder();
  const resolvedDriverId = userId ?? order?.driverId ?? null;
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const accent = isDark ? theme.brand.gold : '#0F172A';

  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  useEffect(() => {
    if (role && role !== 'driver') {
      navigation.replace('LiveTracking', {
        orderId,
        driverId: order?.driverId ?? undefined,
      });
    }
  }, [role, orderId, order?.driverId, navigation]);

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
  const canEndTrip =
    role === 'driver' &&
    Boolean(userId) &&
    order?.driverId === userId &&
    (order?.status === 'onRoute' || order?.status === 'shipped');

  const {location, loading, error} = useDriverLiveLocation(resolvedDriverId, {
    pauseWhenBlurred: true,
    enabled: role === 'driver' && Boolean(resolvedDriverId),
  });

  const tripLocation =
    location && resolvedDriverId && location.driverId === resolvedDriverId
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

  const driverCoord = tripLocation
    ? {
        latitude: tripLocation.latitude,
        longitude: tripLocation.longitude,
      }
    : null;

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

  const phaseLabel = tripStarted
    ? t('driverTripPhaseDropoff')
    : t('driverTripPhasePickup');

  const addressTitle = tripStarted
    ? order?.dropoffAddress?.split('·')[0]?.trim() ||
      order?.dropoffAddress ||
      t('dropoffAddress')
    : order?.pickupAddress?.split('·')[0]?.trim() ||
      order?.pickupAddress ||
      t('pickupAddress');

  const destinationAddress = tripStarted
    ? order?.dropoffAddress
    : order?.pickupAddress;

  const emptyHint = useMemo(() => {
    if (!destination && !tripLocation) {
      return t('trackingNoCoordinates');
    }
    if (!destination) {
      return t('trackingOrderCoordsMissing');
    }
    if (!tripLocation && !loading) {
      return t('trackingGpsWaiting');
    }
    return undefined;
  }, [destination, tripLocation, loading, t]);

  const onEndTrip = () => {
    if (!canEndTrip) {
      navigation.goBack();
      return;
    }
    deliverMutation.mutate(orderId, {
      onSuccess: () => {
        void locationTracker.completeDelivery();
        showToast(ToastType.success, t('orderDeliveredToast'));
        navigation.replace('OrderDetails', {orderId});
      },
      onError: () => showToast(ToastType.error, t('workflowRequestFailed')),
    });
  };

  const onOpenDeviceMaps = useCallback(() => {
    if (!destination) {
      showToast(ToastType.info, t('trackingOrderCoordsMissing'));
      return;
    }
    void openNativeNavigation(destination, {
      origin: driverCoord,
      label: destinationAddress,
    }).then(ok => {
      if (!ok) {
        showToast(ToastType.error, t('trackingMapsOpenFailed'));
      }
    });
  }, [destination, driverCoord, destinationAddress, t]);

  const etaLabel =
    etaMinutes != null
      ? t('etaMinShort', {minutes: etaMinutes})
      : t('etaPending');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: isDark ? '#0B1220' : '#F3F1EC',
        },
        mapLayer: {
          flex: 1,
        },
        backBtn: {
          position: 'absolute',
          top: insets.top + getHeight(10),
          ...(rtl
            ? {right: getWidth(space.md)}
            : {left: getWidth(space.md)}),
          width: getWidth(40),
          height: getWidth(40),
          borderRadius: getWidth(20),
          backgroundColor: theme.backgrounds.surface,
          borderWidth: 1,
          borderColor: theme.ui.border,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          elevation: 6,
        },
        phaseChip: {
          position: 'absolute',
          top: insets.top + getHeight(10),
          ...(rtl
            ? {left: getWidth(space.md), right: getWidth(56)}
            : {right: getWidth(space.md), left: getWidth(56)}),
          zIndex: 4,
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
        sheet: {
          position: 'absolute',
          start: getWidth(space.sm),
          end: getWidth(space.sm),
          bottom: Math.max(insets.bottom, getHeight(space.sm)),
          zIndex: 4,
          paddingTop: getHeight(8),
          paddingHorizontal: getWidth(space.md),
          paddingBottom: getHeight(10),
          borderRadius: radius.lg,
          backgroundColor: theme.backgrounds.surface,
          borderWidth: 1,
          borderColor: theme.ui.border,
          gap: getHeight(8),
          elevation: 10,
        },
        handle: {
          alignSelf: 'center',
          width: getWidth(36),
          height: 3,
          borderRadius: 2,
          backgroundColor: theme.ui.border,
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
        actionsRow: {
          flexDirection: rtl ? 'row-reverse' : 'row',
          gap: getWidth(8),
        },
        mapsBtn: {
          flex: 1.4,
          minHeight: getHeight(40),
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: getWidth(6),
          borderRadius: radius.md,
          paddingHorizontal: getWidth(10),
          backgroundColor: accent,
          opacity: destination ? 1 : 0.5,
        },
        mapsBtnText: {
          color: isDark ? '#0F172A' : '#FFFFFF',
          fontSize: fontSize.caption,
          ...cairoFont('bold'),
        },
        endBtn: {
          flex: 1,
          minHeight: getHeight(40),
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: theme.status.error,
          opacity: deliverMutation.isPending ? 0.7 : 1,
        },
        endBtnText: {
          color: theme.status.error,
          fontSize: fontSize.caption,
          ...cairoFont('bold'),
        },
        errorText: {
          color: theme.typography.secondary,
        },
      }),
    [
      theme,
      isDark,
      insets.top,
      insets.bottom,
      rtl,
      accent,
      deliverMutation.isPending,
      destination,
    ],
  );

  if (role && role !== 'driver') {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.mapLayer}>
        <TrackOrderMap
          driverLocation={tripLocation}
          destination={destination}
          pickup={pickup}
          showPickup={showPickupPin}
          driverLabel={order?.driverName ?? t('driver')}
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
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={8}>
        <BackIcon size={20} color={accent} strokeWidth={2.4} />
      </Pressable>

      <View style={styles.phaseChip} pointerEvents="none">
        <MapPinned size={14} color={accent} strokeWidth={2.2} />
        <AppText style={styles.phaseText} numberOfLines={1}>
          {phaseLabel}
        </AppText>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />

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

        {error ? (
          <AppText variant="caption" style={styles.errorText}>
            {error.message}
          </AppText>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenDeviceMaps}
            disabled={!destination}
            style={styles.mapsBtn}>
            <Navigation
              size={15}
              color={isDark ? '#0F172A' : '#FFFFFF'}
              strokeWidth={2.4}
            />
            <AppText style={styles.mapsBtnText} numberOfLines={1}>
              {tripStarted ? t('navigateToDropoff') : t('navigateToPickup')}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onEndTrip}
            disabled={deliverMutation.isPending}
            style={styles.endBtn}>
            <AppText style={styles.endBtnText} numberOfLines={1}>
              {canEndTrip ? t('endTrip') : t('back')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default TrackOrderScreen;
