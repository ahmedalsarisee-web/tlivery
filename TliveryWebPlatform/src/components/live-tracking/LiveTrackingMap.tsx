import {Map, Marker, Polyline, useMap} from '@vis.gl/react-google-maps';
import {useEffect, useMemo, type FC} from 'react';
import {useTranslation} from 'react-i18next';
import {useGoogleDirectionsRoute} from '../../hooks/useGoogleDirectionsRoute';
import {useSmoothLatLng} from '../../hooks/useSmoothLatLng';
import type {DriverLiveLocation} from '../../models/tracking.model';
import {boundsCenter, type LatLng} from '../../utils/geo';
import {GoogleMapsProvider} from './GoogleMapsProvider';
import {DRIVER_CAR_ICON} from './driverCarIcon';
import {LIGHT_MAP_STYLE, mapAccent} from './mapTheme';
import './liveTrackingMaps.css';

export type RouteStats = {
  distanceMeters: number;
  durationSeconds: number;
};

type Props = {
  location: DriverLiveLocation | null;
  loading?: boolean;
  showDriver?: boolean;
  showPickup?: boolean;
  showDropoff?: boolean;
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  routeTo?: LatLng | null;
  driverLabel?: string;
  statusHint?: string;
  useDirections?: boolean;
  onRouteStats?: (stats: RouteStats | null) => void;
};

export function LiveTrackingMap(props: Props) {
  return (
    <GoogleMapsProvider>
      <LiveTrackingMapInner {...props} />
    </GoogleMapsProvider>
  );
}

const FitToRoute: FC<{points: LatLng[]}> = ({points}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) {
      return;
    }
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const point of points) {
      bounds.extend(point);
    }
    map.fitBounds(bounds, 56);
  }, [map, points]);

  return null;
};

function LiveTrackingMapInner({
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
  useDirections = true,
  onRouteStats,
}: Props) {
  const {t} = useTranslation();
  const target =
    showDriver && location
      ? {lat: location.latitude, lng: location.longitude}
      : null;
  const smooth = useSmoothLatLng(target);
  const visiblePickup = showPickup ? pickup : null;
  const visibleDropoff = showDropoff ? dropoff : null;

  const {route, loading: routeLoading} = useGoogleDirectionsRoute(
    smooth,
    routeTo ?? null,
    {enabled: useDirections && Boolean(smooth && routeTo)},
  );

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

  const initialCamera = useMemo(() => {
    const points: LatLng[] = [];
    if (target) {
      points.push(target);
    }
    if (visibleDropoff) {
      points.push(visibleDropoff);
    }
    if (visiblePickup) {
      points.push(visiblePickup);
    }
    return boundsCenter(points);
  }, [
    target?.lat,
    target?.lng,
    visibleDropoff?.lat,
    visibleDropoff?.lng,
    visiblePickup?.lat,
    visiblePickup?.lng,
  ]);

  const mapKey = `${initialCamera.center.lat.toFixed(4)}-${initialCamera.center.lng.toFixed(4)}-${initialCamera.zoom}`;

  const routePath = useMemo(() => {
    if (route?.coordinates && route.coordinates.length >= 2) {
      return route.coordinates;
    }
    if (smooth && routeTo) {
      return [smooth, routeTo];
    }
    return null;
  }, [route?.coordinates, smooth, routeTo]);

  const fitPoints = useMemo(() => {
    const points: LatLng[] = [];
    if (routePath) {
      // Sample path so fitBounds stays cheap on long polylines.
      const step = Math.max(1, Math.floor(routePath.length / 40));
      for (let i = 0; i < routePath.length; i += step) {
        points.push(routePath[i]);
      }
      points.push(routePath[routePath.length - 1]);
      return points;
    }
    if (smooth) {
      points.push(smooth);
    }
    if (visiblePickup) {
      points.push(visiblePickup);
    }
    if (visibleDropoff) {
      points.push(visibleDropoff);
    }
    return points;
  }, [routePath, smooth, visiblePickup, visibleDropoff]);

  const banner =
    statusHint ??
    (loading && showDriver && !location
      ? t('waitingDriverLocation')
      : routeLoading
        ? t('trackingRouteLoading')
        : showDriver && location?.updatedAt
          ? t('locationUpdatedAt', {
              time: new Date(location.updatedAt).toLocaleTimeString(),
            })
          : t('liveTracking'));

  return (
    <div className="tracking-map-shell tracking-map-shell--live">
      <Map
        key={mapKey}
        className="tracking-map-canvas"
        defaultCenter={initialCamera.center}
        defaultZoom={initialCamera.zoom}
        gestureHandling="greedy"
        disableDefaultUI
        scrollwheel
        draggable
        keyboardShortcuts
        styles={LIGHT_MAP_STYLE as google.maps.MapTypeStyle[]}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}>
        <FitToRoute points={fitPoints} />
        {routePath ? (
          <>
            <Polyline
              path={routePath}
              strokeColor={mapAccent.routeGlow}
              strokeOpacity={1}
              strokeWeight={10}
            />
            <Polyline
              path={routePath}
              strokeColor={mapAccent.route}
              strokeOpacity={1}
              strokeWeight={4.5}
              geodesic
            />
          </>
        ) : null}
        {visiblePickup ? (
          <Marker
            position={visiblePickup}
            title={t('pickupAddress')}
            label={{text: 'P', color: '#fff', fontWeight: '700'}}
          />
        ) : null}
        {visibleDropoff ? (
          <Marker
            position={visibleDropoff}
            title={t('dropoffAddress')}
            label={{text: 'D', color: '#fff', fontWeight: '700'}}
          />
        ) : null}
        {smooth ? (
          <Marker
            position={smooth}
            title={driverLabel ?? t('driver')}
            icon={DRIVER_CAR_ICON}
            zIndex={10}
          />
        ) : null}
      </Map>
      <div className="tracking-map-banner tracking-map-banner--chip">{banner}</div>
    </div>
  );
}
