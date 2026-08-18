import {memo, useMemo} from 'react';
import {Circle, G, Path, Pattern, Rect} from 'react-native-svg';

export const DOODLE_TILE_SIZE = 220;

type Props = {
  /** Unique within the same Svg document. */
  id: string;
  stroke: string;
  /** Below 1 tiles the pattern more tightly. */
  tileScale?: number;
};

/**
 * Delivery-themed line doodle tile (packages, pins, trucks, routes)
 * for ScreenContainer / chrome reuse — same approach as Synchro HR doodles.
 */
function DoodleDeliveryPatternInner({
  id,
  stroke,
  tileScale = 1,
}: Props) {
  const s = tileScale;
  const patternPx = useMemo(() => DOODLE_TILE_SIZE * s, [s]);

  return (
    <Pattern
      id={id}
      x={0}
      y={0}
      width={patternPx}
      height={patternPx}
      patternUnits="userSpaceOnUse">
      <G transform={`scale(${s})`}>
        {/* Package */}
        <G
          transform="translate(18, 12) rotate(-12) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
          <Path d="M12 22V12" />
          <Path d="m3.29 7 8.71 5 8.71-5" />
          <Path d="M7.5 4.27l9 5.15" />
        </G>

        {/* Map pin */}
        <G
          transform="translate(95, 8) rotate(10) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <Circle cx="12" cy="10" r="3" />
        </G>

        {/* Truck */}
        <G
          transform="translate(160, 14) rotate(-8) scale(0.78)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <Path d="M15 18H9" />
          <Path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <Circle cx="17" cy="18" r="2" />
          <Circle cx="7" cy="18" r="2" />
        </G>

        {/* Navigation / route arrow */}
        <G
          transform="translate(22, 82) rotate(14) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="m3 11 19-9-9 19-2-8z" />
        </G>

        {/* Motorbike (simplified) */}
        <G
          transform="translate(95, 88) rotate(-10) scale(0.8)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Circle cx="5" cy="17" r="3" />
          <Circle cx="19" cy="17" r="3" />
          <Path d="M12 17h3l2-5H9l1 3" />
          <Path d="m10 9 1.5 3" />
          <Path d="M14 6h3l2 4" />
        </G>

        {/* Clock / ETA */}
        <G
          transform="translate(165, 85) rotate(12) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 6v6l4 2" />
        </G>

        {/* Phone */}
        <G
          transform="translate(25, 155) rotate(-12) scale(0.78)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <Path d="M12 18h.01" />
        </G>

        {/* Check / delivered */}
        <G
          transform="translate(100, 158) rotate(6) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Path d="m9 12 2 2 4-4" />
        </G>

        {/* Route path */}
        <G
          transform="translate(168, 155) rotate(-14) scale(0.82)"
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round">
          <Circle cx="6" cy="19" r="3" />
          <Path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <Circle cx="18" cy="5" r="3" />
        </G>

        {/* Decorative marks */}
        <G transform="translate(72, 55)" stroke={stroke} fill="none" strokeWidth={1.4}>
          <Circle r="2.5" />
        </G>
        <G transform="translate(145, 68)" stroke={stroke} fill="none" strokeWidth={1.4}>
          <Path d="M-3 0 h6 M0 -3 v6" transform="rotate(45)" />
        </G>
        <G transform="translate(80, 135)" stroke={stroke} fill="none" strokeWidth={1.4}>
          <Path d="M0 0 l 4 4 M4 0 l -4 4" />
        </G>
        <G transform="translate(48, 205)" stroke={stroke} fill="none" strokeWidth={1.4}>
          <Path d="M0 0 q 6 -5 12 0" />
        </G>
        <G transform="translate(195, 48)" stroke={stroke} fill="none" strokeWidth={1.4}>
          <Circle r="1.8" fill={stroke} />
        </G>
      </G>
    </Pattern>
  );
}

function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.id === next.id &&
    prev.stroke === next.stroke &&
    prev.tileScale === next.tileScale
  );
}

export const DoodleDeliveryPattern = memo(DoodleDeliveryPatternInner, areEqual);
