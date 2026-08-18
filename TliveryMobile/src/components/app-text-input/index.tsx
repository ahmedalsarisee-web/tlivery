import {useMemo, useState, forwardRef} from 'react';
import {Pressable, TextInput, View} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import FormField from '@app/components/form-field';
import {AppTextInputProps} from '@app/types/appTextInput.props';
import {appTextInputStyles} from './styles';

const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      containerStyle,
      style,
      startAdornment,
      endAdornment,
      secureTextEntry,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const {t} = useTranslation();
    const {theme} = useTheme();
    const {direction} = useLanguage();
    const styles = useMemo(
      () => appTextInputStyles(theme, direction),
      [theme, direction],
    );
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const isPasswordField = secureTextEntry === true;
    const showToggle = isPasswordField && endAdornment == null;
    const hideSecure = isPasswordField ? !revealed : Boolean(secureTextEntry);
    const resolvedEndAdornment = showToggle ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          revealed ? t('loginHidePassword') : t('loginShowPassword')
        }
        hitSlop={8}
        onPress={() => setRevealed(prev => !prev)}>
        {revealed ? (
          <EyeOff size={20} color={theme.typography.secondary} />
        ) : (
          <Eye size={20} color={theme.typography.secondary} />
        )}
      </Pressable>
    ) : (
      endAdornment
    );

    return (
      <FormField
        label={label}
        error={error}
        hint={hint}
        required={required}
        style={containerStyle}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              !!startAdornment && styles.inputWithStart,
              !!resolvedEndAdornment && styles.inputWithEnd,
              focused && styles.focused,
              !!error && styles.errored,
              style,
            ]}
            placeholderTextColor={theme.typography.secondary}
            secureTextEntry={hideSecure}
            onFocus={e => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {startAdornment ? (
            <View style={styles.startAdornment}>{startAdornment}</View>
          ) : null}
          {resolvedEndAdornment ? (
            <View style={styles.endAdornment}>{resolvedEndAdornment}</View>
          ) : null}
        </View>
      </FormField>
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

export default AppTextInput;
