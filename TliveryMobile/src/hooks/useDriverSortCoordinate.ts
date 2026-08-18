import {useEffect, useState} from 'react';
import Geolocation from '@app/services/geolocation';
import {locationTracker} from '@app/services/locationTracker';

type Coord = {latitude: number; longitude: number};

/**
 * Best-effort driver coordinate for nearest/farthest sorting.
 * Prefers an already-running tracker session; falls back to a quick GPS read.
 */
export function useDriverSortCoordinate(enabled: boolean): Coord | null {
  const [coord, setCoord] = useState<Coord | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const apply = (next: Coord) => {
      if (!cancelled) {
        setCoord(next);
      }
    };

    // Tracker does not expose last fix publicly — ask GPS with a short timeout.
    Geolocation.getCurrentPosition(
      position => {
        apply({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // Keep previous coord if any; sorting still works without GPS (stable order).
        if (!cancelled && locationTracker.isTracking()) {
          // no-op — we simply lack a sort origin
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return enabled ? coord : null;
}
