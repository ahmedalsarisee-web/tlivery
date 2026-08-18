import brand from '@app/config/brand';

const Images = {
  splash: brand.images.symbol,
  loading: brand.images.symbol,
  waselSymbol: brand.images.symbol,
  waselFull: brand.images.full,
  waselFullLight: brand.images.fullLight,
  waselWing: brand.images.wing,
  waselGlow: brand.images.glow,
  waselAppIcon: brand.images.appIcon,
  timeline: {
    waiting: require('./images/wasel/timeline/status_waiting.png'),
    accepted: require('./images/wasel/timeline/status_accepted.png'),
    onTheWay: require('./images/wasel/timeline/status_on_the_way.png'),
    arriving: require('./images/wasel/timeline/status_arriving.png'),
    delivered: require('./images/wasel/timeline/status_delivered.png'),
    cancelled: require('./images/wasel/timeline/status_cancelled.png'),
    motorcycle: require('./images/wasel/timeline/timeline_motorcycle.png'),
    motorcycleWhite: require('./images/wasel/timeline/timeline_motorcycle_white.png'),
  },
};

export default Images;
