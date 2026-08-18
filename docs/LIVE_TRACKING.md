# Live Tracking Architecture (Cost-Effective)

**Date:** July 2026  
**Scope:** Mobile driver GPS → Firestore → customer / merchant / company map  
**Goal:** Live driver position without 1 Hz Firestore write storms

---

## 1. Design principles

| Principle | Implementation |
|---|---|
| Do not stream every second | Adaptive throttle: **15s OR 30m** |
| Keep map listeners cheap | One small hot doc: `/driver_locations/{driverId}` |
| Separate history from live | Batched `/orders/{orderId}/route_history/{batchId}` |
| Pause unused listeners | `useDriverLiveLocation` unsubscribes on blur / unmount |
| Smooth UX despite sparse updates | 1s coordinate interpolation on the marker |

**Rough write budget (active delivery):**  
~4 live writes/min (if moving) + 1 history batch every 5 minutes ≈ **~250 live writes/hour** vs **3,600** at 1 Hz.

---

## 2. Firestore schema

### Hot path — `driver_locations/{driverId}`

```
driverId: string
orderId: string
companyId: string
latitude: number
longitude: number
heading: number
speed: number
updatedAt: Timestamp
```

Clients subscribe with `onSnapshot` to **this document only**.

### History — `orders/{orderId}/route_history/{batchId}`

```
driverId: string
orderId: string
companyId: string
points: Array<{ lat, lng, timestamp }>
createdAt: Timestamp
```

Batched every **5 minutes**, on buffer overflow, or when delivery completes. Not used by the live map.

---

## 3. Mobile modules

| File | Role |
|---|---|
| `WaselMobile/src/services/locationTracker.ts` | Driver GPS watch + throttle + live write + history flush |
| `WaselMobile/src/hooks/useDriverLiveLocation.ts` | Focus-aware single-doc listener |
| `WaselMobile/src/hooks/useSmoothCoordinate.ts` | 1s ease-out interpolation |
| `WaselMobile/src/components/live-tracking/LiveTrackingMap.tsx` | Google Maps (`react-native-maps`) + `SmoothDriverMarker` |
| `WaselMobile/src/features/orders/screens/LiveTrackingScreen.tsx` | Full-screen map from Order Details |

**Lifecycle hooks (Order Details):**

- Driver taps **Receive** → `locationTracker.start(...)`
- Driver taps **Deliver** → `locationTracker.completeDelivery()` (flush + stop)

---

## 4. Security rules

See `firestore.rules`:

- `driver_locations`: signed-in **read**; owner **write** with strict field shape
- `route_history`: driver **create** only (own `driverId`); company / driver **read**

Deploy rules before testing live writes:

```bash
firebase deploy --only firestore:rules
```

---

## 5. Native setup

1. Install deps (if not already):

```bash
cd WaselMobile
yarn install
```

2. Rebuild the native app (`react-native-maps` requires a native rebuild):

```bash
yarn android
# or
yarn ios
```

3. Android already declares `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`.  
   For true background tracking later, add a foreground service + `ACCESS_BACKGROUND_LOCATION` (not required for the current foreground watch).

4. Google Maps API key: inject via `manifestPlaceholders.GOOGLE_MAPS_API_KEY` from `.env` (do **not** use `@string/GOOGLE_MAPS_API_KEY` from react-native-config — those resValues include literal quote characters and produce a blank beige map).

---

## 6. Mapbox swap

`SmoothDriverMarker` is coordinate-driven. To use Mapbox (`@rnmapbox/maps`), keep `useSmoothCoordinate` and pass the interpolated `{latitude, longitude}` into a `PointAnnotation` / `MarkerView` instead of `react-native-maps` `Marker`.

---

## 7. Product surfaces (mobile)

| Surface | Who | Behavior |
|---|---|---|
| **Drivers map** (`DriversMap`) | Company staff | One query listener on `driver_locations where companyId == …` |
| **Order live map** (`LiveTracking`) | Company / client / driver | Drop-off (+ pickup); driver pin only while order is in delivery statuses and `orderId` matches |
| **Driver presence** | Driver app session | Publishes throttled GPS while signed in; binds `orderId` on receive, clears on deliver |

Delivery statuses for the order driver pin: `shipped`, `driverOnTheWay`, `arrivedPickup`, `pickedUp`, `onRoute`, `nearCustomer`.

---

## 8. Out of scope / next steps

- Background location with a foreground notification while the app is killed
- Admin cleanup of stale `driver_locations` after delivery

## 9. Web platform

| Route | Who | Page |
|---|---|---|
| `/drivers/map` | Company staff | Fleet map (`FleetDriversMapPage`) |
| `/orders/:orderId/live` | Company / client / merchant / driver | Order live map (`LiveTrackingPage`) |

Uses `@vis.gl/react-google-maps` + `VITE_GOOGLE_MAPS_API_KEY`. Enable **Maps JavaScript API** on that key.
