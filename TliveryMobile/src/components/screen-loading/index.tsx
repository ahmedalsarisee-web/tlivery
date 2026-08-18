import {useEffect, useMemo, useRef, type FC} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import WaselLoader from '@app/components/wasel-loader';
import SkeletonBox from '@app/components/skeleton-box';
import {radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type Props = {
  message?: string;
  /** Push skeleton + loader below the absolute nav header. */
  contentInsetTop?: number;
};

/**
 * Logo loader centered on the content area, with skeleton cards underneath.
 */
const ScreenLoadingPanel: FC<Props> = ({
  message,
  contentInsetTop = 0,
}) => {
  const {theme} = useTheme();
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    drop.setValue(0);
    Animated.timing(drop, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drop]);

  const skeletonStyle = useMemo(
    () => ({
      opacity: drop.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateY: drop.interpolate({
            inputRange: [0, 1],
            outputRange: [-getHeight(18), 0],
          }),
        },
      ],
    }),
    [drop],
  );

  return (
    <View
      style={[styles.root, {backgroundColor: theme.backgrounds.background}]}
      pointerEvents="none"
      accessibilityElementsHidden>
      <View
        style={[
          styles.content,
          {
            paddingTop: contentInsetTop + getHeight(12),
            paddingHorizontal: contentInsetTop > 0 ? getWidth(20) : 0,
          },
        ]}>
        <Animated.View style={[styles.skeletonColumn, skeletonStyle]}>
          <SkeletonBox style={styles.search} borderRadius={radius.lg} />
          <View style={styles.row}>
            <SkeletonBox style={styles.kpi} borderRadius={radius.md} />
            <SkeletonBox style={styles.kpi} borderRadius={radius.md} />
          </View>
          <SkeletonBox style={styles.card} borderRadius={radius.lg} />
          <SkeletonBox style={styles.card} borderRadius={radius.lg} />
          <SkeletonBox style={styles.cardShort} borderRadius={radius.lg} />
          <SkeletonBox style={styles.card} borderRadius={radius.lg} />
        </Animated.View>

        <View style={styles.loaderOverlay}>
          <WaselLoader size="md" message={message} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: getHeight(420),
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  skeletonColumn: {
    flex: 1,
    gap: getHeight(space.sm),
    zIndex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  search: {
    height: getHeight(44),
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: getWidth(space.sm),
  },
  kpi: {
    flex: 1,
    height: getHeight(72),
  },
  card: {
    height: getHeight(88),
    width: '100%',
  },
  cardShort: {
    height: getHeight(64),
    width: '100%',
  },
});

export default ScreenLoadingPanel;
