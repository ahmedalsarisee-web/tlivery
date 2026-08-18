import {type FC, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';
import {useTranslation} from 'react-i18next';
import type {DriverLiveLocation} from '@app/models/tracking.model';
import AppText from '@app/components/app-text';
import {space} from '@app/theme/tokens';
import {DriverCarMarker} from './MapMarkers';
import {mapAccent, mapStyleForTheme} from './mapTheme';
import {useTheme} from '@app/providers/ThemeContext';

type Props = {
  locations: DriverLiveLocation[];
  loading?: boolean;
  fullScreen?: boolean;
  hideBanner?: boolean;
  selectedDriverId?: string | null;
  onSelectDriver?: (driverId: string | null) => void;
};

const DEFAULT_REGION: Region = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

const regionForPoints = (
  points: Array<{latitude: number; longitude: number}>,
): Region => {
  if (points.length === 0) {
    return DEFAULT_REGION;
  }
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
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
    latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.4),
  };
};

const FleetDriversMap: FC<Props> = ({
  locations,
  loading,
  fullScreen = false,
  hideBanner = false,
  selectedDriverId = null,
  onSelectDriver,
}) => {
  const {t} = useTranslation();
  const {themeType} = useTheme();
  const isDark = themeType === 'dark';
  const mapStyle = mapStyleForTheme(themeType);

  const initialRegion = useMemo(
    () =>
      regionForPoints(
        locations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
        })),
      ),
    [locations],
  );

  const onTripCount = useMemo(
    () => locations.filter(loc => Boolean(loc.orderId)).length,
    [locations],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          minHeight: fullScreen ? undefined : 320,
          borderRadius: fullScreen ? 0 : 12,
          overflow: 'hidden',
          backgroundColor: isDark
            ? mapAccent.mapCanvasDark
            : mapAccent.mapCanvas,
        },
        map: {
          flex: 1,
          width: '100%',
          height: '100%',
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
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? '#243447' : 'transparent',
        },
        bannerText: {
          color: '#fff',
        },
      }),
    [fullScreen, isDark],
  );

  return (
    <View style={styles.wrap}>
      <MapView
        key={`fleet-map-${themeType}`}
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
        onPress={() => onSelectDriver?.(null)}>
        {locations.map(loc => (
          <DriverCarMarker
            key={loc.driverId}
            coordinate={{
              latitude: loc.latitude,
              longitude: loc.longitude,
            }}
            selected={selectedDriverId === loc.driverId}
            onTrip={Boolean(loc.orderId)}
            title={loc.driverName ?? loc.driverId}
            onPress={() => onSelectDriver?.(loc.driverId)}
          />
        ))}
      </MapView>
      {!hideBanner ? (
        <View style={styles.banner} pointerEvents="none">
          <AppText variant="caption" style={styles.bannerText}>
            {loading && locations.length === 0
              ? t('fleetMapLoading')
              : t('fleetMapSummary', {
                  total: locations.length,
                  onTrip: onTripCount,
                })}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

export default FleetDriversMap;
