import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FC,
} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';
import {useTranslation} from 'react-i18next';
import {useSmoothCoordinate} from '@app/hooks/useSmoothCoordinate';
import {useGoogleDirectionsRoute} from '@app/hooks/useGoogleDirectionsRoute';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import type {DriverLiveLocation} from '@app/models/tracking.model';
import AppText from '@app/components/app-text';
import {
  CustomerPinMarker,
  DriverCarMarker,
  PickupPinMarker,
  type MapCoord,
} from './MapMarkers';
import {mapStyleForTheme} from './mapTheme';

export type TrackOrderMapProps = {
  driverLocation: DriverLiveLocation | null;
  /** Customer / dropoff (or pickup when going to collect). */
  destination: MapCoord | null;
  /** Optional pickup pin while en-route to receive. */
  pickup?: MapCoord | null;
  showPickup?: boolean;
  driverLabel?: string;
  /** Prefer Directions API polyline when key is available. */
  useDirections?: boolean;
  loading?: boolean;
  emptyHint?: string;
  edgePadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  onRouteStats?: (stats: {
    distanceMeters: number;
    durationSeconds: number;
  } | null) => void;
};

const ROUTE_COLOR = '#0E4A35';
const ROUTE_GLOW = 'rgba(14, 74, 53, 0.28)';

const DEFAULT_PADDING = {
  top: 120,
  right: 60,
  bottom: 320,
  left: 60,
};

const DEFAULT_REGION: Region = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TrackOrderMap: FC<TrackOrderMapProps> = ({
  driverLocation,
  destination,
  pickup = null,
  showPickup = false,
  driverLabel,
  useDirections = true,
  loading,
  emptyHint,
  edgePadding = DEFAULT_PADDING,
  onRouteStats,
}) => {
  const {t} = useTranslation();
  const {language} = useLanguage();
  const {themeType} = useTheme();
  const isDark = themeType === 'dark';
  const mapRef = useRef<MapView | null>(null);
  const mapStyle = mapStyleForTheme(themeType);

  const rawDriver: MapCoord | null = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      }
    : null;
  const smoothDriver = useSmoothCoordinate(rawDriver);

  const {
    route,
    loading: routeLoading,
    error: routeError,
  } = useGoogleDirectionsRoute(smoothDriver, destination, {
    enabled: useDirections && Boolean(smoothDriver && destination),
    language: language === 'en' ? 'en' : 'ar',
  });

  const polylineCoords = useMemo(() => {
    if (route?.coordinates?.length && route.coordinates.length >= 2) {
      return route.coordinates;
    }
    if (smoothDriver && destination) {
      return [smoothDriver, destination];
    }
    return null;
  }, [route?.coordinates, smoothDriver, destination]);

  const etaMinutes = useMemo(() => {
    if (route?.durationSeconds) {
      return Math.max(1, Math.round(route.durationSeconds / 60));
    }
    return null;
  }, [route?.durationSeconds]);

  const etaLabel = etaMinutes != null ? t('etaMinShort', {minutes: etaMinutes}) : null;

  useEffect(() => {
    if (!onRouteStats) {
      return;
    }
    if (route) {
      onRouteStats({
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      });
      return;
    }
    onRouteStats(null);
  }, [route, onRouteStats]);

  const fitPoints = useCallback(() => {
    const points: MapCoord[] = [];
    if (smoothDriver) {
      points.push(smoothDriver);
    }
    if (destination) {
      points.push(destination);
    }
    if (showPickup && pickup) {
      points.push(pickup);
    }
    if (polylineCoords?.length) {
      // Sample overview for better fit without thousands of points.
      const step = Math.max(1, Math.floor(polylineCoords.length / 24));
      for (let i = 0; i < polylineCoords.length; i += step) {
        points.push(polylineCoords[i]);
      }
      points.push(polylineCoords[polylineCoords.length - 1]);
    }
    if (points.length < 1 || !mapRef.current) {
      return;
    }
    if (points.length === 1) {
      mapRef.current.animateCamera(
        {
          center: points[0],
          zoom: 15,
        },
        {duration: 450},
      );
      return;
    }
    mapRef.current.fitToCoordinates(points, {
      edgePadding,
      animated: true,
    });
  }, [
    smoothDriver,
    destination,
    showPickup,
    pickup,
    polylineCoords,
    edgePadding,
  ]);

  useEffect(() => {
    const id = setTimeout(fitPoints, 280);
    return () => clearTimeout(id);
  }, [fitPoints]);

  const initialRegion = useMemo<Region>(() => {
    if (smoothDriver && destination) {
      return {
        latitude: (smoothDriver.latitude + destination.latitude) / 2,
        longitude: (smoothDriver.longitude + destination.longitude) / 2,
        latitudeDelta:
          Math.max(
            0.02,
            Math.abs(smoothDriver.latitude - destination.latitude) * 1.8,
          ),
        longitudeDelta:
          Math.max(
            0.02,
            Math.abs(smoothDriver.longitude - destination.longitude) * 1.8,
          ),
      };
    }
    if (smoothDriver) {
      return {
        ...smoothDriver,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (destination) {
      return {
        ...destination,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    return DEFAULT_REGION;
  }, [smoothDriver, destination]);

  const hasPins = Boolean(smoothDriver || destination || (showPickup && pickup));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: isDark ? '#0B1220' : '#F3F1EC',
        },
        map: {
          flex: 1,
          width: '100%',
          height: '100%',
        },
        emptyOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: isDark
            ? 'rgba(11, 18, 32, 0.72)'
            : 'rgba(243, 241, 236, 0.72)',
        },
        emptyText: {
          textAlign: 'center',
        },
      }),
    [isDark],
  );

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        key={`track-order-${themeType}`}
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
        pitchEnabled={false}
        onMapReady={fitPoints}>
        {polylineCoords ? (
          <>
            <Polyline
              coordinates={polylineCoords}
              strokeColor={ROUTE_GLOW}
              strokeWidth={10}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={polylineCoords}
              strokeColor={ROUTE_COLOR}
              strokeWidth={4.5}
              lineCap="round"
              lineJoin="round"
            />
          </>
        ) : null}

        {showPickup && pickup ? (
          <PickupPinMarker coordinate={pickup} title={t('pickupAddress')} />
        ) : null}

        {destination ? (
          <CustomerPinMarker
            coordinate={destination}
            title={t('dropoffAddress')}
          />
        ) : null}

        {smoothDriver ? (
          <DriverCarMarker
            coordinate={smoothDriver}
            title={driverLabel ?? t('driver')}
            onTrip
            etaLabel={etaLabel}
          />
        ) : null}
      </MapView>

      {!hasPins && (emptyHint || loading || routeLoading) ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <AppText variant="caption" tone="secondary" style={styles.emptyText}>
            {emptyHint ||
              (routeError
                ? routeError.message
                : loading || routeLoading
                  ? t('waitingDriverLocation')
                  : t('liveTracking'))}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

export default TrackOrderMap;
