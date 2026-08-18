import {useEffect, useRef, useState} from 'react';
import {lerpCoordinate, MARKER_ANIMATION_MS} from '@app/utils/geo';

type Coordinate = {latitude: number; longitude: number};

/**
 * Smoothly interpolates map marker coordinates over ~1s when a new
 * Firestore live position arrives (typically every 15s / 30m).
 */
export function useSmoothCoordinate(
  target: Coordinate | null,
  durationMs: number = MARKER_ANIMATION_MS,
): Coordinate | null {
  const [display, setDisplay] = useState<Coordinate | null>(target);
  const fromRef = useRef<Coordinate | null>(null);
  const toRef = useRef<Coordinate | null>(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!target) {
      setDisplay(null);
      fromRef.current = null;
      toRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (!display) {
      setDisplay(target);
      fromRef.current = target;
      toRef.current = target;
      return;
    }

    const same =
      Math.abs(display.latitude - target.latitude) < 1e-7 &&
      Math.abs(display.longitude - target.longitude) < 1e-7;
    if (same) {
      return;
    }

    fromRef.current = display;
    toRef.current = target;
    startRef.current = Date.now();

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }

    const tick = () => {
      const from = fromRef.current;
      const to = toRef.current;
      if (!from || !to) {
        return;
      }
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out for slightly more natural marker motion.
      const eased = 1 - (1 - t) ** 2;
      setDisplay(lerpCoordinate(from, to, eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // Intentionally only re-run when the target lat/lng changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.latitude, target?.longitude, durationMs]);

  return display;
}
