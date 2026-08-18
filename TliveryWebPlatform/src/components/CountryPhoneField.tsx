import type {ChangeEvent} from 'react';
import {
  normalizeNationalDigits,
  phonePlaceholder,
  type CountryConfig,
} from '../config/countries';
import {CountryFlag} from './CountryFlag';

type CountryPhoneFieldProps = {
  id: string;
  label: string;
  value: string;
  country: CountryConfig;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
};

export function CountryPhoneField({
  id,
  label,
  value,
  country,
  onChange,
  required = false,
  autoComplete = 'tel-national',
}: CountryPhoneFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(normalizeNationalDigits(country.iso, event.target.value));
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="phone-field-control" dir="ltr">
        <span className="phone-prefix" aria-hidden="true">
          <CountryFlag iso={country.iso} size={18} />
          <span>{country.dialCode}</span>
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder={phonePlaceholder(country.iso)}
          pattern={`[0-9]{${country.nationalLength}}`}
          maxLength={country.nationalLength}
          required={required}
          value={normalizeNationalDigits(country.iso, value)}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
