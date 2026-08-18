import {useEffect, useRef, useState} from 'react';
import {lerpLatLng, MARKER_ANIMATION_MS, type LatLng} from '../utils/geo';

/** Smoothly interpolate a map pin over ~1s between sparse Firestore updates. */
export function useSmoothLatLng(
  target: LatLng | null,
  durationMs: number = MARKER_ANIMATION_MS,
): LatLng | null {
  const [display, setDisplay] = useState<LatLng | null>(target);
  const fromRef = useRef<LatLng | null>(null);
  const toRef = useRef<LatLng | null>(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

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
      Math.abs(display.lat - target.lat) < 1e-7 &&
      Math.abs(display.lng - target.lng) < 1e-7;
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
      const eased = 1 - (1 - t) ** 2;
      setDisplay(lerpLatLng(from, to, eased));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on target change
  }, [target?.lat, target?.lng, durationMs]);

  return display;
}
