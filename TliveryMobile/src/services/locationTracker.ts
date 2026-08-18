import {
  addDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import Geolocation, {
  type GeolocationError,
  type GeolocationOptions,
  type GeolocationResponse,
} from '@app/services/geolocation';
import {
  driverLocationDocument,
  orderRouteHistoryCollection,
} from '@app/firebase/firestore/references';
import type {
  LocationTrackerConfig,
  RouteHistoryPoint,
  StartTrackingInput,
} from '@app/models/tracking.model';
import {
  DEFAULT_DISTANCE_FILTER_M,
  DEFAULT_LIVE_INTERVAL_MS,
  DEFAULT_MAX_BUFFERED_POINTS,
  DEFAULT_ROUTE_FLUSH_MS,
  distanceMeters,
} from '@app/utils/geo';
import {ensureLocationPermission} from '@app/utils/locationPermission';

type Session = {
  driverId: string;
  companyId: string;
  orderId: string;
  driverName: string | null;
};

type ResolvedConfig = Required<LocationTrackerConfig>;

const resolveConfig = (config?: LocationTrackerConfig): ResolvedConfig => ({
  timeIntervalMs: config?.timeIntervalMs ?? DEFAULT_LIVE_INTERVAL_MS,
  distanceFilterMeters:
    config?.distanceFilterMeters ?? DEFAULT_DISTANCE_FILTER_M,
  routeFlushIntervalMs: config?.routeFlushIntervalMs ?? DEFAULT_ROUTE_FLUSH_MS,
  maxBufferedPoints: config?.maxBufferedPoints ?? DEFAULT_MAX_BUFFERED_POINTS,
});

const toSession = (input: StartTrackingInput): Session => ({
  driverId: input.driverId,
  companyId: input.companyId,
  orderId: input.orderId?.trim() ?? '',
  driverName: input.driverName?.trim() ? input.driverName.trim() : null,
});

const logGeoError = (label: string, error: GeolocationError | unknown) => {
  if (!__DEV__) {
    return;
  }
  console.warn(`[locationTracker] ${label}`, error);
};

/**
 * Driver-side location streaming:
 * - Presence: online drivers publish to `/driver_locations/{driverId}`
 * - Trip: when `orderId` is set, also buffer route history
 * - Throttle: 15s OR 30m before each live write (first fix writes immediately)
 */
class LocationTracker {
  private watchId: number | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private session: Session | null = null;
  private config: ResolvedConfig = resolveConfig();
  private lastLiveWriteAt = 0;
  private lastLiveCoord: {latitude: number; longitude: number} | null = null;
  private buffer: RouteHistoryPoint[] = [];
  private writingLive = false;
  private flushing = false;
  private started = false;
  /** Bumped on every start/stop to ignore stale async permission/GPS work. */
  private epoch = 0;
  /** Resolves the first successful watch fix while starting. */
  private firstFixWaiter: {
    resolve: (position: GeolocationResponse | null) => void;
  } | null = null;

  isTracking(): boolean {
    return this.started && this.session != null;
  }

  getActiveSession(): StartTrackingInput | null {
    if (!this.session) {
      return null;
    }
    return {
      driverId: this.session.driverId,
      companyId: this.session.companyId,
      orderId: this.session.orderId || undefined,
      driverName: this.session.driverName,
    };
  }

  async startPresence(
    input: Omit<StartTrackingInput, 'orderId'> & {orderId?: string},
    config?: LocationTrackerConfig,
  ): Promise<void> {
    await this.start({...input, orderId: input.orderId ?? ''}, config);
  }

  async start(
    input: StartTrackingInput,
    config?: LocationTrackerConfig,
  ): Promise<void> {
    const next = toSession(input);
    if (!next.companyId.trim()) {
      throw new Error('LOCATION_MISSING_COMPANY');
    }

    if (
      this.started &&
      this.session?.driverId === next.driverId &&
      this.session.companyId === next.companyId
    ) {
      if (this.session.orderId && this.session.orderId !== next.orderId) {
        await this.flushRouteHistory();
        this.buffer = [];
      }
      this.session = {
        ...next,
        driverName: next.driverName ?? this.session.driverName,
      };
      this.forceCurrentPosition();
      return;
    }

    if (this.started) {
      await this.stop({flush: true});
    }

    const epoch = ++this.epoch;

    const allowed = await ensureLocationPermission();
    if (epoch !== this.epoch) {
      return;
    }
    if (!allowed) {
      throw new Error('LOCATION_PERMISSION_DENIED');
    }

    try {
      // We request runtime permission ourselves; skip the library prompt.
      Geolocation.setRNConfiguration({
        skipPermissionRequests: true,
        authorizationLevel: 'whenInUse',
        locationProvider: 'auto',
      });
    } catch {
      // Optional on some builds.
    }

    this.config = resolveConfig(config);
    this.session = next;
    this.lastLiveWriteAt = 0;
    this.lastLiveCoord = null;
    this.buffer = [];
    this.started = true;

    const firstFromWatch = new Promise<GeolocationResponse | null>(resolve => {
      this.firstFixWaiter = {resolve};
    });

    this.watchId = Geolocation.watchPosition(
      position => {
        if (this.firstFixWaiter) {
          const waiter = this.firstFixWaiter;
          this.firstFixWaiter = null;
          waiter.resolve(position);
        }
        void this.onPosition(position);
      },
      error => {
        logGeoError('watch error', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: this.config.timeIntervalMs,
        fastestInterval: Math.min(5_000, this.config.timeIntervalMs),
        maximumAge: 60_000,
        timeout: 30_000,
        useSignificantChanges: false,
      },
    );

    this.flushTimer = setInterval(() => {
      void this.flushRouteHistory();
    }, this.config.routeFlushIntervalMs);

    const first = await this.readCurrentPositionWithFallback();
    if (epoch !== this.epoch) {
      return;
    }

    if (first) {
      if (this.firstFixWaiter) {
        this.firstFixWaiter = null;
      }
      const wrote = await this.onPosition(first);
      if (!wrote && __DEV__) {
        console.warn('[locationTracker] first live write failed — keep watching');
      }
      return;
    }

    const fromWatch = await this.raceFirstFix(firstFromWatch, 20_000);
    if (epoch !== this.epoch) {
      return;
    }
    if (fromWatch) {
      // watch callback already invoked onPosition; ensure a write attempt.
      const wrote = await this.onPosition(fromWatch);
      if (!wrote && __DEV__) {
        console.warn('[locationTracker] watch fix write failed — keep watching');
      }
      return;
    }

    // Keep watch running; a later fix will publish without failing the session.
    if (__DEV__) {
      console.warn(
        '[locationTracker] no immediate fix — watching in background',
      );
    }
  }

  async bindOrder(orderId: string): Promise<void> {
    if (!this.session || !orderId.trim()) {
      return;
    }
    if (this.session.orderId === orderId) {
      return;
    }
    if (this.session.orderId) {
      await this.flushRouteHistory();
      this.buffer = [];
    }
    this.session = {...this.session, orderId};
    this.forceCurrentPosition();
  }

  async unbindOrder(): Promise<void> {
    if (!this.session?.orderId) {
      return;
    }
    await this.flushRouteHistory();
    this.buffer = [];
    this.session = {...this.session, orderId: ''};
    this.forceCurrentPosition();
  }

  async stop(options?: {flush?: boolean}): Promise<void> {
    this.epoch += 1;
    if (this.firstFixWaiter) {
      this.firstFixWaiter.resolve(null);
      this.firstFixWaiter = null;
    }
    const shouldFlush = options?.flush !== false;
    if (this.watchId != null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.flushTimer != null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.started = false;
    if (shouldFlush) {
      await this.flushRouteHistory();
    } else {
      this.buffer = [];
    }
    this.session = null;
    this.lastLiveCoord = null;
    this.lastLiveWriteAt = 0;
  }

  async completeDelivery(): Promise<void> {
    await this.unbindOrder();
  }

  private raceFirstFix(
    watchPromise: Promise<GeolocationResponse | null>,
    timeoutMs: number,
  ): Promise<GeolocationResponse | null> {
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      void watchPromise.then(position => {
        clearTimeout(timer);
        resolve(position);
      });
    });
  }

  private getPositionOnce(
    options: GeolocationOptions,
  ): Promise<GeolocationResponse | null> {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          logGeoError('getCurrentPosition failed', error);
          resolve(null);
        },
        options,
      );
    });
  }

  /**
   * Android often times out on high-accuracy GPS indoors while network /
   * last-known location still works. Try low-accuracy first, then GPS.
   */
  private async readCurrentPositionWithFallback(): Promise<GeolocationResponse | null> {
    const cached = await this.getPositionOnce({
      enableHighAccuracy: false,
      timeout: 8_000,
      maximumAge: 120_000,
    });
    if (cached) {
      return cached;
    }

    const network = await this.getPositionOnce({
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 5_000,
    });
    if (network) {
      return network;
    }

    return this.getPositionOnce({
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 30_000,
    });
  }

  private forceCurrentPosition(): void {
    void this.readCurrentPositionWithFallback().then(position => {
      if (position) {
        void this.onPosition(position);
      }
    });
  }

  private shouldWriteLive(coords: {
    latitude: number;
    longitude: number;
  }): boolean {
    const now = Date.now();
    if (!this.lastLiveCoord || this.lastLiveWriteAt === 0) {
      return true;
    }
    const elapsed = now - this.lastLiveWriteAt;
    if (elapsed >= this.config.timeIntervalMs) {
      return true;
    }
    return (
      distanceMeters(this.lastLiveCoord, coords) >=
      this.config.distanceFilterMeters
    );
  }

  private async onPosition(position: GeolocationResponse): Promise<boolean> {
    if (!this.session || !this.started) {
      return false;
    }

    const {latitude, longitude} = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return false;
    }

    if (this.session.orderId) {
      const point: RouteHistoryPoint = {
        lat: latitude,
        lng: longitude,
        timestamp: position.timestamp || Date.now(),
      };
      this.buffer.push(point);
      if (this.buffer.length >= this.config.maxBufferedPoints) {
        void this.flushRouteHistory();
      }
    }

    if (!this.shouldWriteLive({latitude, longitude})) {
      return true;
    }

    return this.writeLiveLocation(position);
  }

  private async writeLiveLocation(
    position: GeolocationResponse,
  ): Promise<boolean> {
    if (!this.session || this.writingLive) {
      return false;
    }
    this.writingLive = true;
    const {driverId, orderId, companyId, driverName} = this.session;
    const {latitude, longitude, heading, speed} = position.coords;

    try {
      await setDoc(
        driverLocationDocument(driverId),
        {
          driverId,
          orderId,
          companyId,
          driverName: driverName ?? null,
          latitude: Number(latitude),
          longitude: Number(longitude),
          heading: Number.isFinite(Number(heading)) ? Number(heading) : 0,
          speed: Number.isFinite(Number(speed)) ? Number(speed) : 0,
          updatedAt: serverTimestamp(),
        },
        {merge: true},
      );
      this.lastLiveWriteAt = Date.now();
      this.lastLiveCoord = {latitude, longitude};
      if (__DEV__) {
        console.log(
          '[locationTracker] live write ok',
          driverId,
          companyId,
          latitude.toFixed(5),
          longitude.toFixed(5),
        );
      }
      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[locationTracker] live write failed', error);
      }
      return false;
    } finally {
      this.writingLive = false;
    }
  }

  private async flushRouteHistory(): Promise<void> {
    if (
      !this.session?.orderId ||
      this.flushing ||
      this.buffer.length === 0
    ) {
      return;
    }
    this.flushing = true;
    const {driverId, orderId, companyId} = this.session;
    const points = this.buffer.splice(0, this.buffer.length);

    try {
      await addDoc(orderRouteHistoryCollection(orderId), {
        driverId,
        orderId,
        companyId,
        points,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      this.buffer = points
        .concat(this.buffer)
        .slice(-this.config.maxBufferedPoints);
      if (__DEV__) {
        console.warn('[locationTracker] route flush failed', error);
      }
    } finally {
      this.flushing = false;
    }
  }
}

export const locationTracker = new LocationTracker();
