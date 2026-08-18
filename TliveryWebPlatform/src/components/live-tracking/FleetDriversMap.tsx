import {Map, Marker} from '@vis.gl/react-google-maps';
import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {DriverLiveLocation} from '../../models/tracking.model';
import {boundsCenter} from '../../utils/geo';
import {useDrivers} from '../../hooks/useWorkflow';
import {useAuth} from '../../auth/AuthContext';
import {GoogleMapsProvider} from './GoogleMapsProvider';
import {DRIVER_CAR_ICON} from './driverCarIcon';
import {LIGHT_MAP_STYLE, mapAccent} from './mapTheme';
import './liveTrackingMaps.css';

type Props = {
  locations: DriverLiveLocation[];
  loading?: boolean;
};

export function FleetDriversMap({locations, loading}: Props) {
  return (
    <GoogleMapsProvider>
      <FleetDriversMapInner locations={locations} loading={loading} />
    </GoogleMapsProvider>
  );
}

function FleetDriversMapInner({locations, loading}: Props) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const driversQuery = useDrivers(companyId, {status: 'active', pageSize: 100});
  const drivers = driversQuery.data?.drivers ?? [];

  const onTripCount = useMemo(
    () => locations.filter(loc => Boolean(loc.orderId)).length,
    [locations],
  );

  const selected = useMemo(
    () => locations.find(loc => loc.driverId === selectedId) ?? null,
    [locations, selectedId],
  );
  const selectedDriver = useMemo(
    () => drivers.find(driver => driver.id === selectedId) ?? null,
    [drivers, selectedId],
  );

  const initialCamera = useMemo(
    () =>
      boundsCenter(
        locations.map(loc => ({lat: loc.latitude, lng: loc.longitude})),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locations.map(loc => loc.driverId).sort().join('|')],
  );

  const mapKey =
    locations.length === 0
      ? 'fleet-empty'
      : `fleet-${locations
          .map(loc => loc.driverId)
          .sort()
          .join('-')}`;

  return (
    <div className="tracking-map-shell tracking-map-shell--tall">
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
        fullscreenControl={false}
        onClick={() => setSelectedId(null)}>
        {locations.map(loc => {
          const isSelected = selectedId === loc.driverId;
          return (
            <Marker
              key={loc.driverId}
              position={{lat: loc.latitude, lng: loc.longitude}}
              title={loc.driverName ?? loc.driverId}
              icon={DRIVER_CAR_ICON}
              opacity={isSelected ? 1 : 0.95}
              zIndex={isSelected ? 10 : loc.orderId ? 5 : 1}
              onClick={event => {
                event.stop?.();
                setSelectedId(loc.driverId);
              }}
            />
          );
        })}
      </Map>
      <div className="tracking-map-banner">
        {loading && locations.length === 0
          ? t('fleetMapLoading')
          : t('fleetMapSummary', {
              total: locations.length,
              onTrip: onTripCount,
            })}
      </div>
      {selected ? (
        <div className="tracking-map-driver-card">
          <div className="tracking-map-driver-card__head">
            <strong>
              {selected.driverName?.trim() ||
                selectedDriver?.fullName ||
                t('driver')}
            </strong>
            <button
              type="button"
              className="tracking-map-driver-card__close"
              onClick={() => setSelectedId(null)}>
              ×
            </button>
          </div>
          <p className="muted" style={{margin: '4px 0'}}>
            {selected.orderId
              ? t('fleetDriverOnTrip')
              : t('fleetDriverAvailable')}
          </p>
          <p style={{margin: '4px 0'}}>
            {t('fleetActiveOrders')}:{' '}
            <strong>
              {selectedDriver?.activeOrders ?? (selected.orderId ? 1 : 0)}
            </strong>
          </p>
          <p className="muted" style={{margin: '4px 0'}}>
            {t('fleetSpeed')}:{' '}
            {t('fleetSpeedKmh', {
              speed: Math.max(0, Math.round((selected.speed || 0) * 3.6)),
            })}
          </p>
          {selectedDriver?.phone ? (
            <p className="muted" style={{margin: '4px 0'}}>
              {selectedDriver.phone}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="tracking-map-driver-hint">{t('fleetTapDriverHint')}</div>
      )}
    </div>
  );
}
