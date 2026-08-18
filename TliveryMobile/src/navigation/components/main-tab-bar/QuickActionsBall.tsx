import {useId, useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {ClipboardCheck, Plus, Truck} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import type {UserRole} from '@app/types/user';
import {TAB_FAB_SIZE} from './styles';

type QuickActionsBallProps = {
  onPress: () => void;
  role: UserRole | null;
  wrapStyle: StyleProp<ViewStyle>;
  circleStyle: StyleProp<ViewStyle>;
  pressedStyle: StyleProp<ViewStyle>;
  innerStyle: StyleProp<ViewStyle>;
};

const QuickActionsBall: FC<QuickActionsBallProps> = ({
  onPress,
  role,
  wrapStyle,
  circleStyle,
  pressedStyle,
  innerStyle,
}) => {
  const {theme, themeType} = useTheme();
  const gradId = useId().replace(/:/g, '');
  const isDark = themeType === 'dark';

  const colors = useMemo(() => {
    if (isDark) {
      return [theme.brand.gold, '#E8C96A'] as const;
    }
    return [theme.brand.navy, '#1E3A5F'] as const;
  }, [isDark, theme.brand.gold, theme.brand.navy]);

  const iconColor = isDark ? theme.brand.navy : theme.typography.inverse;

  const glyph = useMemo(() => {
    if (role === 'company_admin' || role === 'company_employee') {
      return <ClipboardCheck color={iconColor} size={24} strokeWidth={2.5} />;
    }
    if (role === 'driver') {
      return <Truck color={iconColor} size={24} strokeWidth={2.5} />;
    }
    return <Plus color={iconColor} size={26} strokeWidth={2.5} />;
  }, [iconColor, role]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quick actions"
      onPress={onPress}
      style={wrapStyle}
      hitSlop={8}>
      {({pressed}) => (
        <View style={[circleStyle, pressed && pressedStyle]}>
          <Svg
            width={TAB_FAB_SIZE}
            height={TAB_FAB_SIZE}
            style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors[0]} />
                <Stop offset="100%" stopColor={colors[1]} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={TAB_FAB_SIZE}
              height={TAB_FAB_SIZE}
              fill={`url(#${gradId})`}
            />
          </Svg>
          <View style={innerStyle}>{glyph}</View>
        </View>
      )}
    </Pressable>
  );
};

export default QuickActionsBall;
