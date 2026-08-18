import {useState} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';

export function VerifyEmailPage() {
  const {t} = useTranslation();
  const {user, resendVerificationEmail, refreshUser, logout} = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.emailVerified) {
    return <Navigate to="/" replace />;
  }

  const checkVerification = async () => {
    setBusy(true);
    setMessage('');
    try {
      const refreshed = await refreshUser();
      if (refreshed?.emailVerified) {
        navigate('/', {replace: true});
      } else {
        setMessage(t('emailStillUnverified'));
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail();
      setMessage(t('verificationEmailResent'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-bg-veil" aria-hidden />
      <section className="login-card">
        <h1>{t('verifyEmailTitle')}</h1>
        <p className="muted">{t('verifyEmailLead', {email: user.email})}</p>
        {message ? <p className="login-error">{message}</p> : null}
        <div className="login-form">
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void checkVerification()}>
            {t('iVerifiedEmail')}
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void resend()}>
            {t('resendVerificationEmail')}
          </button>
          <button className="btn btn-ghost" onClick={() => void logout()}>
            {t('logout')}
          </button>
        </div>
      </section>
    </main>
  );
}
