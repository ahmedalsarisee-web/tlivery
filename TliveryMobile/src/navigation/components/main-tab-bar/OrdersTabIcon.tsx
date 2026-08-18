import {type FC} from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

type OrdersTabIconProps = {
  size?: number;
  color: string;
  /** Filled clipboard (active) vs outline (inactive). */
  filled?: boolean;
  /** Line color inside the filled board (defaults to white). */
  lineColor?: string;
};

/**
 * Clipboard-with-list icon matching the company orders tab mock:
 * solid board + top clip + three list lines.
 */
const OrdersTabIcon: FC<OrdersTabIconProps> = ({
  size = 24,
  color,
  filled = false,
  lineColor = '#FFFFFF',
}) => {
  if (!filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1"
          stroke={color}
          strokeWidth={1.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9V5Z"
          stroke={color}
          strokeWidth={1.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 11h6M9 14.5h6M9 18h4"
          stroke={color}
          strokeWidth={1.85}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main board */}
      <Path
        d="M6.5 5.25h2.35A2.75 2.75 0 0 1 11.5 3h1a2.75 2.75 0 0 1 2.65 2.25H17.5A2.25 2.25 0 0 1 19.75 7.5v11.75A2.25 2.25 0 0 1 17.5 21.5h-11A2.25 2.25 0 0 1 4.25 19.25V7.5A2.25 2.25 0 0 1 6.5 5.25Z"
        fill={color}
      />
      {/* Clip body */}
      <Rect x={9} y={2.35} width={6} height={3.9} rx={1.35} fill={color} />
      {/* Clip window */}
      <Rect
        x={10.15}
        y={3.25}
        width={3.7}
        height={2.1}
        rx={0.75}
        fill={lineColor}
        opacity={0.95}
      />
      {/* Three list lines */}
      <Path
        d="M8.35 10.15h7.3M8.35 13.35h7.3M8.35 16.55h5.2"
        stroke={lineColor}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default OrdersTabIcon;
