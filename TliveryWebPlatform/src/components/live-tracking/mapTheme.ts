/** Live-map visual language — pale canvas + deep green accents. */

export const mapAccent = {
  forest: '#00332B',
  route: '#0E4A35',
  routeGlow: 'rgba(14, 74, 53, 0.28)',
  mapCanvas: '#F3F1EC',
} as const;

export const LIGHT_MAP_STYLE: Array<Record<string, unknown>> = [
  {elementType: 'geometry', stylers: [{color: '#F3F1EC'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#6B7280'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#F3F1EC'}]},
  {
    featureType: 'administrative.land_parcel',
    stylers: [{visibility: 'off'}],
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
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: '#EDE9E2'}],
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
];
