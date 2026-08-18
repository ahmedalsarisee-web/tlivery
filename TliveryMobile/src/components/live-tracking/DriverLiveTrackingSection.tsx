import {useCallback, useMemo, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Clock3, MapPin, Navigation2, Route} from 'lucide-react-native';
import AppButton from '@app/components/app-button';
import AppText from '@app/components/app-text';
import {mapAccent} from '@app/components/live-tracking/mapTheme';
import {useDriverLiveLocation} from '@app/hooks/useDriverLiveLocation';
import type {WaselOrder} from '@app/features/orders/types';
import type {RootStackParamList} from '@app/types/navigation';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';
import {openNativeNavigation} from '@app/utils/openNativeNavigation';
import {
  estimateRoadDistanceMeters,
  estimateTravelMinutes,
  formatDistanceLabel,
} from '@app/utils/geo';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {radius, space} from '@app/theme/tokens';
import {useTheme} from '@app/providers/ThemeContext';

type Props = {
  order: WaselOrder;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Driver-facing live tracking block for Order Details.
 * Opens in-app TrackOrder map + optional native maps navigation.
 */
const DriverLiveTrackingSection: FC<Props> = ({order}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const tripStarted = isOrderInDeliveryTracking(order.status);

  const {location, loading, error} = useDriverLiveLocation(order.driverId, {
    pauseWhenBlurred: true,
    enabled: Boolean(order.driverId),
  });

  const tripLocation =
    location && location.driverId === order.driverId
      ? !location.orderId ||
        location.orderId === order.id ||
        !tripStarted
        ? location
        : null
      : null;

  const pickup = useMemo(() => {
    const loc = order.pickupLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      return null;
    }
    return {latitude: loc.lat, longitude: loc.lng};
  }, [order.pickupLocation]);

  const dropoff = useMemo(() => {
    const loc = order.dropoffLocation;
    if (
      loc == null ||
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number'
    ) {
      return null;
    }
    return {latitude: loc.lat, longitude: loc.lng};
  }, [order.dropoffLocation]);

  const routeTo = tripStarted ? dropoff : pickup;
  const destinationAddress = tripStarted
    ? order.dropoffAddress
    : order.pickupAddress;

  const tripStats = useMemo(() => {
    if (!tripLocation || !routeTo) {
      return null;
    }
    const meters = estimateRoadDistanceMeters(
      {latitude: tripLocation.latitude, longitude: tripLocation.longitude},
      routeTo,
    );
    return {
      distanceLabel: formatDistanceLabel(meters),
      etaMinutes: estimateTravelMinutes(meters),
    };
  }, [tripLocation, routeTo]);

  const onOpenTrackMap = useCallback(() => {
    navigation.navigate('LiveTracking', {
      orderId: order.id,
      driverId: order.driverId ?? undefined,
    });
  }, [navigation, order.id, order.driverId]);

  const onNavigateInMaps = useCallback(() => {
    if (!routeTo) {
      showToast(ToastType.info, t('trackingOrderCoordsMissing'));
      return;
    }
    void openNativeNavigation(routeTo, {
      origin: tripLocation
        ? {latitude: tripLocation.latitude, longitude: tripLocation.longitude}
        : null,
      label: destinationAddress,
    }).then(ok => {
      if (!ok) {
        showToast(ToastType.error, t('trackingMapsOpenFailed'));
      }
    });
  }, [routeTo, tripLocation, destinationAddress, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.ui.border,
          backgroundColor: theme.backgrounds.surface,
          padding: getWidth(space.md),
          gap: getHeight(space.sm),
        },
        title: {
          color: mapAccent.forest,
        },
        phase: {
          alignSelf: 'flex-start',
          paddingHorizontal: getWidth(space.sm),
          paddingVertical: getHeight(4),
          borderRadius: radius.sm,
          backgroundColor: mapAccent.forest,
        },
        phaseText: {
          color: '#fff',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: getWidth(space.sm),
        },
        rowBody: {
          flex: 1,
          gap: getHeight(2),
        },
        statsRow: {
          flexDirection: 'row',
          gap: getWidth(space.sm),
        },
        stat: {
          flex: 1,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.ui.border,
          backgroundColor: theme.backgrounds.background,
          padding: getWidth(space.sm),
          gap: getHeight(4),
        },
        statLabel: {
          color: theme.typography.secondary,
        },
        hint: {
          color: theme.typography.secondary,
        },
        actions: {
          gap: getHeight(space.xs),
        },
      }),
    [theme],
  );

  return (
    <View style={styles.root}>
      <AppText variant="heading" style={styles.title}>
        {t('liveTracking')}
      </AppText>

      <View style={styles.phase}>
        <AppText variant="caption" style={styles.phaseText}>
          {tripStarted
            ? t('driverTripPhaseDropoff')
            : t('driverTripPhasePickup')}
        </AppText>
      </View>

      <View style={styles.row}>
        <MapPin size={20} color={mapAccent.forest} strokeWidth={2.2} />
        <View style={styles.rowBody}>
          <AppText variant="caption" tone="secondary">
            {tripStarted ? t('dropoffAddress') : t('pickupAddress')}
          </AppText>
          <AppText>
            {destinationAddress?.trim()
              ? destinationAddress
              : t('trackingOrderCoordsMissing')}
          </AppText>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Route size={18} color={mapAccent.forest} strokeWidth={2.2} />
          <AppText variant="caption" style={styles.statLabel}>
            {t('trackingDistance')}
          </AppText>
          <AppText variant="heading">
            {tripStats?.distanceLabel ?? (loading ? '…' : '—')}
          </AppText>
        </View>
        <View style={styles.stat}>
          <Clock3 size={18} color={mapAccent.forest} strokeWidth={2.2} />
          <AppText variant="caption" style={styles.statLabel}>
            {t('trackingEta')}
          </AppText>
          <AppText variant="heading">
            {tripStats
              ? t('trackingEtaMinutes', {count: tripStats.etaMinutes})
              : loading
                ? '…'
                : '—'}
          </AppText>
        </View>
      </View>

      <View style={styles.row}>
        <Navigation2 size={20} color={mapAccent.forest} strokeWidth={2.2} />
        <View style={styles.rowBody}>
          <AppText variant="caption" tone="secondary">
            {t('trackingYourLocation')}
          </AppText>
          <AppText>
            {tripLocation
              ? t('trackingGpsActive', {
                  time: tripLocation.updatedAt
                    ? new Date(tripLocation.updatedAt).toLocaleTimeString()
                    : '—',
                })
              : loading
                ? t('waitingDriverLocation')
                : t('trackingGpsWaiting')}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" style={styles.hint}>
        {t('trackingEtaHint')}
      </AppText>

      {error ? (
        <AppText variant="caption" tone="secondary">
          {error.message}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton title={t('openNavigationMap')} onPress={onOpenTrackMap} />
        <AppButton
          title={tripStarted ? t('navigateToDropoff') : t('navigateToPickup')}
          variant="secondary"
          onPress={onNavigateInMaps}
          disabled={!routeTo}
        />
      </View>
    </View>
  );
};

export default DriverLiveTrackingSection;
