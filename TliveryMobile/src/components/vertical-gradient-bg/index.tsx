import {FC, useCallback, useId, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View, ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useTheme} from '@app/providers/ThemeContext';
import {DoodleDeliveryPattern} from '@app/components/doodle-background/DoodleDeliveryPattern';

type Props = {
  colors?: readonly [string, string];
  style?: ViewStyle;
  /** Tile delivery doodles clipped to this gradient surface. */
  showDoodle?: boolean;
  doodleTileScale?: number;
};

const VerticalGradientBg: FC<Props> = ({
  colors,
  style,
  showDoodle = false,
  doodleTileScale = 0.52,
}) => {
  const {theme} = useTheme();
  const [top, bottom] = colors ?? theme.gradient.header;
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `vGrad${rawId}`;
  const doodleId = `vGradDoodle${rawId}`;
  const [size, setSize] = useState({width: 0, height: 0});

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize(prev =>
        prev.width === width && prev.height === height
          ? prev
          : {width, height},
      );
    }
  }, []);

  return (
    <View
      style={[styles.fill, {backgroundColor: top}, style]}
      onLayout={onLayout}
      pointerEvents="none">
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={top} />
              <Stop offset="1" stopColor={bottom} />
            </LinearGradient>
            {showDoodle ? (
              <DoodleDeliveryPattern
                id={doodleId}
                stroke={theme.backgrounds.doodleOnDark}
                tileScale={doodleTileScale}
              />
            ) : null}
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={`url(#${gradId})`}
          />
          {showDoodle ? (
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fill={`url(#${doodleId})`}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});

export default VerticalGradientBg;
