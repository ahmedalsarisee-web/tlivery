import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import {radius} from '@app/theme/tokens';
import {navigationRef} from '@app/navigation/RootNavigation';
import {registerCustomDrawerCloseImmediate} from '@app/navigation/customDrawerControl';

const DRAWER_EDGE_RADIUS = radius.xl;

type CustomDrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
  closeDrawerImmediate: () => void;
  toggleDrawer: () => void;
  isOpenRef: React.MutableRefObject<boolean>;
  drawerStatus: 'open' | 'closed';
  setDrawerGesturesEnabled: (enabled: boolean) => void;
};

const CustomDrawerContext = createContext<CustomDrawerContextValue | null>(
  null,
);

export type CustomDrawerLayoutRef = {
  openDrawer: () => void;
  closeDrawer: () => void;
  closeDrawerImmediate: () => void;
  toggleDrawer: () => void;
};

type Props = {
  children: React.ReactNode;
  drawerContent: React.ReactNode;
};

const DRAG_OPEN_THRESHOLD = 0.33;
const FAST_SWIPE_VELOCITY = 520;
const OVERLAY_MAX_OPACITY = 0.3;
const DRAWER_OPEN_PROGRESS_THRESHOLD = 0.02;

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 460,
  mass: 0.55,
  overshootClamping: true,
};

function snapProgressToTarget(
  progress: SharedValue<number>,
  target: 0 | 1,
): void {
  'worklet';
  progress.value = withSpring(target, SPRING_CONFIG, finished => {
    if (finished) {
      progress.value = target;
    }
  });
}

export function useCustomDrawer(): CustomDrawerContextValue {
  const context = useContext(CustomDrawerContext);
  if (!context) {
    throw new Error('useCustomDrawer must be used within CustomDrawerLayout');
  }
  return context;
}

export function useOptionalCustomDrawer(): CustomDrawerContextValue | null {
  return useContext(CustomDrawerContext);
}

export const CustomDrawerLayout = memo(
  React.forwardRef<CustomDrawerLayoutRef, Props>(
    function CustomDrawerLayout({children, drawerContent}, ref) {
      const {theme} = useTheme();
      const {direction} = useLanguage();
      const rtl = isRTL(direction);
      const {width} = useWindowDimensions();
      const drawerWidth = Math.min(Math.max(width * 0.8, 280), 340);
      const edgeCaptureWidth = Math.max(
        40,
        Math.min(72, Math.round(width * 0.14)),
      );
      const sideSign = rtl ? -1 : 1;

      const progress = useSharedValue(0);
      const dragStartProgress = useSharedValue(0);
      const dragAccepted = useSharedValue(false);
      const gestureEpoch = useSharedValue(0);
      const activeGestureEpoch = useSharedValue(-1);
      const drawerGesturesEnabledSv = useSharedValue(1);
      const isOpenRef = useRef(false);
      const visuallyOpenRef = useRef(false);
      const drawerGesturesEnabledRef = useRef(true);
      const [visuallyOpen, setVisuallyOpen] = React.useState(false);
      const [suppressDrawerMotion, setSuppressDrawerMotion] =
        React.useState(false);

      const drawerStatus: 'open' | 'closed' = visuallyOpen ? 'open' : 'closed';

      const syncOpenFromProgress = useCallback((open: boolean) => {
        isOpenRef.current = open;
        visuallyOpenRef.current = open;
        setVisuallyOpen(open);
      }, []);

      // Invalidate in-flight pans and clear progress on JS first, then UI.
      // Prevents progress-high + visuallyOpen-false after hardReset.
      const forceProgressClosed = useCallback(() => {
        gestureEpoch.value = gestureEpoch.value + 1;
        dragAccepted.value = false;
        cancelAnimation(progress);
        progress.value = 0;
        runOnUI(() => {
          'worklet';
          gestureEpoch.value = gestureEpoch.value + 1;
          dragAccepted.value = false;
          cancelAnimation(progress);
          progress.value = 0;
        })();
      }, [dragAccepted, gestureEpoch, progress]);

      const repairDesyncIfNeeded = useCallback(
        (progressSample: number) => {
          const openByProgress =
            progressSample > DRAWER_OPEN_PROGRESS_THRESHOLD;
          if (openByProgress === visuallyOpenRef.current) {
            return;
          }
          if (openByProgress && !visuallyOpenRef.current) {
            forceProgressClosed();
            syncOpenFromProgress(false);
          } else if (!openByProgress && visuallyOpenRef.current) {
            syncOpenFromProgress(false);
          }
        },
        [forceProgressClosed, syncOpenFromProgress],
      );

      const sampleProgressForDesyncCheck = useCallback(() => {
        runOnUI(() => {
          'worklet';
          runOnJS(repairDesyncIfNeeded)(progress.value);
        })();
      }, [progress, repairDesyncIfNeeded]);

      const hardResetDrawerClosed = useCallback(() => {
        forceProgressClosed();
        syncOpenFromProgress(false);
        requestAnimationFrame(() => {
          sampleProgressForDesyncCheck();
        });
        setTimeout(() => {
          sampleProgressForDesyncCheck();
        }, 100);
        setTimeout(() => {
          sampleProgressForDesyncCheck();
        }, 350);
      }, [
        forceProgressClosed,
        sampleProgressForDesyncCheck,
        syncOpenFromProgress,
      ]);

      const closeDrawer = useCallback(() => {
        cancelAnimation(progress);
        runOnUI(snapProgressToTarget)(progress, 0);
      }, [progress]);

      const closeDrawerImmediate = useCallback(() => {
        hardResetDrawerClosed();
      }, [hardResetDrawerClosed]);

      const setDrawerGesturesEnabled = useCallback(
        (enabled: boolean) => {
          drawerGesturesEnabledRef.current = enabled;
          drawerGesturesEnabledSv.value = enabled ? 1 : 0;
          if (!enabled && isOpenRef.current) {
            hardResetDrawerClosed();
          }
        },
        [drawerGesturesEnabledSv, hardResetDrawerClosed],
      );

      const openDrawer = useCallback(() => {
        if (!drawerGesturesEnabledRef.current) {
          return;
        }
        cancelAnimation(progress);
        runOnUI(snapProgressToTarget)(progress, 1);
      }, [progress]);

      const toggleDrawer = useCallback(() => {
        if (!drawerGesturesEnabledRef.current) {
          return;
        }
        if (isOpenRef.current) {
          closeDrawer();
        } else {
          openDrawer();
        }
      }, [closeDrawer, openDrawer]);

      useImperativeHandle(
        ref,
        () => ({
          openDrawer,
          closeDrawer,
          closeDrawerImmediate,
          toggleDrawer,
        }),
        [openDrawer, closeDrawer, closeDrawerImmediate, toggleDrawer],
      );

      useAnimatedReaction(
        () => progress.value > DRAWER_OPEN_PROGRESS_THRESHOLD,
        (isOpen, previous) => {
          'worklet';
          if (isOpen !== previous) {
            runOnJS(syncOpenFromProgress)(isOpen);
          }
        },
      );

      useEffect(() => {
        const id = setInterval(() => {
          sampleProgressForDesyncCheck();
        }, 1000);
        return () => clearInterval(id);
      }, [sampleProgressForDesyncCheck]);

      useEffect(() => {
        registerCustomDrawerCloseImmediate(closeDrawerImmediate);
        return () => registerCustomDrawerCloseImmediate(null);
      }, [closeDrawerImmediate]);

      useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
          if (!isOpenRef.current) {
            return false;
          }
          hardResetDrawerClosed();
          return true;
        });
        return () => sub.remove();
      }, [hardResetDrawerClosed]);

      useEffect(() => {
        hardResetDrawerClosed();
        setSuppressDrawerMotion(true);
        const frame = requestAnimationFrame(() => {
          setSuppressDrawerMotion(false);
        });
        return () => cancelAnimationFrame(frame);
      }, [hardResetDrawerClosed, rtl]);

      useEffect(() => {
        const sub = AppState.addEventListener('change', nextState => {
          if (nextState === 'active') {
            hardResetDrawerClosed();
          }
        });
        return () => sub.remove();
      }, [hardResetDrawerClosed]);

      useEffect(() => {
        if (!navigationRef.isReady()) {
          return;
        }
        return navigationRef.addListener('state', () => {
          hardResetDrawerClosed();
        });
      }, [hardResetDrawerClosed]);

      const mainPanGesture = Gesture.Pan()
        .enabled(true)
        .activeOffsetX([-14, 14])
        .failOffsetY([-10, 10])
        .onBegin(event => {
          'worklet';
          if (drawerGesturesEnabledSv.value < 0.5) {
            dragAccepted.value = false;
            return;
          }
          const x = event.x;
          const nearEdge = rtl
            ? x >= width - edgeCaptureWidth
            : x <= edgeCaptureWidth;
          dragAccepted.value =
            progress.value > DRAWER_OPEN_PROGRESS_THRESHOLD || nearEdge;
          activeGestureEpoch.value = gestureEpoch.value;
          dragStartProgress.value = progress.value;
        })
        .onUpdate(event => {
          'worklet';
          if (
            !dragAccepted.value ||
            activeGestureEpoch.value !== gestureEpoch.value
          ) {
            dragAccepted.value = false;
            return;
          }
          const delta = sideSign * event.translationX;
          const next = dragStartProgress.value + delta / drawerWidth;
          progress.value = Math.max(0, Math.min(1, next));
        })
        .onEnd(event => {
          'worklet';
          if (
            !dragAccepted.value ||
            activeGestureEpoch.value !== gestureEpoch.value
          ) {
            return;
          }
          const projectedVelocity = sideSign * event.velocityX;
          const fastOpen = projectedVelocity > FAST_SWIPE_VELOCITY;
          const fastClose = projectedVelocity < -FAST_SWIPE_VELOCITY;
          const shouldOpen =
            fastOpen ||
            (!fastClose && progress.value > DRAG_OPEN_THRESHOLD);
          snapProgressToTarget(progress, shouldOpen ? 1 : 0);
        })
        .onFinalize(() => {
          'worklet';
          dragAccepted.value = false;
        });

      const drawerPanelPanGesture = Gesture.Pan()
        .enabled(true)
        .activeOffsetX([-10, 10])
        .onBegin(() => {
          'worklet';
          if (drawerGesturesEnabledSv.value < 0.5) {
            dragAccepted.value = false;
            return;
          }
          dragAccepted.value =
            progress.value > DRAWER_OPEN_PROGRESS_THRESHOLD;
          activeGestureEpoch.value = gestureEpoch.value;
          dragStartProgress.value = progress.value;
        })
        .onUpdate(event => {
          'worklet';
          if (
            !dragAccepted.value ||
            activeGestureEpoch.value !== gestureEpoch.value
          ) {
            dragAccepted.value = false;
            return;
          }
          const delta = sideSign * event.translationX;
          const next = dragStartProgress.value + delta / drawerWidth;
          progress.value = Math.max(0, Math.min(1, next));
        })
        .onEnd(event => {
          'worklet';
          if (
            !dragAccepted.value ||
            activeGestureEpoch.value !== gestureEpoch.value
          ) {
            return;
          }
          const projectedVelocity = sideSign * event.velocityX;
          const fastOpen = projectedVelocity > FAST_SWIPE_VELOCITY;
          const fastClose = projectedVelocity < -FAST_SWIPE_VELOCITY;
          const shouldOpen =
            fastOpen ||
            (!fastClose && progress.value > DRAG_OPEN_THRESHOLD);
          snapProgressToTarget(progress, shouldOpen ? 1 : 0);
        })
        .onFinalize(() => {
          'worklet';
          dragAccepted.value = false;
        });

      const drawerAnimatedStyle = useAnimatedStyle(() => {
        const translateX =
          sideSign *
          interpolate(
            progress.value,
            [0, 1],
            [-drawerWidth, 0],
            Extrapolation.CLAMP,
          );
        return {transform: [{translateX}]};
      });

      const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity:
          progress.value > 0 ? progress.value * OVERLAY_MAX_OPACITY : 0,
      }));

      const contextValue = useMemo(
        () => ({
          openDrawer,
          closeDrawer,
          closeDrawerImmediate,
          toggleDrawer,
          isOpenRef,
          drawerStatus,
          setDrawerGesturesEnabled,
        }),
        [
          openDrawer,
          closeDrawer,
          closeDrawerImmediate,
          toggleDrawer,
          drawerStatus,
          setDrawerGesturesEnabled,
        ],
      );

      const overlayPressAreaStyle = useMemo(
        () => ({
          position: 'absolute' as const,
          top: 0,
          bottom: 0,
          left: rtl ? 0 : drawerWidth,
          right: rtl ? drawerWidth : 0,
          zIndex: 30,
          elevation: 24,
        }),
        [drawerWidth, rtl],
      );

      return (
        <CustomDrawerContext.Provider value={contextValue}>
          <View style={styles.root}>
            <GestureDetector gesture={drawerPanelPanGesture}>
              <Animated.View
                style={[
                  styles.drawerContainer,
                  {
                    width: drawerWidth,
                    backgroundColor: theme.backgrounds.surface,
                    left: rtl ? undefined : 0,
                    right: rtl ? 0 : undefined,
                    borderTopRightRadius: rtl ? 0 : DRAWER_EDGE_RADIUS,
                    borderBottomRightRadius: rtl ? 0 : DRAWER_EDGE_RADIUS,
                    borderTopLeftRadius: rtl ? DRAWER_EDGE_RADIUS : 0,
                    borderBottomLeftRadius: rtl ? DRAWER_EDGE_RADIUS : 0,
                    opacity: suppressDrawerMotion ? 0 : 1,
                  },
                  drawerAnimatedStyle,
                ]}
                pointerEvents={visuallyOpen ? 'auto' : 'none'}>
                {drawerContent}
              </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={mainPanGesture}>
              <Animated.View
                style={styles.mainContainer}
                pointerEvents={visuallyOpen ? 'none' : 'auto'}>
                {children}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {backgroundColor: '#000'},
                    overlayAnimatedStyle,
                  ]}
                />
              </Animated.View>
            </GestureDetector>

            <Pressable
              style={overlayPressAreaStyle}
              pointerEvents={visuallyOpen ? 'auto' : 'none'}
              onPress={closeDrawerImmediate}
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
            />
          </View>
        </CustomDrawerContext.Provider>
      );
    },
  ),
);

const styles = StyleSheet.create({
  root: {flex: 1},
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 28,
    overflow: 'hidden',
  },
  mainContainer: {
    flex: 1,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 8,
  },
});
