import {FC, memo, useCallback, useId, useState} from 'react';
import {LayoutChangeEvent, View} from 'react-native';
import Svg, {Defs, Rect} from 'react-native-svg';
import {useTheme} from '@app/providers/ThemeContext';
import {DoodleDeliveryPattern} from './DoodleDeliveryPattern';
import {doodleBackgroundStyles as styles} from './styles';

export type DoodleTone = 'default' | 'onDark';

type Props = {
  /** Below 1 packs icons tighter (WhatsApp-style density). */
  tileScale?: number;
  /** `onDark` for navy/gold chrome; `default` for page canvas. */
  tone?: DoodleTone;
};

/**
 * Fixed, non-interactive wallpaper layer — delivery doodles tiled like
 * WhatsApp chat backgrounds. Clipped to its own bounds so header/hero
 * instances cannot bleed into screen content below.
 */
const DoodleBackground: FC<Props> = ({
  tileScale = 0.78,
  tone = 'default',
}) => {
  const {theme} = useTheme();
  const patternId = `doodle${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({width: 0, height: 0});
  const stroke =
    tone === 'onDark'
      ? theme.backgrounds.doodleOnDark
      : theme.backgrounds.doodle;

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
      style={styles.fill}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <DoodleDeliveryPattern
              id={patternId}
              stroke={stroke}
              tileScale={tileScale}
            />
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={`url(#${patternId})`}
          />
        </Svg>
      ) : null}
    </View>
  );
};

function areEqual(prev: Props, next: Props): boolean {
  return prev.tileScale === next.tileScale && prev.tone === next.tone;
}

export default memo(DoodleBackground, areEqual);
