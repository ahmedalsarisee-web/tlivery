import {useCallback, useId, useMemo, useRef, useState, FC} from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import {storage} from '@app/store/mmkv';
import {StorageKeys} from '@app/store/StorageKeys';
import {RootStackParamList} from '@app/types/navigation';
import AppButton from '@app/components/app-button';
import DoodleBackground from '@app/components/doodle-background';
import {ONBOARDING_SLIDES, OnboardingSlide} from '../data/slides';
import {onboardingStyles} from './Onboarding.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const markDone = () => {
  storage.set(StorageKeys.ONBOARDING_DONE, true);
};

const BottomScrim: FC<{color: string}> = ({color}) => {
  const gradId = `obScrim${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View style={scrimStyles.fill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="0.35" stopColor={color} stopOpacity="0.75" />
            <Stop offset="0.7" stopColor={color} stopOpacity="0.96" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
};

const scrimStyles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    top: '45%',
  },
});

const OnboardingScreen: FC = () => {
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const artHeight = Math.min(
    height,
    Math.round((width * 16) / 9) + insets.top,
  );
  const styles = useMemo(
    () => onboardingStyles(theme, direction),
    [theme, direction],
  );

  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const lastIndex = ONBOARDING_SLIDES.length - 1;
  const isLast = index >= lastIndex;
  const activeSlide = ONBOARDING_SLIDES[index] ?? ONBOARDING_SLIDES[0];

  const finish = useCallback(() => {
    markDone();
    navigation.replace('Login');
  }, [navigation]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({index: next, animated: true});
    setIndex(next);
  }, [finish, index, isLast]);

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Inverted (RTL) lists report a negative contentOffset on iOS.
      const x = Math.abs(e.nativeEvent.contentOffset.x);
      const page = Math.round(x / Math.max(width, 1));
      if (page >= 0 && page <= lastIndex) {
        setIndex(page);
      }
    },
    [lastIndex, width],
  );

  const renderItem = useCallback(
    ({item}: {item: OnboardingSlide}) => (
      <View
        style={[
          styles.slide,
          {width, height},
          // `inverted` mirrors the list; flip each cell back so art stays normal.
          rtl && styles.slideRtlUnmirror,
        ]}>
        <View style={[styles.artClip, {width, height: artHeight}]}>
          <Image
            source={isDark ? item.imageDark : item.imageLight}
            style={styles.artImage}
            resizeMode="cover"
          />
        </View>
      </View>
    ),
    [artHeight, height, isDark, rtl, styles, width],
  );

  return (
    <View style={styles.root}>
      <DoodleBackground />
      <StatusBar
        translucent
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />

      <FlatList
        key={rtl ? 'onboarding-rtl' : 'onboarding-ltr'}
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        inverted={rtl}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        extraData={`${themeType}-${rtl}`}
        style={styles.list}
      />

      <BottomScrim color={theme.backgrounds.background} />

      <View style={[styles.topBar, {paddingTop: insets.top}]}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>{t('onboardingSkip')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <View
        style={[
          styles.bottomPanel,
          {paddingBottom: Math.max(insets.bottom, 8)},
        ]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{t(activeSlide.titleKey)}</Text>
          <Text style={styles.body}>{t(activeSlide.bodyKey)}</Text>
        </View>
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <AppButton
            title={isLast ? t('onboardingStart') : t('onboardingNext')}
            onPress={goNext}
          />
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
