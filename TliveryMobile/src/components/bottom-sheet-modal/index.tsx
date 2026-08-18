import {useCallback, useEffect, useMemo, useRef, useState, FC} from 'react';
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import {X} from 'lucide-react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useTheme} from '@app/providers/ThemeContext';
import AppText from '@app/components/app-text';
import {BottomSheetModalProps} from '@app/types/bottomSheetModal.props';
import {useBottomSheetModalStyles} from './styles';

const DRAG_CLOSE_PX = 120;
const DRAG_CLOSE_VELOCITY = 900;
const SHEET_CLOSED_Y = 150;
const SHEET_BASE_BOTTOM_PADDING = 24;
const SHEET_DETACHED_BASE_MARGIN_BOTTOM = 16;

const OPEN_SPRING_CONFIG = {
  stiffness: 500,
  damping: 32,
  mass: 0.5,
  overshootClamping: true,
} as const;

const SNAP_SPRING_CONFIG = {
  stiffness: 280,
  damping: 25,
  mass: 0.72,
} as const;

const SheetBottomSafeArea: FC = () => {
  const {bottom} = useSafeAreaInsets();
  if (bottom <= 0) {
    return null;
  }
  return <View style={{height: bottom}} />;
};

const BottomSheetModal: FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  headerTrailing,
  minHeight,
  height,
  children,
  detached = false,
  showHeaderCloseButton = false,
  headerSurface = 'glass',
}) => {
  const styles = useBottomSheetModalStyles(detached, headerSurface);
  const {theme} = useTheme();
  const {height: windowHeight} = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const isClosingRef = useRef(false);
  const openStartedRef = useRef(false);
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_CLOSED_Y);
  const resolvedMinHeight = useMemo(
    () => minHeight ?? Math.round(windowHeight * 0.45),
    [minHeight, windowHeight],
  );

  const finishDismiss = useCallback(
    (notifyParent: boolean) => {
      isClosingRef.current = false;
      openStartedRef.current = false;
      setMounted(false);
      if (notifyParent) {
        onClose();
      }
    },
    [onClose],
  );

  const animateToClosed = useCallback(
    (notifyParent: boolean) => {
      if (isClosingRef.current) {
        return;
      }
      isClosingRef.current = true;
      overlayOpacity.value = withTiming(0, {
        duration: 90,
        easing: Easing.out(Easing.quad),
      });
      sheetTranslateY.value = withTiming(
        SHEET_CLOSED_Y,
        {
          duration: 120,
          easing: Easing.out(Easing.cubic),
        },
        () => {
          runOnJS(finishDismiss)(notifyParent);
        },
      );
    },
    [finishDismiss, overlayOpacity, sheetTranslateY],
  );

  const requestDismiss = useCallback(() => {
    animateToClosed(true);
  }, [animateToClosed]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    if (mounted) {
      animateToClosed(false);
    }
  }, [animateToClosed, mounted, visible]);

  const runOpenAnimation = useCallback(() => {
    if (openStartedRef.current) {
      return;
    }
    openStartedRef.current = true;
    isClosingRef.current = false;
    sheetTranslateY.value = SHEET_CLOSED_Y;
    overlayOpacity.value = 0;
    sheetTranslateY.value = withSpring(0, OPEN_SPRING_CONFIG);
    overlayOpacity.value = withTiming(1, {
      duration: 60,
      easing: Easing.out(Easing.quad),
    });
  }, [overlayOpacity, sheetTranslateY]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !mounted) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestDismiss();
      return true;
    });
    return () => sub.remove();
  }, [mounted, requestDismiss]);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{translateY: sheetTranslateY.value}],
  }));

  const markClosing = useCallback(() => {
    isClosingRef.current = true;
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .failOffsetX([-42, 42])
        .activeOffsetY([-12, 12])
        .onUpdate(e => {
          const ty = Math.max(0, e.translationY);
          sheetTranslateY.value = ty;
          overlayOpacity.value = Math.max(0, 1 - ty / 240);
        })
        .onEnd(e => {
          const ty = Math.max(0, e.translationY);
          if (ty > DRAG_CLOSE_PX || e.velocityY > DRAG_CLOSE_VELOCITY) {
            runOnJS(markClosing)();
            overlayOpacity.value = withTiming(0, {
              duration: 100,
              easing: Easing.out(Easing.quad),
            });
            sheetTranslateY.value = withTiming(
              SHEET_CLOSED_Y,
              {
                duration: 110,
                easing: Easing.out(Easing.cubic),
              },
              finished => {
                if (finished) {
                  runOnJS(finishDismiss)(true);
                }
              },
            );
            return;
          }
          sheetTranslateY.value = withSpring(0, SNAP_SPRING_CONFIG);
          overlayOpacity.value = withTiming(1, {
            duration: 120,
            easing: Easing.out(Easing.quad),
          });
        })
        .onFinalize(() => {
          if (sheetTranslateY.value < 0) {
            sheetTranslateY.value = 0;
            overlayOpacity.value = 1;
          }
        }),
    [finishDismiss, markClosing, overlayOpacity, sheetTranslateY],
  );

  const sheetBaseStyle = useMemo(() => {
    const sheetMax = Math.round(windowHeight * 0.94);
    const sheetMin = Math.min(resolvedMinHeight, sheetMax);
    return [
      styles.sheet,
      detached ? styles.sheetDetached : null,
      {
        minHeight: sheetMin,
        maxHeight: sheetMax,
        paddingBottom: SHEET_BASE_BOTTOM_PADDING,
      },
      detached ? {marginBottom: SHEET_DETACHED_BASE_MARGIN_BOTTOM} : null,
      height ? {height} : null,
    ];
  }, [
    detached,
    height,
    resolvedMinHeight,
    styles.sheet,
    styles.sheetDetached,
    windowHeight,
  ]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      onShow={runOpenAnimation}
      onRequestClose={requestDismiss}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.gestureRoot}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.overlay, styles.overlayAnimated, overlayAnimStyle]}>
              <Pressable style={styles.dismissArea} onPress={requestDismiss} />
              <Animated.View style={[sheetBaseStyle, sheetAnimStyle]}>
                <View style={styles.headerGlass}>
                  <View style={styles.handle} />
                  <View style={styles.headerRow}>
                    <View style={styles.headerWrap}>
                      {title ? (
                        <AppText style={styles.title}>{title}</AppText>
                      ) : null}
                      {subtitle ? (
                        <AppText style={styles.subtitle}>{subtitle}</AppText>
                      ) : null}
                    </View>
                    {headerTrailing}
                    {showHeaderCloseButton ? (
                      <Pressable
                        onPress={requestDismiss}
                        style={({pressed}) => [
                          styles.headerCloseBtn,
                          {opacity: pressed ? 0.65 : 1},
                        ]}
                        accessibilityRole="button"
                        hitSlop={8}>
                        <X
                          color={theme.typography.secondary}
                          size={22}
                          strokeWidth={2.2}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {children}
                <SheetBottomSafeArea />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
};

export default BottomSheetModal;
