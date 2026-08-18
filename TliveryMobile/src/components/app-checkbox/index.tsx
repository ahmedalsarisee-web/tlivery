import {useMemo, type FC, type ReactNode} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Check} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import {
  getFlexDirection,
  getTextAlign,
} from '@app/utils/directionalStyles';
import {control, fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type AppCheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  trailing?: ReactNode;
};

const AppCheckbox: FC<AppCheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  trailing,
}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const accent = themeType === 'dark' ? theme.brand.gold : theme.brand.navy;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(space.sm),
          minHeight: control.touchMin,
          opacity: disabled ? 0.5 : 1,
        },
        box: {
          width: getWidth(22),
          height: getWidth(22),
          borderRadius: radius.sm / 2,
          borderWidth: 1.5,
          borderColor: checked ? accent : theme.ui.border,
          backgroundColor: checked ? accent : theme.backgrounds.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textCol: {
          flex: 1,
          gap: getHeight(2),
        },
        label: {
          fontSize: fontSize.body,
          color: theme.typography.primary,
          textAlign: getTextAlign(direction),
          ...cairoFont('medium'),
        },
        description: {
          fontSize: fontSize.caption,
          color: theme.typography.secondary,
          textAlign: getTextAlign(direction),
          ...cairoFont('regular'),
        },
      }),
    [accent, checked, direction, disabled, theme],
  );

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{checked, disabled}}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({pressed}) => [styles.row, pressed && !disabled ? {opacity: 0.85} : null]}>
      <View style={styles.box}>
        {checked ? (
          <Check size={14} color={theme.typography.inverse} strokeWidth={2.6} />
        ) : null}
      </View>
      <View style={styles.textCol}>
        <AppText style={styles.label}>{label}</AppText>
        {description ? (
          <AppText style={styles.description}>{description}</AppText>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
};

export default AppCheckbox;
