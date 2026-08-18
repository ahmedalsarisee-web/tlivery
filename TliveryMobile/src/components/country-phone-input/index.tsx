import {forwardRef, useMemo} from 'react';
import {TextInput, View} from 'react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useCountry} from '@app/providers/CountryContext';
import {
  normalizeNationalDigits,
  phonePlaceholder,
  toE164,
  isValidNationalNumber,
} from '@app/config/countries';
import AppText from '@app/components/app-text';
import AppTextInput from '@app/components/app-text-input';
import type {AppTextInputProps} from '@app/types/appTextInput.props';
import {countryPhoneInputStyles} from './styles';

type CountryPhoneInputProps = Omit<
  AppTextInputProps,
  | 'value'
  | 'onChangeText'
  | 'keyboardType'
  | 'textContentType'
  | 'autoComplete'
  | 'maxLength'
  | 'startAdornment'
  | 'endAdornment'
> & {
  value: string;
  onChangeText: (value: string) => void;
};

export {
  normalizeNationalDigits,
  toE164,
  isValidNationalNumber,
  phonePlaceholder,
};

/** @deprecated Use normalizeNationalDigits with selected country iso */
export const normalizeJordanNationalNumber = (value: string): string =>
  normalizeNationalDigits('JO', value);

/** @deprecated Use toE164 with selected country iso */
export const toJordanE164 = (value: string): string => toE164('JO', value);

const CountryPhoneInput = forwardRef<TextInput, CountryPhoneInputProps>(
  ({value, onChangeText, style, placeholder, ...props}, ref) => {
    const {theme} = useTheme();
    const {direction} = useLanguage();
    const {country, countryIso} = useCountry();
    const styles = useMemo(
      () => countryPhoneInputStyles(theme, direction),
      [theme, direction],
    );
    const resolvedPlaceholder = placeholder ?? phonePlaceholder(countryIso);
    const countryPrefix = (
      <View style={styles.countryPrefix}>
        <AppText style={styles.flag}>{country.flag}</AppText>
        <AppText style={styles.countryCode}>{country.dialCode}</AppText>
      </View>
    );

    return (
      <AppTextInput
        ref={ref}
        {...props}
        value={normalizeNationalDigits(countryIso, value)}
        onChangeText={next =>
          onChangeText(normalizeNationalDigits(countryIso, next))
        }
        placeholder={resolvedPlaceholder}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={country.nationalLength}
        style={[styles.phoneInput, style]}
        startAdornment={countryPrefix}
      />
    );
  },
);

CountryPhoneInput.displayName = 'CountryPhoneInput';

export default CountryPhoneInput;
