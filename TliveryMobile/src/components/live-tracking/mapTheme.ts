/**
 * Live-map visual language (Careem-like map + deep green accents).
 * Scoped to tracking maps — does not change the global app theme.
 */

export const mapAccent = {
  forest: '#00332B',
  forestMuted: '#0A4A3F',
  route: '#00332B',
  routeGlow: 'rgba(0, 51, 43, 0.22)',
  routeDark: '#D4AF37',
  routeGlowDark: 'rgba(212, 175, 55, 0.28)',
  pickup: '#0A4A3F',
  dropoff: '#00332B',
  sheetShadow: 'rgba(15, 23, 42, 0.14)',
  mapCanvas: '#F3F1EC',
  mapCanvasDark: '#0B1220',
  captainRing: '#FFFFFF',
  captainRingOnTrip: '#D4A017',
  captainRingSelected: '#00332B',
} as const;

/**
 * Google Maps JSON style — pale land, soft roads, muted labels, fewer POIs.
 */
export const LIGHT_MAP_STYLE: Array<Record<string, unknown>> = [
  {elementType: 'geometry', stylers: [{color: '#F3F1EC'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#6B7280'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#F3F1EC'}]},
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{color: '#D6D3D1'}],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{color: '#EAE6DF'}],
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{color: '#D7E5D3'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6B7F6A'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#FFFFFF'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{color: '#E5E1DA'}],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{color: '#F8F7F4'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#EDE9E2'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{color: '#D6D1C8'}],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'transit',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{color: '#D7E4EC'}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#7A90A0'}],
  },
];

/** Dark-mode companion style for fleet / live tracking maps. */
export const DARK_MAP_STYLE: Array<Record<string, unknown>> = [
  {elementType: 'geometry', stylers: [{color: '#0B1220'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#94A3B8'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#0B1220'}]},
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{color: '#243447'}],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{color: '#122033'}],
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{color: '#0F2A24'}],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6B7F6A'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#1A2A3D'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{color: '#0B1220'}],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{color: '#1E3044'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#243447'}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{color: '#122033'}],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'transit',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{color: '#071018'}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#475569'}],
  },
];

export function mapStyleForTheme(
  themeType: 'light' | 'dark',
): Array<Record<string, unknown>> {
  return themeType === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}
