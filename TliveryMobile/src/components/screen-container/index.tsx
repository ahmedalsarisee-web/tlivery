import {useCallback, useMemo, useRef, type FC, type ReactElement} from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {useTheme} from '@app/providers/ThemeContext';
import {useBottomSpacing} from '@app/hooks/useBottomSpacing';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useApiLoadingOverlayVisible} from '@app/utils/apiLoadingVisibility';
import {getHeight} from '@app/utils/responsive-design';
import {ScreenContainerProps} from '@app/types/screenContainer.props';
import HomeHeader from '@app/features/home/components/home-header';
import {HOME_HEADER_NAV_HEIGHT} from '@app/features/home/components/home-header/headerMetrics';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import ScreenLoadingPanel from '@app/components/screen-loading';
import DoodleBackground from '@app/components/doodle-background';
import {screenContainerStyles} from './styles';

const KEYBOARD_AWARE_BOTTOM_OFFSET = 24;

const ScreenContainer: FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  padded = true,
  bottomInset = true,
  keyboardAvoiding = false,
  keyboardBottomOffset = KEYBOARD_AWARE_BOTTOM_OFFSET,
  withNavHeader = true,
  navVariant = 'page',
  navTitle,
  showBack,
  onBackPress,
  navShowLogo = true,
  edges,
  pullToRefresh,
  refreshControl,
  refreshing = false,
  loading = false,
  trackApiLoading = true,
  showDoodle = true,
  style,
  contentContainerStyle,
}) => {
  const {theme, themeType} = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const apiLoading = useApiLoadingOverlayVisible();
  const styles = useMemo(
    () => screenContainerStyles(theme, themeType),
    [theme, themeType],
  );
  const bottomSpacing = useBottomSpacing();

  const headerTopInset = withNavHeader
    ? insets.top + getHeight(HOME_HEADER_NAV_HEIGHT) + getHeight(6)
    : 0;

  const pullOnRefreshRef = useRef(pullToRefresh?.onRefresh);
  pullOnRefreshRef.current = pullToRefresh?.onRefresh;
  const stablePullOnRefresh = useCallback(async () => {
    await pullOnRefreshRef.current?.();
  }, []);

  const {refreshing: pullRefreshing, onRefresh: pullOnRefresh} =
    usePullToRefresh({
      enabled: scrollable && Boolean(pullToRefresh),
      onRefresh: stablePullOnRefresh,
    });

  const isPullRefreshing = pullRefreshing || refreshing;

  // Logo + skeleton: first load only. Pull-to-refresh keeps its own spinner.
  const showLoading =
    !isPullRefreshing &&
    (loading || (trackApiLoading && isFocused && apiLoading));

  const resolvedProgressOffset =
    pullToRefresh?.progressViewOffset ??
    (withNavHeader ? headerTopInset : 0);

  const resolvedRefreshControl =
    pullToRefresh && scrollable ? (
      <AppRefreshControl
        refreshing={pullRefreshing}
        onRefresh={pullOnRefresh}
        progressViewOffset={resolvedProgressOffset}
      />
    ) : (
      refreshControl
    );

  const statusBar = (
    <StatusBar
      translucent
      barStyle={
        withNavHeader || themeType === 'dark'
          ? 'light-content'
          : 'dark-content'
      }
      backgroundColor="transparent"
    />
  );

  const contentStyle: StyleProp<ViewStyle> = [
    padded && styles.padded,
    bottomInset && bottomSpacing,
    // FlatList screens own chrome insets via contentContainerStyle so content
    // can scroll under the absolute header / floating tab bar.
    withNavHeader && (scrollable || padded) && {paddingTop: headerTopInset},
    (pullToRefresh && scrollable) || showLoading ? {flexGrow: 1} : null,
    contentContainerStyle,
  ];

  const keyboardVerticalOffset =
    Platform.OS === 'ios' && withNavHeader ? headerTopInset : 0;

  const loadingNeedsOwnInset = withNavHeader && !(scrollable || padded);

  const bodyChildren = showLoading ? (
    <ScreenLoadingPanel
      contentInsetTop={loadingNeedsOwnInset ? headerTopInset : 0}
    />
  ) : (
    children
  );

  const layerStyle = showDoodle
    ? ([styles.container, styles.transparent, style] as StyleProp<ViewStyle>)
    : ([styles.container, style] as StyleProp<ViewStyle>);

  let content: ReactElement;

  if (scrollable) {
    const scrollProps = {
      style: layerStyle,
      contentContainerStyle: contentStyle,
      keyboardShouldPersistTaps: 'handled' as const,
      keyboardDismissMode: 'on-drag' as const,
      refreshControl: showLoading ? undefined : resolvedRefreshControl,
      showsVerticalScrollIndicator: false,
      scrollEnabled: !showLoading,
    };

    content = keyboardAvoiding ? (
      <KeyboardAwareScrollView
        bottomOffset={keyboardBottomOffset}
        {...scrollProps}>
        {bodyChildren}
      </KeyboardAwareScrollView>
    ) : (
      <ScrollView {...scrollProps}>{bodyChildren}</ScrollView>
    );
  } else {
    const body = (
      <View style={[layerStyle, contentStyle]}>{bodyChildren}</View>
    );
    content = keyboardAvoiding ? (
      <KeyboardAvoidingView
        style={[styles.container, showDoodle && styles.transparent]}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}>
        {body}
      </KeyboardAvoidingView>
    ) : (
      body
    );
  }

  if (edges?.length && !withNavHeader) {
    content = (
      <SafeAreaView
        style={[styles.container, showDoodle && styles.transparent]}
        edges={edges}>
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {showDoodle ? <DoodleBackground /> : null}
      {statusBar}
      {content}
      {withNavHeader ? (
        <HomeHeader
          variant={navVariant}
          title={navTitle}
          showBack={showBack}
          showLogo={navShowLogo}
          onBackPress={onBackPress}
        />
      ) : null}
    </View>
  );
};

export default ScreenContainer;
