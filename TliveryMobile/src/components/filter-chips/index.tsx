import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {fontSize, radius} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type FilterChipItem = {
  value: string;
  label: string;
  /** Optional count badge, e.g. Waiting (4). */
  count?: number;
};

type FilterChipsProps = {
  options: FilterChipItem[];
  value: string;
  onChange: (value: string) => void;
};

const FilterChips: FC<FilterChipsProps> = ({options, value, onChange}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';

  const styles = useMemo(() => {
    const inactiveBg = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
    const inactiveBorder = isDark ? 'rgba(255,255,255,0.14)' : '#CBD5E1';
    const activeBg = isDark ? theme.brand.gold : theme.brand.navy;
    const activeFg = isDark ? theme.brand.navy : theme.typography.inverse;
    const countInactiveBg = isDark
      ? 'rgba(255,255,255,0.16)'
      : 'rgba(15,23,42,0.10)';
    const countActiveBg = isDark
      ? 'rgba(15,23,42,0.20)'
      : 'rgba(255,255,255,0.22)';
    const inactiveLabel = isDark
      ? theme.typography.primary
      : theme.typography.secondary;

    return StyleSheet.create({
      wrap: {
        flexDirection: getFlexDirection(direction),
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: getWidth(6),
        rowGap: getHeight(6),
      },
      chip: {
        minHeight: getHeight(26),
        paddingStart: getWidth(10),
        paddingEnd: getWidth(8),
        paddingVertical: getHeight(2),
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: inactiveBorder,
        backgroundColor: inactiveBg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: getFlexDirection(direction),
        gap: getWidth(5),
      },
      chipActive: {
        backgroundColor: activeBg,
        borderColor: activeBg,
      },
      label: {
        fontSize: fontSize.caption,
        color: inactiveLabel,
        ...cairoFont('bold'),
      },
      labelActive: {
        color: activeFg,
      },
      count: {
        minWidth: getWidth(16),
        height: getWidth(16),
        paddingHorizontal: getWidth(4),
        borderRadius: radius.pill,
        backgroundColor: countInactiveBg,
        alignItems: 'center',
        justifyContent: 'center',
      },
      countActive: {
        backgroundColor: countActiveBg,
      },
      countText: {
        fontSize: 9,
        color: theme.typography.secondary,
        ...cairoFont('bold'),
      },
      countTextActive: {
        color: activeFg,
      },
    });
  }, [direction, isDark, theme]);

  return (
    <View style={styles.wrap}>
      {options.map(option => {
        const active = option.value === value;
        const showCount =
          typeof option.count === 'number' && option.count > 0;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}>
            <AppText style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </AppText>
            {showCount ? (
              <View style={[styles.count, active && styles.countActive]}>
                <AppText
                  style={[
                    styles.countText,
                    active && styles.countTextActive,
                  ]}>
                  {option.count}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

export default FilterChips;
