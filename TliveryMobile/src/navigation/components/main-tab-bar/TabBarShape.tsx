import {type FC, useId, useMemo} from 'react';
import {StyleSheet, useWindowDimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';
import {useTheme} from '@app/providers/ThemeContext';
import {DoodleDeliveryPattern} from '@app/components/doodle-background/DoodleDeliveryPattern';
import {buildTabBarShapePath} from './tabBarShapePath';

type TabBarShapeProps = {
  barHeight: number;
  cornerRadius: number;
  humpRise?: number;
  /** Solid fill fallback when no gradient is provided. */
  fillColor?: string;
  /** 2–3 stop gradient; takes precedence over fillColor. */
  fillColors?: readonly string[];
  strokeColor?: string;
  strokeWidth?: number;
  /** When true, tiles delivery doodles clipped to the bar path. */
  showDoodle?: boolean;
};

const TabBarShape: FC<TabBarShapeProps> = ({
  barHeight,
  cornerRadius,
  humpRise = 30,
  fillColor = '#FFFFFF',
  fillColors,
  strokeColor = 'transparent',
  strokeWidth = 0,
  showDoodle = true,
}) => {
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const rawId = useId();
  const ids = useMemo(() => {
    const safe = rawId.replace(/[^a-zA-Z0-9]/g, '');
    return {
      grad: `tabBarGrad_${safe}`,
      doodle: `tabBarDoodle_${safe}`,
    };
  }, [rawId]);
  const svgHeight = barHeight + humpRise;
  const path = useMemo(
    () => buildTabBarShapePath(width, barHeight, cornerRadius, humpRise),
    [width, barHeight, cornerRadius, humpRise],
  );

  const stops = fillColors && fillColors.length >= 2 ? fillColors : null;

  return (
    <Svg width={width} height={svgHeight} style={styles.svg}>
      <Defs>
        {stops ? (
          <LinearGradient id={ids.grad} x1="0%" y1="0%" x2="100%" y2="100%">
            {stops.map((color, index) => (
              <Stop
                key={`${color}-${index}`}
                offset={`${(index / (stops.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        ) : null}
        {showDoodle ? (
          <DoodleDeliveryPattern
            id={ids.doodle}
            stroke={theme.backgrounds.doodle}
            tileScale={0.62}
          />
        ) : null}
      </Defs>
      <Path
        d={path}
        fill={stops ? `url(#${ids.grad})` : fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {showDoodle ? (
        <Path d={path} fill={`url(#${ids.doodle})`} />
      ) : null}
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    overflow: 'visible',
  },
});

export default TabBarShape;
