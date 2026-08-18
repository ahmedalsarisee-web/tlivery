import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {Search, X} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  getFlexDirection,
  getTextAlign,
} from '@app/utils/directionalStyles';
import {control, elevation, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

const SearchBar: FC<SearchBarProps> = ({value, onChangeText, placeholder}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(space.xs),
          minHeight: getHeight(40),
          paddingHorizontal: getWidth(space.sm),
          borderWidth: 1,
          borderColor: isDark ? theme.ui.border : theme.ui.borderLight,
          borderRadius: radius.lg,
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.04)'
            : theme.backgrounds.surface,
          ...elevation.card,
          shadowOpacity: isDark ? 0.2 : 0.04,
          elevation: isDark ? 2 : 1,
        },
        input: {
          flex: 1,
          height: getHeight(40),
          color: theme.typography.primary,
          fontSize: fontSize.body,
          textAlign: getTextAlign(direction),
          ...cairoFont('medium'),
          paddingVertical: 0,
        },
        clear: {
          minWidth: getWidth(28),
          minHeight: getHeight(28),
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [direction, isDark, theme],
  );

  return (
    <View style={styles.wrap}>
      <Search size={18} color={theme.typography.secondary} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.typography.caption}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChangeText('')}
          style={styles.clear}
          hitSlop={8}>
          <X size={16} color={theme.typography.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
};

export default SearchBar;
