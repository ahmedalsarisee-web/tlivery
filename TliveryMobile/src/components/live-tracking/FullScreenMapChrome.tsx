import {type FC, type ReactNode, useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ArrowRight} from 'lucide-react-native';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import {isRTL} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {radius, space} from '@app/theme/tokens';
import {mapAccent} from './mapTheme';

type Props = {
  map: ReactNode;
  /** Optional top phase/status chip overlaid on the map. */
  phaseChip?: ReactNode;
  /** Bottom sheet body — caller owns all content. */
  sheetContent: ReactNode;
};

/**
 * Edge-to-edge map chrome: floating back + bottom sheet.
 * Positions the back control with explicit left/right (app RTL is not
 * I18nManager-forced, so `start` alone does not flip in Arabic).
 */
const FullScreenMapChrome: FC<Props> = ({map, phaseChip, sheetContent}) => {
  const navigation = useNavigation();
  const {direction} = useLanguage();
  const {theme, themeType} = useTheme();
  const insets = useSafeAreaInsets();
  const rtl = isRTL(direction);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : mapAccent.forest;
  const edge = getWidth(space.md);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: isDark
            ? mapAccent.mapCanvasDark
            : mapAccent.mapCanvas,
        },
        mapLayer: {
          flex: 1,
        },
        backBtn: {
          position: 'absolute',
          top: insets.top + getHeight(10),
          ...(rtl ? {right: edge} : {left: edge}),
          width: getWidth(40),
          height: getWidth(40),
          borderRadius: getWidth(20),
          backgroundColor: theme.backgrounds.surface,
          borderWidth: 1,
          borderColor: theme.ui.border,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          elevation: 5,
        },
        phaseWrap: {
          position: 'absolute',
          top: insets.top + getHeight(10),
          ...(rtl
            ? {left: edge, right: getWidth(56)}
            : {right: edge, left: getWidth(56)}),
          zIndex: 4,
        },
        sheet: {
          position: 'absolute',
          start: getWidth(space.sm),
          end: getWidth(space.sm),
          bottom: Math.max(insets.bottom, getHeight(space.sm)),
          paddingTop: getHeight(8),
          paddingHorizontal: getWidth(space.md),
          paddingBottom: getHeight(10),
          borderRadius: radius.lg,
          backgroundColor: theme.backgrounds.surface,
          borderWidth: 1,
          borderColor: theme.ui.border,
          gap: getHeight(8),
          zIndex: 3,
          elevation: 8,
        },
        handle: {
          alignSelf: 'center',
          width: getWidth(36),
          height: 3,
          borderRadius: 2,
          backgroundColor: theme.ui.border,
        },
      }),
    [insets.top, insets.bottom, rtl, edge, theme, isDark],
  );

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer}>{map}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={8}>
        <BackIcon size={20} color={accent} strokeWidth={2.4} />
      </Pressable>
      {phaseChip ? (
        <View style={styles.phaseWrap} pointerEvents="box-none">
          {phaseChip}
        </View>
      ) : null}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {sheetContent}
      </View>
    </View>
  );
};

export default FullScreenMapChrome;
