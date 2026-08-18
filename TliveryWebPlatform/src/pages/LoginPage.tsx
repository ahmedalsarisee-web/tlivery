import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Moon, Sun} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {useTheme} from '../theme/ThemeContext';
import {BrandLogo} from '../components/BrandLogo';
import {LanguageSwitcher} from '../components/LanguageSwitcher';
import {PasswordField} from '../components/PasswordField';
import {PageLoading} from '../components/PageLoading';

export function LoginPage() {
  const {t} = useTranslation();
  const {isAuthenticated, isLoading, login} = useAuth();
  const {isDark, toggleMode} = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <PageLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const canSubmit = email.trim().length > 0 && password.length > 0;
  const bgSrc = isDark
    ? '/brand/login-bg-dark.png'
    : '/brand/login-bg-light.png';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(
        t(
          result.error === 'unauthorized'
            ? 'loginUnauthorized'
            : result.error === 'unknown'
              ? 'loginUnknownError'
              : 'loginInvalid',
        ),
      );
      return;
    }
    navigate('/', {replace: true});
  };

  return (
    <div className="login-page">
      <img className="login-bg" src={bgSrc} alt="" aria-hidden />
      <div className="login-bg-veil" aria-hidden />

      <div className="login-theme-toggle">
        <LanguageSwitcher />
        <button
          type="button"
          className="icon-btn"
          aria-label={t('toggleTheme')}
          onClick={toggleMode}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="login-card">
        <div className="login-brand">
          <BrandLogo tone={isDark ? 'onDark' : 'onLight'} size="hero" />
          <p className="muted" style={{margin: 0, fontSize: '0.9rem'}}>
            {t('loginPortalLead')}
          </p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">{t('loginEmailOrUsername')}</label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder={t('loginEmailOrUsernamePlaceholder')}
            />
          </div>
          <PasswordField
            id="password"
            label={t('loginPassword')}
            autoComplete="current-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder={t('loginPasswordPlaceholder')}
          />
          {error ? <p className="login-error">{error}</p> : null}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? t('loginSigningIn') : t('loginSignIn')}
          </button>
          <Link className="btn btn-ghost" to="/register-customer">
            {t('signupRoleCustomer')}
          </Link>
          <Link className="btn btn-ghost" to="/register-company">
            {t('registerCompanyAccount')}
          </Link>
        </form>
      </div>
    </div>
  );
}
