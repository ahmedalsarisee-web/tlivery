import {useEffect, useMemo, type FC} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Map,
  MapPin,
  Radio,
} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {elevation, fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

const MAP_LIGHT = require('@app/assets/images/wasel/fleet/light-map.png');
const MAP_DARK = require('@app/assets/images/wasel/fleet/dark-map.png');

type Props = {
  used: number;
  max: number;
  online: number;
  onPressMap: () => void;
};

type PinSpec = {
  top: string;
  left: string;
  accent: string;
  ringBg: string;
  delayMs: number;
};

function PromoMapPulsePin({
  accent,
  ringBg,
  delayMs,
  top,
  left,
  isDark,
}: {
  accent: string;
  ringBg: string;
  delayMs: number;
  top: string;
  left: string;
  isDark: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {duration: 1200}),
          withTiming(0, {duration: 1200}),
        ),
        -1,
        false,
      );
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{scale: 1 + pulse.value * 0.38}],
    opacity: 0.34 + pulse.value * 0.42,
  }));

  return (
    <View
      style={[
        pinStyles.pinWrap,
        {top: top as DimensionValue, left: left as DimensionValue},
      ]}
      pointerEvents="none">
      <View style={pinStyles.pinInner}>
        <Animated.View
          style={[
            pinStyles.pinRing,
            ringStyle,
            {borderColor: accent, backgroundColor: ringBg},
          ]}
        />
        <View
          style={[
            pinStyles.pinCore,
            {
              backgroundColor: accent,
              shadowColor: isDark ? accent : '#000000',
              shadowOpacity: isDark ? 0.84 : 0.14,
            },
          ]}>
          <MapPin
            color={isDark ? '#0B1220' : '#FFFFFF'}
            size={11}
            strokeWidth={2.4}
          />
        </View>
      </View>
    </View>
  );
}

function ContentScrim({rtl, isDark}: {rtl: boolean; isDark: boolean}) {
  const color = isDark ? '#0B1220' : '#FFFFFF';
  return (
    <View
      style={[
        stylesShared.scrimWrap,
        rtl ? stylesShared.scrimRtl : stylesShared.scrimLtr,
      ]}
      pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient
            id="fleetFullMapScrim"
            x1={rtl ? '1' : '0'}
            y1="0"
            x2={rtl ? '0' : '1'}
            y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.88" />
            <Stop offset="0.55" stopColor={color} stopOpacity="0.45" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#fleetFullMapScrim)"
        />
      </Svg>
    </View>
  );
}

/**
 * Fleet promo: full-card map under pins; text/CTA overlay (Synchro-inspired).
 */
const FleetPromoCard: FC<Props> = ({used, max, online, onPressMap}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const accent = isDark ? theme.brand.gold : theme.brand.navy;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hit: {
          marginBottom: getHeight(2),
        },
        card: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
          backgroundColor: isDark ? '#0B1220' : '#E8EEF5',
          overflow: 'hidden',
          height: getHeight(168),
          ...elevation.card,
          shadowOpacity: isDark ? 0.28 : 0.06,
        },
        mapImage: {
          ...StyleSheet.absoluteFill,
          width: '100%',
          height: '100%',
          transform: [{scale: 1.05}],
        },
        content: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          start: 0,
          zIndex: 4,
          justifyContent: 'space-between',
          paddingHorizontal: getWidth(space.md),
          paddingTop: getHeight(space.sm),
          paddingBottom: getHeight(space.md),
          width: '62%',
        },
        contentRtl: {
          start: undefined,
          end: 0,
        },
        topRow: {
          alignItems: 'flex-start',
          gap: getWidth(8),
        },
        iconBox: {
          width: getWidth(30),
          height: getWidth(30),
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark
            ? 'rgba(212,175,55,0.22)'
            : 'rgba(255,255,255,0.92)',
          borderWidth: 1,
          borderColor: isDark
            ? 'rgba(212,175,55,0.4)'
            : 'rgba(15,23,42,0.1)',
        },
        textCol: {
          flex: 1,
          minWidth: 0,
          gap: getHeight(2),
        },
        title: {
          fontSize: fontSize.section,
          color: isDark ? theme.base.white : theme.typography.primary,
          ...cairoFont('bold'),
        },
        subtitle: {
          fontSize: fontSize.caption,
          color: isDark
            ? 'rgba(255,255,255,0.78)'
            : theme.typography.secondary,
          ...cairoFont('medium'),
          lineHeight: fontSize.caption + 4,
        },
        meta: {
          fontSize: fontSize.caption,
          color: isDark
            ? 'rgba(255,255,255,0.72)'
            : theme.typography.secondary,
          ...cairoFont('medium'),
          marginTop: getHeight(4),
        },
        cta: {
          alignSelf: 'stretch',
          marginTop: getHeight(space.sm),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: getWidth(6),
          paddingHorizontal: getWidth(space.sm),
          paddingVertical: getHeight(8),
          borderRadius: radius.sm,
          backgroundColor: accent,
        },
        ctaText: {
          flex: 1,
          fontSize: fontSize.caption,
          color: isDark ? theme.brand.navy : theme.base.white,
          ...cairoFont('bold'),
          textAlign: 'center',
        },
        livePill: {
          position: 'absolute',
          bottom: getHeight(8),
          zIndex: 5,
          flexDirection: 'row',
          alignItems: 'center',
          gap: getWidth(4),
          paddingHorizontal: getWidth(6),
          paddingVertical: getHeight(3),
          borderRadius: radius.pill,
          backgroundColor: isDark
            ? 'rgba(15,23,42,0.88)'
            : 'rgba(255,255,255,0.94)',
          borderWidth: 1,
          borderColor: isDark
            ? 'rgba(148,163,184,0.22)'
            : 'rgba(15,23,42,0.08)',
        },
        liveLabel: {
          fontSize: fontSize.label,
          color: theme.status.success,
          ...cairoFont('bold'),
        },
      }),
    [accent, isDark, theme],
  );

  // Keep pins on the open map side (opposite the text column).
  const pins: PinSpec[] = useMemo(() => {
    const darkPins = [
      {
        top: '14%',
        left: rtl ? '26%' : '74%',
        accent: '#39FF14',
        ringBg: 'rgba(57, 255, 20, 0.14)',
        delayMs: 0,
      },
      {
        top: '36%',
        left: rtl ? '14%' : '86%',
        accent: '#00F3FF',
        ringBg: 'rgba(0, 243, 255, 0.14)',
        delayMs: 180,
      },
      {
        top: '58%',
        left: rtl ? '32%' : '68%',
        accent: theme.brand.gold,
        ringBg: 'rgba(212, 175, 55, 0.16)',
        delayMs: 360,
      },
      {
        top: '76%',
        left: rtl ? '18%' : '80%',
        accent: '#A78BFA',
        ringBg: 'rgba(167, 139, 250, 0.16)',
        delayMs: 540,
      },
    ];
    const lightPins = [
      {
        top: '14%',
        left: rtl ? '26%' : '74%',
        accent: '#10B981',
        ringBg: 'rgba(16, 185, 129, 0.13)',
        delayMs: 0,
      },
      {
        top: '36%',
        left: rtl ? '14%' : '86%',
        accent: theme.brand.navy,
        ringBg: 'rgba(15, 23, 42, 0.12)',
        delayMs: 180,
      },
      {
        top: '58%',
        left: rtl ? '32%' : '68%',
        accent: '#F59E0B',
        ringBg: 'rgba(245, 158, 11, 0.13)',
        delayMs: 360,
      },
      {
        top: '76%',
        left: rtl ? '18%' : '80%',
        accent: '#7C3AED',
        ringBg: 'rgba(124, 58, 237, 0.13)',
        delayMs: 540,
      },
    ];
    return isDark ? darkPins : lightPins;
  }, [isDark, rtl, theme.brand.gold, theme.brand.navy]);

  const accessibilityLabel = `${t('fleetOverview')}. ${t('fleetPromoMapCta')}`;

  return (
    <Pressable
      onPress={onPressMap}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.hit}>
      <View style={styles.card}>
        <Image
          accessibilityIgnoresInvertColors
          source={isDark ? MAP_DARK : MAP_LIGHT}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <ContentScrim rtl={rtl} isDark={isDark} />

        {pins.map((p, i) => (
          <PromoMapPulsePin
            key={`promo-pin-${i}`}
            accent={p.accent}
            ringBg={p.ringBg}
            delayMs={p.delayMs}
            top={p.top}
            left={p.left}
            isDark={isDark}
          />
        ))}

        <View
          style={[
            styles.livePill,
            rtl ? {left: getWidth(8)} : {right: getWidth(8)},
            {flexDirection: getFlexDirection(direction)},
          ]}>
          <Radio size={10} color={theme.status.success} strokeWidth={2.5} />
          <AppText style={styles.liveLabel}>{t('fleetPromoLive')}</AppText>
        </View>

        <View style={[styles.content, rtl && styles.contentRtl]}>
          <View>
            <View
              style={[
                styles.topRow,
                {flexDirection: getFlexDirection(direction)},
              ]}>
              <View style={styles.iconBox}>
                <MapPin size={15} color={accent} strokeWidth={2.4} />
              </View>
              <View style={styles.textCol}>
                <AppText style={styles.title} numberOfLines={2}>
                  {t('fleetOverview')}
                </AppText>
                <AppText style={styles.subtitle} numberOfLines={2}>
                  {t('driversCapacity', {count: used, max})}
                </AppText>
              </View>
            </View>
            <AppText style={styles.meta}>
              {t('fleetPromoOnline', {count: online})}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('fleetPromoMapCta')}
            onPress={onPressMap}
            style={[styles.cta, {flexDirection: getFlexDirection(direction)}]}>
            <Map
              size={15}
              color={isDark ? theme.brand.navy : theme.base.white}
              strokeWidth={2.2}
            />
            <AppText style={styles.ctaText} numberOfLines={1}>
              {t('fleetPromoMapCta')}
            </AppText>
            <Chevron
              size={15}
              color={isDark ? theme.brand.navy : theme.base.white}
              strokeWidth={2.4}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const pinStyles = StyleSheet.create({
  pinWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    zIndex: 2,
  },
  pinInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  pinCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 0},
  },
});

const stylesShared = StyleSheet.create({
  scrimWrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  scrimLtr: {},
  scrimRtl: {},
});

export default FleetPromoCard;
