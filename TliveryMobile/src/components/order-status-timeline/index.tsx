import {useEffect, useMemo, useState, type FC} from 'react';
import {Image, LayoutChangeEvent, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react-native';
import Svg, {Path} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import Images from '@app/assets/Images';
import {LangDirection} from '@app/enums/LangDirection';
import type {OrderStatus} from '@app/features/orders/types';
import {
  isTerminalNegative,
  TRACK_STEPS,
  trackStepIndex,
} from '@app/features/orders/utils/trackSteps';
import {getHeight} from '@app/utils/responsive-design';
import {
  BIKE_H,
  BIKE_W,
  CURVE_AMP,
  NODE_SIZE,
  SIDE_PAD,
  TRACK_HEIGHT,
  TRACK_HEIGHT_BIKE,
  orderStatusTimelineStyles,
} from './styles';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type OrderStatusTimelineProps = {
  status: OrderStatus;
  etaMinutes?: number;
  lastUpdateAt?: string;
};

/** Point on a quadratic Bezier: P0 → P1(control) → P2 */
const quadPoint = (
  t: number,
  p0: {x: number; y: number},
  p1: {x: number; y: number},
  p2: {x: number; y: number},
) => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};

const OrderStatusTimeline: FC<OrderStatusTimelineProps> = ({
  status,
  etaMinutes,
  lastUpdateAt,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => orderStatusTimelineStyles(theme, direction),
    [theme, direction],
  );
  const isRtl = direction === LangDirection.RTL;
  const isDark = themeType === 'dark';
  const stepIndex = trackStepIndex(status);
  const terminalNeg = isTerminalNegative(status);
  const activeStep =
    stepIndex >= 0
      ? TRACK_STEPS[Math.min(stepIndex, TRACK_STEPS.length - 1)]
      : null;
  const showBike = stepIndex >= 1 && stepIndex < 4;

  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);
  const bob = useSharedValue(0);
  const bikeOpacity = useSharedValue(0);
  const dashOffset = useSharedValue(0);
  const p0x = useSharedValue(0);
  const p0y = useSharedValue(0);
  const p1x = useSharedValue(0);
  const p1y = useSharedValue(0);
  const p2x = useSharedValue(0);
  const p2y = useSharedValue(0);
  const trackWSv = useSharedValue(0);

  const nodeCount = TRACK_STEPS.length;
  const bikeLift = getHeight(8);

  const trackH = showBike ? TRACK_HEIGHT_BIKE : TRACK_HEIGHT;

  const curve = useMemo(() => {
    const w = Math.max(trackWidth, 1);
    // Keep the curve near the top under status images; lower when bike needs room.
    const cy = showBike ? trackH * 0.7 : trackH * 0.48;
    const amp = CURVE_AMP;
    const pad = SIDE_PAD + NODE_SIZE / 2;
    const p0 = {x: pad, y: cy + amp * 0.15};
    const p1 = {x: w / 2, y: cy - amp};
    const p2 = {x: w - pad, y: cy + amp * 0.25};
    const d = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
    const length = Math.max(w - pad * 2, 1) * 1.06;
    return {p0, p1, p2, d, length, cy, pad};
  }, [showBike, trackH, trackWidth]);

  useEffect(() => {
    p0x.value = curve.p0.x;
    p0y.value = curve.p0.y;
    p1x.value = curve.p1.x;
    p1y.value = curve.p1.y;
    p2x.value = curve.p2.x;
    p2y.value = curve.p2.y;
    trackWSv.value = trackWidth;
  }, [curve, p0x, p0y, p1x, p1y, p2x, p2y, trackWSv, trackWidth]);

  useEffect(() => {
    const target =
      stepIndex < 0 ? 0 : Math.min(stepIndex / (nodeCount - 1), 1);
    progress.value = withTiming(target, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    bikeOpacity.value = withTiming(showBike ? 1 : 0, {duration: 400});
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, {duration: 650, easing: Easing.inOut(Easing.sin)}),
        withTiming(0, {duration: 650, easing: Easing.inOut(Easing.sin)}),
      ),
      -1,
      false,
    );
  }, [bikeOpacity, bob, nodeCount, progress, showBike, stepIndex]);

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }
    const target =
      stepIndex < 0 ? 0 : Math.min(stepIndex / (nodeCount - 1), 1);
    dashOffset.value = withTiming(curve.length * (1 - target), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [curve.length, dashOffset, nodeCount, stepIndex, trackWidth]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const fillProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const bikeStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const u = 1 - t;
    const x =
      u * u * p0x.value + 2 * u * t * p1x.value + t * t * p2x.value;
    const y =
      u * u * p0y.value + 2 * u * t * p1y.value + t * t * p2y.value;
    const left = isRtl
      ? trackWSv.value - x - BIKE_W / 2
      : x - BIKE_W / 2;
    return {
      opacity: bikeOpacity.value,
      transform: [
        {translateX: left},
        {translateY: y - BIKE_H - bikeLift + bob.value},
        {scaleX: isRtl ? -1 : 1},
      ],
    };
  });

  const formattedUpdate = useMemo(() => {
    if (!lastUpdateAt) {
      return null;
    }
    const date = new Date(lastUpdateAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [lastUpdateAt]);

  const statusSummary = terminalNeg
    ? t(`orderStatus_${status}`)
    : [
        t(activeStep?.labelKey ?? 'trackStepOrdered'),
        stepIndex >= 4
          ? null
          : etaMinutes != null
            ? t('etaMinutes', {minutes: etaMinutes})
            : t('etaPending'),
        formattedUpdate
          ? t('lastUpdateAt', {time: formattedUpdate})
          : null,
      ]
        .filter(Boolean)
        .join(' · ');

  if (terminalNeg) {
    return (
      <View style={styles.card}>
        <View style={styles.cancelledBanner}>
          <Image
            source={Images.timeline.cancelled}
            style={styles.cancelledImage}
            resizeMode="contain"
          />
          <AppText variant="heading">{t(`orderStatus_${status}`)}</AppText>
          {formattedUpdate ? (
            <AppText variant="caption" tone="secondary">
              {formattedUpdate}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }

  const lineTrackColor = theme.ui.borderLight;
  const lineFillColor = isDark ? theme.brand.gold : theme.brand.navy;
  const currentNodeBg = isDark ? theme.brand.gold : theme.brand.navy;
  const checkColor = theme.typography.inverse;
  const motorcycleSrc = isDark
    ? Images.timeline.motorcycleWhite
    : Images.timeline.motorcycle;

  const nodePoints = TRACK_STEPS.map((_, index) => {
    const t = index / (nodeCount - 1);
    return quadPoint(t, curve.p0, curve.p1, curve.p2);
  });

  return (
    <View style={styles.card}>
      {!showBike && activeStep ? (
        <View style={styles.heroWrap}>
          <Image
            source={activeStep.image}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      ) : showBike ? (
        <View style={styles.bikeTopPad} />
      ) : (
        <View style={[styles.heroWrap, {height: getHeight(2)}]} />
      )}

      <View
        style={[styles.trackArea, showBike && styles.trackAreaBike]}
        onLayout={onTrackLayout}>
        {trackWidth > 0 ? (
          <Svg
            width={trackWidth}
            height={trackH}
            style={[
              styles.svgLayer,
              isRtl ? {transform: [{scaleX: -1}]} : null,
            ]}>
            <Path
              d={curve.d}
              stroke={lineTrackColor}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            <AnimatedPath
              d={curve.d}
              stroke={lineFillColor}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${curve.length} ${curve.length}`}
              animatedProps={fillProps}
            />
          </Svg>
        ) : null}

        {trackWidth > 0 && showBike ? (
          <Animated.Image
            source={motorcycleSrc}
            style={[styles.motorcycle, bikeStyle]}
            resizeMode="contain"
          />
        ) : null}

        {trackWidth > 0
          ? nodePoints.map((pt, index) => {
              const done = index < stepIndex;
              const current = index === stepIndex;
              const left = isRtl
                ? trackWidth - pt.x - NODE_SIZE / 2
                : pt.x - NODE_SIZE / 2;
              return (
                <View
                  key={TRACK_STEPS[index].id}
                  style={[
                    styles.node,
                    {
                      left,
                      top: pt.y - NODE_SIZE / 2,
                    },
                    done && styles.nodeDone,
                    current && [
                      styles.nodeCurrent,
                      {
                        backgroundColor: currentNodeBg,
                        borderColor: currentNodeBg,
                      },
                    ],
                    !done && !current && styles.nodePending,
                  ]}>
                  {done ? (
                    <Check size={12} color={checkColor} strokeWidth={3} />
                  ) : null}
                </View>
              );
            })
          : null}
      </View>

      <View style={styles.labelsRow}>
        {TRACK_STEPS.map((step, index) => {
          const active = index <= stepIndex;
          return (
            <View key={step.id} style={styles.labelCell}>
              <AppText
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={2}>
                {t(step.labelKey)}
              </AppText>
            </View>
          );
        })}
      </View>

      <AppText style={styles.statusLine}>{statusSummary}</AppText>
    </View>
  );
};

export default OrderStatusTimeline;
