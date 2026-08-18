import {useMemo, FC} from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {AppButtonProps, AppButtonVariant} from '@app/types/appButton.props';
import {appButtonStyles} from './styles';

const AppButton: FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}) => {
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => appButtonStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const isDisabled = disabled || loading;

  const containerByVariant: Record<AppButtonVariant, ViewStyle> = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    destructive: styles.destructive,
    gold: styles.gold,
  };
  const labelByVariant: Record<AppButtonVariant, TextStyle> = {
    primary: styles.labelPrimary,
    secondary: styles.labelSecondary,
    ghost: styles.labelGhost,
    destructive: styles.labelDestructive,
    gold: styles.labelGold,
  };
  const spinnerColorByVariant: Record<AppButtonVariant, string> = {
    primary: theme.button.primaryText,
    secondary: theme.typography.primary,
    ghost: theme.primary,
    destructive: theme.base.white,
    gold: theme.brand.navy,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        containerByVariant[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled ? {opacity: 0.92} : null,
      ]}
      {...rest}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={spinnerColorByVariant[variant]}
          />
        ) : (
          <Text style={[styles.label, labelByVariant[variant]]}>{title}</Text>
        )}
      </View>
    </Pressable>
  );
};

export default AppButton;
