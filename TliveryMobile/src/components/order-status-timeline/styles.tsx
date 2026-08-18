import {StyleSheet} from 'react-native';
import type {ThemeType} from '@app/theme/theme';
import {LangDirection} from '@app/enums/LangDirection';
import {
  getFlexDirection,
  getTextAlign,
} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export const CURVE_AMP = getHeight(12);
/** Compact track when showing a status illustration (no bike). */
export const TRACK_HEIGHT = getHeight(64);
/** Extra room in the track for the motorcycle to sit above the curve. */
export const TRACK_HEIGHT_BIKE = getHeight(78);
export const NODE_SIZE = getWidth(22);
export const BIKE_W = getWidth(58);
export const BIKE_H = getHeight(44);
export const SIDE_PAD = getWidth(14);
export const BIKE_TOP_SPACE = getHeight(22);

export const orderStatusTimelineStyles = (
  theme: ThemeType,
  direction: LangDirection,
) => {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: theme.backgrounds.surface,
      borderWidth: 1,
      borderColor: theme.ui.border,
      paddingTop: getHeight(space.xs),
      paddingBottom: getHeight(space.sm),
      paddingHorizontal: getWidth(space.sm),
      overflow: 'hidden',
    },
    heroWrap: {
      height: getHeight(48),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
    },
    heroImage: {
      width: getWidth(64),
      height: getHeight(48),
    },
    trackArea: {
      height: TRACK_HEIGHT,
      marginBottom: 0,
      marginTop: 0,
      position: 'relative',
    },
    trackAreaBike: {
      height: TRACK_HEIGHT_BIKE,
    },
    bikeTopPad: {
      height: BIKE_TOP_SPACE,
    },
    svgLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    node: {
      position: 'absolute',
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.ui.border,
      backgroundColor: theme.backgrounds.surface,
      zIndex: 2,
    },
    nodeDone: {
      backgroundColor: theme.status.success,
      borderColor: theme.status.success,
    },
    nodeCurrent: {
      backgroundColor: theme.brand.navy,
      borderColor: theme.brand.navy,
    },
    nodePending: {
      backgroundColor: theme.ui.borderLight,
      borderColor: theme.ui.border,
    },
    motorcycle: {
      position: 'absolute',
      width: BIKE_W,
      height: BIKE_H,
      zIndex: 3,
    },
    labelsRow: {
      flexDirection: getFlexDirection(direction),
      justifyContent: 'space-between',
      paddingHorizontal: getWidth(4),
      gap: getWidth(2),
      marginTop: getHeight(2),
    },
    labelCell: {
      flex: 1,
      alignItems: 'center',
    },
    label: {
      fontSize: fontSize.label,
      color: theme.typography.caption,
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    labelActive: {
      color: theme.typography.primary,
    },
    statusLine: {
      marginTop: getHeight(space.xs),
      textAlign: getTextAlign(direction),
      fontSize: fontSize.caption,
      color: theme.typography.secondary,
      ...cairoFont('bold'),
    },
    cancelledBanner: {
      alignItems: 'center',
      gap: getHeight(space.xs),
      paddingVertical: getHeight(space.sm),
    },
    cancelledImage: {
      width: getWidth(80),
      height: getHeight(64),
    },
  });
};
