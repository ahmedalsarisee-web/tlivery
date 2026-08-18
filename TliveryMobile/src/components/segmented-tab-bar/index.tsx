import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import AppText from '@app/components/app-text';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type SegmentedTabOption<K extends string> = {
  key: K;
  label: string;
};

type Props<K extends string> = {
  activeKey: K;
  onChange: (key: K) => void;
  tabs: SegmentedTabOption<K>[];
  /** No track/card background around the options. */
  plain?: boolean;
};

function SegmentedTabBarInner<K extends string>({
  activeKey,
  onChange,
  tabs,
  plain = false,
}: Props<K>) {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => createStyles(theme, rtl, isDark, plain),
    [theme, rtl, isDark, plain],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {tabs.map(opt => {
          const active = activeKey === opt.key;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="tab"
              accessibilityState={{selected: active}}
              onPress={() => onChange(opt.key)}
              style={[styles.btn, active && styles.btnActive]}>
              <AppText
                numberOfLines={1}
                style={[styles.label, active && styles.labelActive]}>
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (
  theme: ReturnType<typeof useTheme>['theme'],
  rtl: boolean,
  isDark: boolean,
  plain: boolean,
) =>
  StyleSheet.create({
    wrap: {
      padding: plain ? 0 : getWidth(4),
      borderRadius: radius.pill,
      backgroundColor: plain
        ? 'transparent'
        : isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(15,23,42,0.06)',
    },
    track: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: getWidth(space.xs),
    },
    btn: {
      flex: 1,
      minHeight: getHeight(44),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: getWidth(space.xs),
    },
    btnActive: {
      backgroundColor: isDark ? theme.brand.gold : theme.brand.navy,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 10,
      shadowOffset: {width: 0, height: 4},
      elevation: 2,
    },
    label: {
      fontSize: fontSize.body,
      color: theme.typography.secondary,
      textAlign: 'center',
      ...cairoFont('bold'),
    },
    labelActive: {
      color: isDark ? theme.brand.navy : theme.typography.inverse,
    },
  });

const SegmentedTabBar = SegmentedTabBarInner as <K extends string>(
  props: Props<K>,
) => ReturnType<FC>;

export default SegmentedTabBar;
