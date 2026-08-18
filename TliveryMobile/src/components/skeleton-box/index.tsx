import {memo, useEffect, useMemo, useRef, type FC} from 'react';
import {
  Animated,
  Easing,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {radius} from '@app/theme/tokens';

type Props = {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

const PULSE_MS = 1100;

/** Soft pulse placeholder block (no extra gradient dependency). */
const SkeletonBox: FC<Props> = memo(function SkeletonBox({
  style,
  borderRadius = radius.md,
}) {
  const {themeType} = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const bg = useMemo(
    () =>
      themeType === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.08)',
    [themeType],
  );

  return (
    <Animated.View
      style={[
        {
          overflow: 'hidden',
          backgroundColor: bg,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
});

export default SkeletonBox;
