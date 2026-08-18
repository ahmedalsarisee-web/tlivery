import {useEffect, useId, useMemo, type FC} from 'react';
import {View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@app/providers/ThemeContext';
import AppText from '@app/components/app-text';
import WaselMark from '@app/components/wasel-mark';
import {
  waselLoaderStyles,
  type WaselLoaderSize,
} from './styles';

type Props = {
  size?: WaselLoaderSize;
  message?: string;
  /** Absolute fill overlay (blocking). */
  fullScreen?: boolean;
};

const SPIN_MS = 1200;

/** Branded Wasel loader — static mark + rotating gold/navy ring. */
const WaselLoader: FC<Props> = ({
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const {theme, themeType} = useTheme();
  const gradientId = useId().replace(/:/g, '');
  const styles = useMemo(
    () => waselLoaderStyles(theme, size),
    [theme, size],
  );
  const rotate = useSharedValue(0);
  const isDark = themeType === 'dark';

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, {duration: SPIN_MS, easing: Easing.linear}),
      -1,
      false,
    );
  }, [rotate]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotateZ: `${rotate.value}deg`}],
  }));

  const body = (
    <>
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.ringSvg, ringAnimatedStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient
                id={gradientId}
                x1="0%"
                y1="50%"
                x2="100%"
                y2="50%">
                <Stop
                  offset="0%"
                  stopColor={isDark ? '#F5E6B8' : '#0F172A'}
                />
                <Stop offset="55%" stopColor="#D4AF37" />
                <Stop
                  offset="100%"
                  stopColor={isDark ? '#D4AF37' : '#F5E6B8'}
                />
              </LinearGradient>
            </Defs>
            <Circle
              cx="50"
              cy="50"
              r="42"
              stroke={
                isDark ? 'rgba(148,163,184,0.28)' : 'rgba(15,23,42,0.12)'
              }
              strokeWidth="7"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="42"
              stroke={`url(#${gradientId})`}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="165 120"
              fill="none"
            />
          </Svg>
        </Animated.View>
        <View style={styles.logoWrap}>
          <WaselMark
            size={size === 'sm' ? 36 : size === 'lg' ? 72 : 52}
          />
        </View>
      </View>
      {message ? (
        <AppText variant="caption" tone="secondary" style={styles.label}>
          {message}
        </AppText>
      ) : null}
    </>
  );

  if (fullScreen) {
    return (
      <View
        style={styles.fullScreen}
        accessibilityRole="progressbar"
        accessibilityLabel={message ?? 'Loading'}>
        {body}
      </View>
    );
  }

  return (
    <View
      style={styles.inline}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}>
      {body}
    </View>
  );
};

export default WaselLoader;
