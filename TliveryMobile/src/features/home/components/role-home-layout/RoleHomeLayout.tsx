import {type FC, type ReactNode, useMemo} from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Bell, ChevronLeft, ChevronRight, Menu} from 'lucide-react-native';
import VerticalGradientBg from '@app/components/vertical-gradient-bg';
import DoodleBackground from '@app/components/doodle-background';
import ScreenLoadingPanel from '@app/components/screen-loading';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {useBottomSpacing} from '@app/hooks/useBottomSpacing';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useOptionalCustomDrawer} from '@app/navigation/components/custom-drawer-layout';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import {isRTL} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {HOME_HEADER_NAV_HEIGHT} from '../home-header/headerMetrics';
import {roleHomeStyles} from '../../screens/RoleHome.styles';

export type RoleHomeStat = {
  value: string;
  label: string;
  sub: string;
  footer?: ReactNode;
  onPress?: () => void;
};

export type RoleHomeBreakRow = {
  label: string;
  value: string;
  onPress?: () => void;
};

type Props = {
  greeting: string;
  name: string;
  badgeLabel?: string;
  badgeOnline?: boolean;
  onBadgePress?: () => void;
  heroLabel: string;
  heroValue: string;
  onHeroPress: () => void;
  stats: RoleHomeStat[];
  summaryTitle: string;
  summaryLabel: string;
  summaryValue: string;
  sparkHeights: number[];
  breakRows: RoleHomeBreakRow[];
  onViewAll: () => void;
  /** Optional block below summary (e.g. company fleet promo). */
  extraContent?: ReactNode;
  loading?: boolean;
  onRefresh: () => Promise<unknown>;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Role home chrome: sticky gradient nav + greeting + money card.
 * Greeting and money card collapse/fade on scroll; compact nav remains.
 */
const RoleHomeLayout: FC<Props> = ({
  greeting,
  name,
  badgeLabel,
  badgeOnline,
  onBadgePress,
  heroLabel,
  heroValue,
  onHeroPress,
  stats,
  summaryTitle,
  summaryLabel,
  summaryValue,
  sparkHeights,
  breakRows,
  onViewAll,
  extraContent,
  loading,
  onRefresh,
}) => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const insets = useSafeAreaInsets();
  const drawer = useOptionalCustomDrawer();
  const bottomSpacing = useBottomSpacing();
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;

  const styles = useMemo(
    () => roleHomeStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const greetBlockH = getHeight(72);
  const moneyCardBodyH = getHeight(84);
  const stickyBottomPad = getHeight(18);
  const moneyCardSlotH = moneyCardBodyH + stickyBottomPad;
  const navH = getHeight(HOME_HEADER_NAV_HEIGHT);
  const extrasMax =
    greetBlockH + moneyCardSlotH + getHeight(8);
  const stickyMin = insets.top + navH;
  const stickyMax = stickyMin + extrasMax;
  const collapseRange = Math.max(extrasMax, 1);
  const extrasLift = getHeight(24);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const stickyStyle = useAnimatedStyle(() => {
    const extrasH = interpolate(
      scrollY.value,
      [0, collapseRange],
      [extrasMax, 0],
      Extrapolation.CLAMP,
    );
    return {height: stickyMin + extrasH};
  });

  const extrasStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [0, collapseRange],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      height: interpolate(
        progress,
        [0, 1],
        [extrasMax, 0],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(
        progress,
        [0, 0.75],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [0, -extrasLift],
            Extrapolation.CLAMP,
          ),
        },
      ],
      overflow: 'hidden' as const,
    };
  });

  const moneyCardSlotStyle = {
    height: moneyCardSlotH,
    paddingBottom: stickyBottomPad,
  };

  const {refreshing, onRefresh: pullRefresh} = usePullToRefresh({
    onRefresh,
  });

  const gradientColors = (
    themeType === 'dark'
      ? (['#3D3010', theme.brand.gold] as const)
      : (theme.gradient.header as unknown as readonly [string, string])
  );
  const heroFill = gradientColors[0];

  if (loading) {
    return (
      <View style={[styles.root, {backgroundColor: heroFill}]}>
        <StatusBar
          translucent
          barStyle="light-content"
          backgroundColor="transparent"
        />
        <ScreenLoadingPanel contentInsetTop={stickyMin} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DoodleBackground />
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />

      <Animated.ScrollView
        style={styles.scrollFill}
        contentContainerStyle={[
          styles.scroll,
          bottomSpacing,
          {paddingTop: stickyMax + getHeight(8)},
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <AppRefreshControl
            refreshing={refreshing}
            onRefresh={pullRefresh}
            progressViewOffset={stickyMin}
          />
        }>
        <View style={styles.body}>
          {extraContent ? (
            <View style={styles.extraContent}>{extraContent}</View>
          ) : null}

          <View style={styles.statsRow}>
            {stats.map(stat => {
              const content = (
                <>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  {stat.footer ?? null}
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSub}>{stat.sub}</Text>
                </>
              );
              if (stat.onPress) {
                return (
                  <Pressable
                    key={`${stat.label}-${stat.sub}`}
                    accessibilityRole="button"
                    onPress={stat.onPress}
                    style={styles.statCard}>
                    {content}
                  </Pressable>
                );
              }
              return (
                <View key={`${stat.label}-${stat.sub}`} style={styles.statCard}>
                  {content}
                </View>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{summaryTitle}</Text>
            <Pressable accessibilityRole="button" onPress={onViewAll}>
              <Text style={styles.viewAll}>{t('viewAll')}</Text>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryEarnLabel}>{summaryLabel}</Text>
                <Text style={styles.summaryEarnValue}>{summaryValue}</Text>
              </View>
              <View style={styles.sparkWrap}>
                <View style={styles.sparkRow}>
                  {sparkHeights.map((h, i) => (
                    <View
                      key={`spark-${i}`}
                      style={[styles.sparkBar, {height: h}]}
                    />
                  ))}
                </View>
              </View>
            </View>

            {breakRows.map(row => {
              const content = (
                <>
                  <Text style={styles.breakLabel}>{row.label}</Text>
                  <Text style={styles.breakValue}>{row.value}</Text>
                </>
              );
              if (row.onPress) {
                return (
                  <Pressable
                    key={row.label}
                    accessibilityRole="button"
                    onPress={row.onPress}
                    style={styles.breakRow}>
                    {content}
                  </Pressable>
                );
              }
              return (
                <View key={row.label} style={styles.breakRow}>
                  {content}
                </View>
              );
            })}
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.stickyHero, stickyStyle]}>
        <View style={styles.stickyHeroClip}>
          <VerticalGradientBg colors={gradientColors} showDoodle />
          <View style={{paddingTop: insets.top}}>
            <View style={styles.navRow}>
              {drawer ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('openMenu', {defaultValue: 'Menu'})}
                  onPress={() => drawer.openDrawer()}
                  style={[styles.navSlot, styles.navSlotStart]}
                  hitSlop={12}>
                  <Menu size={22} color={theme.base.white} strokeWidth={2.2} />
                </Pressable>
              ) : (
                <View style={styles.navSlot} />
              )}
              <View style={styles.navCenter} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('notifications')}
                onPress={() => navigation.navigate('Notifications')}
                style={[styles.navSlot, styles.navSlotEnd]}
                hitSlop={8}>
                <View style={styles.bellWrap}>
                  <Bell size={22} color={theme.base.white} strokeWidth={1.75} />
                  <View
                    style={[
                      styles.goldBadge,
                      rtl ? {left: getWidth(2)} : {right: getWidth(2)},
                    ]}
                  />
                </View>
              </Pressable>
            </View>

            <Animated.View style={extrasStyle}>
              <View style={styles.heroBand}>
                <View style={styles.greetRow}>
                  <View style={styles.greetCol}>
                    <Text style={styles.greetHello}>{greeting}</Text>
                    <Text style={styles.greetName} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                  {badgeLabel ? (
                    <Pressable
                      accessibilityRole={onBadgePress ? 'button' : 'text'}
                      disabled={!onBadgePress}
                      onPress={onBadgePress}
                      style={styles.onlinePill}>
                      {badgeOnline != null ? (
                        <View
                          style={[
                            styles.onlineDot,
                            !badgeOnline && styles.offlineDot,
                          ]}
                        />
                      ) : null}
                      <Text style={styles.onlineText}>{badgeLabel}</Text>
                      {onBadgePress ? (
                        <Chevron size={14} color={theme.base.white} />
                      ) : null}
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={moneyCardSlotStyle}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={heroLabel}
                  onPress={onHeroPress}
                  style={styles.earningsCardInNav}>
                  <View style={styles.earningsCol}>
                    <Text style={styles.earningsLabel} numberOfLines={1}>
                      {heroLabel}
                    </Text>
                    <Text style={styles.earningsValue} numberOfLines={1}>
                      {heroValue}
                    </Text>
                  </View>
                  <View style={styles.earningsBtn}>
                    <Chevron size={20} color="#0F172A" strokeWidth={2.6} />
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default RoleHomeLayout;
