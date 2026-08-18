import {useState, type InputHTMLAttributes} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import {useTranslation} from 'react-i18next';

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string;
  id: string;
};

export function PasswordField({
  label,
  id,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const {t} = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label htmlFor={id}>{label}</label>
      <div className="password-field-control">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          {...inputProps}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
          aria-pressed={showPassword}
          onClick={() => setShowPassword(current => !current)}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
