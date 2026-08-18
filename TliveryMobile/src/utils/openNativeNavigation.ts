import {Linking, Platform} from 'react-native';

export type NavCoord = {
  latitude: number;
  longitude: number;
};

type Options = {
  /** Optional current position — helps Google Maps seed the route. */
  origin?: NavCoord | null;
  label?: string | null;
};

const encodeLabel = (label?: string | null): string => {
  const trimmed = label?.trim();
  return trimmed ? encodeURIComponent(trimmed) : '';
};

/**
 * Open the device maps app with turn-by-turn driving directions.
 * Avoids Google Directions API cost inside Wasel — native apps already
 * compute the best road route.
 */
export async function openNativeNavigation(
  destination: NavCoord,
  options?: Options,
): Promise<boolean> {
  const {latitude: dLat, longitude: dLng} = destination;
  if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) {
    return false;
  }

  const origin = options?.origin;
  const hasOrigin =
    origin != null &&
    Number.isFinite(origin.latitude) &&
    Number.isFinite(origin.longitude);

  const label = encodeLabel(options?.label);
  const dest = `${dLat},${dLng}`;
  const destWithLabel = label ? `${label}@${dest}` : dest;

  const googleWebDir = hasOrigin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin!.latitude},${origin!.longitude}&destination=${dest}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;

  const candidates: string[] =
    Platform.OS === 'ios'
      ? [
          // Apple Maps directions
          hasOrigin
            ? `maps://?saddr=${origin!.latitude},${origin!.longitude}&daddr=${destWithLabel}&dirflg=d`
            : `maps://?daddr=${destWithLabel}&dirflg=d`,
          // Google Maps app if installed
          hasOrigin
            ? `comgooglemaps://?saddr=${origin!.latitude},${origin!.longitude}&daddr=${dest}&directionsmode=driving`
            : `comgooglemaps://?daddr=${dest}&directionsmode=driving`,
          googleWebDir,
        ]
      : [
          // Google Maps navigation intent (Android)
          `google.navigation:q=${dest}&mode=d`,
          // geo intent with query
          `geo:${dest}?q=${destWithLabel}`,
          googleWebDir,
        ];

  for (const url of candidates) {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can && !url.startsWith('https://')) {
        continue;
      }
      await Linking.openURL(url);
      return true;
    } catch {
      // try next candidate
    }
  }

  try {
    await Linking.openURL(googleWebDir);
    return true;
  } catch {
    return false;
  }
}
