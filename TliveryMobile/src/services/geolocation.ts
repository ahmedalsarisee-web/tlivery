import * as Location from 'expo-location';

export type GeolocationResponse = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};

export type GeolocationError = {code: number; message: string};

export type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  interval?: number;
  fastestInterval?: number;
  useSignificantChanges?: boolean;
};

type GeoSuccess = (position: GeolocationResponse) => void;
type GeoError = (error: GeolocationError) => void;

const toGeo = (position: Location.LocationObject) => ({
  coords: {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude,
    accuracy: position.coords.accuracy ?? 0,
    altitudeAccuracy: position.coords.altitudeAccuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
  },
  timestamp: position.timestamp,
});

const watches = new Map<number, Location.LocationSubscription>();
let nextWatchId = 1;

const accuracyFrom = (high?: boolean) =>
  high ? Location.Accuracy.High : Location.Accuracy.Balanced;

const Geolocation = {
  setRNConfiguration(_config: unknown) {
    // Expo Location handles permission prompts separately.
  },

  requestAuthorization(success?: () => void, error?: GeoError) {
    void Location.requestForegroundPermissionsAsync()
      .then(result => {
        if (result.status === 'granted') {
          success?.();
          return;
        }
        error?.({code: 1, message: 'LOCATION_PERMISSION_DENIED'});
      })
      .catch(err => {
        error?.({
          code: 1,
          message: err instanceof Error ? err.message : String(err),
        });
      });
  },

  getCurrentPosition(
    success: GeoSuccess,
    error?: GeoError,
    options?: GeolocationOptions,
  ) {
    void Location.getCurrentPositionAsync({
      accuracy: accuracyFrom(options?.enableHighAccuracy),
    })
      .then(position => success(toGeo(position)))
      .catch(err => {
        error?.({
          code: 2,
          message: err instanceof Error ? err.message : String(err),
        });
      });
  },

  watchPosition(
    success: GeoSuccess,
    error?: GeoError,
    options?: GeolocationOptions,
  ): number {
    const id = nextWatchId++;
    void Location.watchPositionAsync(
      {
        accuracy: accuracyFrom(options?.enableHighAccuracy ?? true),
        timeInterval: options?.interval ?? 15_000,
        distanceInterval: options?.distanceFilter ?? 0,
      },
      position => success(toGeo(position)),
    )
      .then(subscription => {
        watches.set(id, subscription);
      })
      .catch(err => {
        error?.({
          code: 2,
          message: err instanceof Error ? err.message : String(err),
        });
      });
    return id;
  },

  clearWatch(id: number) {
    watches.get(id)?.remove();
    watches.delete(id);
  },
};

export default Geolocation;
