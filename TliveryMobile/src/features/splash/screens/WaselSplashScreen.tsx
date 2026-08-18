import {FC, useEffect, useMemo} from 'react';
import {Image, StatusBar, Text, View} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {WaselSplashScreenProps} from '@app/types/waselSplash.props';
import {waselSplashStyles} from './WaselSplash.styles';
import BrandLogo from '@app/components/brand-logo';
import brand from '@app/config/brand';

const ENTRANCE_MS = 800;
const TAG_DELAY_MS = 420;
const DEFAULT_HOLD_MS = 3200;

const entranceEasing = Easing.bezier(0.22, 1, 0.36, 1);

const WaselSplashScreen: FC<WaselSplashScreenProps> = ({
  onSplashFinished,
  durationMs = DEFAULT_HOLD_MS,
}) => {
  const {t} = useTranslation();
  const {language} = useLanguage();
  const {themeType} = useTheme();
  const isDark = themeType === 'dark';
  const styles = useMemo(() => waselSplashStyles(themeType), [themeType]);
  const isArabic = language === 'ar';

  const brandOpacity = useSharedValue(0);
  const brandScale = useSharedValue(0.88);
  const tagOpacity = useSharedValue(0);
  const tagTranslateY = useSharedValue(14);
  const ornamentScale = useSharedValue(0.4);

  useEffect(() => {
    brandOpacity.value = withTiming(1, {
      duration: ENTRANCE_MS,
      easing: entranceEasing,
    });
    brandScale.value = withTiming(1, {
      duration: ENTRANCE_MS,
      easing: entranceEasing,
    });

    tagOpacity.value = withDelay(
      TAG_DELAY_MS,
      withTiming(1, {duration: 700, easing: entranceEasing}),
    );
    tagTranslateY.value = withDelay(
      TAG_DELAY_MS,
      withTiming(0, {duration: 700, easing: entranceEasing}),
    );
    ornamentScale.value = withDelay(
      TAG_DELAY_MS,
      withTiming(1, {duration: 650, easing: entranceEasing}),
    );

    const timer = setTimeout(() => {
      onSplashFinished();
    }, durationMs);

    return () => {
      clearTimeout(timer);
      cancelAnimation(brandOpacity);
      cancelAnimation(brandScale);
      cancelAnimation(tagOpacity);
      cancelAnimation(tagTranslateY);
      cancelAnimation(ornamentScale);
    };
  }, [
    brandOpacity,
    brandScale,
    durationMs,
    onSplashFinished,
    ornamentScale,
    tagOpacity,
    tagTranslateY,
  ]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{scale: brandScale.value}],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{translateY: tagTranslateY.value}],
  }));

  const ornamentStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{scaleX: ornamentScale.value}],
  }));

  return (
    <View style={styles.root} accessibilityRole="summary">
      <StatusBar
        translucent
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />

      <Image
        source={isDark ? brand.images.splashBgDark : brand.images.splashBgLight}
        style={styles.fullBg}
        resizeMode="cover"
      />

      <View style={styles.center}>
        <Animated.View style={[styles.brandBlock, brandStyle]}>
          <View style={styles.logoWrap}>
            <BrandLogo tone={isDark ? 'onDark' : 'onLight'} size="hero" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.tagBlock, tagStyle]}>
          <Animated.View style={[styles.ornamentRow, ornamentStyle]}>
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </Animated.View>

          <Text style={isArabic ? styles.taglineAr : styles.taglineEn}>
            {t('splashTagline')}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

export default WaselSplashScreen;
