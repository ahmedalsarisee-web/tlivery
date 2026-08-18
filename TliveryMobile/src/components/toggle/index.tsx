import {useEffect, useMemo, FC} from "react";
import {Pressable} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {useTheme} from "@app/providers/ThemeContext";
import {useLanguage} from "@app/providers/LangContext";
import {getScaleX} from "@app/utils/directionalStyles";
import {ToggleProps} from "@app/types/toggle.props";
import {toggleStyles, TRAVEL} from "./styles";

const Toggle: FC<ToggleProps> = ({value, onValueChange, disabled = false}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(() => toggleStyles(theme), [theme]);

  const progress = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {duration: 180});
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.ui.border, theme.primary],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * TRAVEL}],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value, disabled}}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[getScaleX(direction), disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export default Toggle;
