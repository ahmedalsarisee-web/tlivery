import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {PasswordField} from '../components/PasswordField';

export function CompanyRegisterPage() {
  const {t} = useTranslation();
  const {isAuthenticated, register} = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await register(displayName, email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(t('registrationFailed'));
      return;
    }
    navigate('/verify-email', {replace: true});
  };

  return (
    <main className="login-page">
      <div className="login-bg-veil" aria-hidden />
      <section className="login-card">
        <h1>{t('registerCompanyAccount')}</h1>
        <p className="muted">{t('registerCompanyAccountLead')}</p>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="displayName">{t('contactName')}</label>
            <input
              id="displayName"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="registerEmail">{t('loginEmail')}</label>
            <input
              id="registerEmail"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <PasswordField
            id="registerPassword"
            label={t('loginPassword')}
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <PasswordField
            id="confirmPassword"
            label={t('confirmPassword')}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {error ? <p className="login-error">{error}</p> : null}
          <button
            className="btn btn-primary"
            disabled={submitting}
            type="submit">
            {submitting ? t('creatingAccount') : t('createAccount')}
          </button>
          <Link className="btn btn-ghost" to="/login">
            {t('backToLogin')}
          </Link>
        </form>
      </section>
    </main>
  );
}
