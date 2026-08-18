import {useMemo, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';
import {useTranslation} from 'react-i18next';
import {useSmoothCoordinate} from '@app/hooks/useSmoothCoordinate';
import type {DriverLiveLocation} from '@app/models/tracking.model';
import AppText from '@app/components/app-text';
import {space} from '@app/theme/tokens';
import {
  DriverCarMarker,
  DropoffFlagMarker,
  PickupPinMarker,
} from './MapMarkers';
import {mapAccent, mapStyleForTheme} from './mapTheme';
import {useTheme} from '@app/providers/ThemeContext';

export type MapCoord = {latitude: number; longitude: number};

type Props = {
  location: DriverLiveLocation | null;
  loading?: boolean;
  showDriver?: boolean;
  showPickup?: boolean;
  showDropoff?: boolean;
  pickup?: MapCoord | null;
  dropoff?: MapCoord | null;
  /** Draw a route line from the driver toward this point (pickup or dropoff). */
  routeTo?: MapCoord | null;
  driverLabel?: string;
  statusHint?: string;
  emptyHint?: string;
  fullScreen?: boolean;
  hideBanner?: boolean;
};

const DEFAULT_REGION: Region = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const regionForAnchors = (points: MapCoord[]): Region => {
  if (points.length === 0) {
    return DEFAULT_REGION;
  }
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;
  points.forEach(p => {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  });
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.03, (maxLat - minLat) * 1.55),
    longitudeDelta: Math.max(0.03, (maxLng - minLng) * 1.55),
  };
};

const LiveTrackingMap: FC<Props> = ({
  location,
  loading,
  showDriver = true,
  showPickup = true,
  showDropoff = true,
  pickup,
  dropoff,
  routeTo,
  driverLabel,
  statusHint,
  emptyHint,
  fullScreen = false,
  hideBanner = false,
}) => {
  const {t} = useTranslation();
  const {themeType} = useTheme();
  const isDark = themeType === 'dark';
  const mapStyle = mapStyleForTheme(themeType);
  const routeColor = isDark ? mapAccent.routeDark : mapAccent.route;
  const routeGlow = isDark ? mapAccent.routeGlowDark : mapAccent.routeGlow;
  const target =
    showDriver && location
      ? {latitude: location.latitude, longitude: location.longitude}
      : null;
  const smooth = useSmoothCoordinate(target);

  const visiblePickup = showPickup ? pickup : null;
  const visibleDropoff = showDropoff ? dropoff : null;

  const initialRegion = useMemo<Region>(() => {
    const anchors: MapCoord[] = [];
    if (target) {
      anchors.push(target);
    }
    if (visibleDropoff) {
      anchors.push(visibleDropoff);
    }
    if (visiblePickup) {
      anchors.push(visiblePickup);
    }
    return regionForAnchors(anchors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    target?.latitude,
    target?.longitude,
    visiblePickup?.latitude,
    visiblePickup?.longitude,
    visibleDropoff?.latitude,
    visibleDropoff?.longitude,
  ]);

  const routeCoords = useMemo(() => {
    if (!smooth || !routeTo) {
      return null;
    }
    return [smooth, routeTo];
  }, [smooth, routeTo]);

  const hasAnyPin = Boolean(smooth || visiblePickup || visibleDropoff);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          minHeight: fullScreen ? undefined : 280,
          borderRadius: fullScreen ? 0 : 12,
          overflow: 'hidden',
          backgroundColor: isDark
            ? mapAccent.mapCanvasDark
            : mapAccent.mapCanvas,
        },
        map: {
          ...StyleSheet.absoluteFill,
        },
        banner: {
          position: 'absolute',
          top: space.sm,
          start: space.sm,
          end: space.sm,
          paddingHorizontal: space.sm,
          paddingVertical: space.xs,
          borderRadius: 8,
          backgroundColor: isDark
            ? 'rgba(18, 32, 51, 0.92)'
            : 'rgba(0, 51, 43, 0.86)',
        },
        bannerText: {
          color: '#fff',
        },
        emptyOverlay: {
          ...StyleSheet.absoluteFill,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space.md,
          backgroundColor: isDark
            ? 'rgba(11, 18, 32, 0.72)'
            : 'rgba(243, 241, 236, 0.72)',
        },
        emptyText: {
          textAlign: 'center',
        },
      }),
    [fullScreen, isDark],
  );

  const bannerText = (() => {
    if (statusHint) {
      return statusHint;
    }
    if (loading && showDriver && !location) {
      return t('waitingDriverLocation');
    }
    if (showDriver && location?.updatedAt) {
      return t('locationUpdatedAt', {
        time: new Date(location.updatedAt).toLocaleTimeString(),
      });
    }
    return t('liveTracking');
  })();

  return (
    <View style={styles.wrap}>
      <MapView
        key={`live-map-${themeType}`}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle as MapStyleElement[]}
        initialRegion={initialRegion}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}>
        {routeCoords ? (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor={routeGlow}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={routeCoords}
              strokeColor={routeColor}
              strokeWidth={3.5}
              lineCap="round"
              lineJoin="round"
              lineDashPattern={[12, 8]}
            />
          </>
        ) : null}
        {visiblePickup ? (
          <PickupPinMarker
            coordinate={visiblePickup}
            title={t('pickupAddress')}
          />
        ) : null}
        {visibleDropoff ? (
          <DropoffFlagMarker
            coordinate={visibleDropoff}
            title={t('dropoffAddress')}
          />
        ) : null}
        {smooth ? (
          <DriverCarMarker
            coordinate={smooth}
            title={driverLabel ?? t('driver')}
          />
        ) : null}
      </MapView>
      {!hideBanner ? (
        <View style={styles.banner} pointerEvents="none">
          <AppText variant="caption" style={styles.bannerText}>
            {bannerText}
          </AppText>
        </View>
      ) : null}
      {!hasAnyPin && emptyHint ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <AppText variant="caption" tone="secondary" style={styles.emptyText}>
            {emptyHint}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

export default LiveTrackingMap;
