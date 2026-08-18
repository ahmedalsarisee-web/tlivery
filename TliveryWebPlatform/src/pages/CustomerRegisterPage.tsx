import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {MapPin} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {PasswordField} from '../components/PasswordField';
import {CountryPhoneField} from '../components/CountryPhoneField';
import {DeliveryLocationPicker} from '../components/DeliveryLocationPicker';
import {Modal} from '../components/Modal';
import {useCountry} from '../providers/CountryContext';
import {isValidNationalNumber, toE164} from '../config/countries';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '../constants/jordanLocations';
import {workflowService} from '../services/workflowService';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';

function phoneAccountExistsDetails(error: unknown): {email?: string} | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const code =
    'code' in error ? String((error as {code?: unknown}).code ?? '') : '';
  if (!code.includes('already-exists')) {
    return null;
  }
  const details =
    'details' in error
      ? ((error as {details?: {reason?: string; email?: string}}).details ??
        null)
      : null;
  if (details?.reason === 'phone-account-exists') {
    return {email: details.email};
  }
  const message =
    'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : '';
  if (message.toLowerCase().includes('sign in to join')) {
    return {email: details?.email};
  }
  return null;
}

export function CustomerRegisterPage() {
  const {t, i18n} = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {isAuthenticated, login, refreshUser} = useAuth();
  const {country, countryIso} = useCountry();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState(
    () => (params.get('inviteCode') || params.get('code') || '').toUpperCase(),
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [defaultLocation, setDefaultLocation] =
    useState<PublicOrderLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);

  const normalizedCode = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const locationLines = useMemo(() => {
    if (!isPublicLocationFilled(defaultLocation)) {
      return null;
    }
    const place = (
      (locale === 'ar'
        ? defaultLocation.placeNameAr
        : defaultLocation.placeNameEn) || ''
    ).trim();
    const area = (
      (locale === 'ar' ? defaultLocation.areaAr : defaultLocation.areaEn) || ''
    ).trim();
    const gov = (
      (locale === 'ar'
        ? defaultLocation.governorateAr
        : defaultLocation.governorateEn) || ''
    ).trim();
    const title =
      place || area || formatPublicLocation(defaultLocation, locale);
    const subtitle = [
      area && area !== title ? area : null,
      gov && gov !== title && gov !== area ? gov : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {title, subtitle};
  }, [defaultLocation, locale]);

  const inviteQuery = useQuery({
    queryKey: ['clientInvite', normalizedCode],
    queryFn: () => workflowService.getClientInvite(normalizedCode),
    enabled: normalizedCode.length >= 6,
    retry: false,
  });

  useEffect(() => {
    const suggested = inviteQuery.data?.suggestedPhone;
    if (!suggested || phone) {
      return;
    }
    setPhone(suggested.replace(/\D/g, '').slice(-9));
  }, [inviteQuery.data?.suggestedPhone, phone]);

  const unavailable =
    inviteQuery.isSuccess && inviteQuery.data && !inviteQuery.data.available;

  const register = useMutation({
    mutationFn: async () => {
      if (normalizedCode.length < 6) {
        throw new Error('missing-invite');
      }
      if (!fullName.trim()) {
        throw new Error('invalid-name');
      }
      if (!isValidNationalNumber(countryIso, phone)) {
        throw new Error('invalid-phone');
      }
      if (password.length < 6) {
        throw new Error('weak-password');
      }
      if (password !== confirmPassword) {
        throw new Error('password-mismatch');
      }
      if (unavailable) {
        throw new Error('invite-unavailable');
      }
      const phoneNumber = toE164(countryIso, phone);
      const locationPayload = isPublicLocationFilled(defaultLocation)
        ? defaultLocation
        : undefined;
      try {
        const result = await workflowService.registerClientWithInvite({
          inviteCode: normalizedCode,
          fullName: fullName.trim(),
          phoneNumber,
          password,
          defaultLocation: locationPayload,
        });
        const loginResult = await login(result.email, password);
        if (!loginResult.ok) {
          throw new Error('login-failed');
        }
        await refreshUser();
        return {joined: false};
      } catch (err) {
        const existing = phoneAccountExistsDetails(err);
        if (!existing) {
          throw err;
        }
        const loginId = existing.email || phoneNumber;
        const loginResult = await login(loginId, password);
        if (!loginResult.ok) {
          throw new Error('login-failed');
        }
        await workflowService.joinCompanyWithClientInvite({
          inviteCode: normalizedCode,
          fullName: fullName.trim(),
          defaultLocation: locationPayload,
        });
        await refreshUser();
        return {joined: true};
      }
    },
    onSuccess: result => {
      showToast(
        ToastType.success,
        t(
          result.joined
            ? 'clientInviteJoinedToast'
            : 'clientInviteRegisteredToast',
        ),
      );
      navigate('/', {replace: true});
    },
    onError: err => {
      if (err instanceof Error) {
        if (err.message === 'password-mismatch') {
          setError(t('passwordsDoNotMatch'));
          return;
        }
        if (err.message === 'weak-password') {
          setError(t('clientInvitePasswordHint'));
          return;
        }
        if (err.message === 'invalid-phone') {
          setError(t('authErrorInvalidPhone'));
          return;
        }
        if (err.message === 'invalid-name') {
          setError(t('clientInviteFullNameHint'));
          return;
        }
        if (err.message === 'missing-invite') {
          setError(t('clientInviteCodeRequired'));
          return;
        }
        if (err.message === 'invite-unavailable') {
          setError(t('clientInviteAlreadyUsed'));
          return;
        }
      }
      setError(t(getWorkflowErrorTranslationKey(err)));
    },
  });

  if (isAuthenticated && !register.isPending) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    register.mutate();
  };

  return (
    <main className="login-page">
      <div className="login-bg-veil" aria-hidden />
      <section className="login-card">
        <h1>
          {inviteQuery.data?.companyName
            ? t('clientInviteRegisterHeading', {
                company: inviteQuery.data.companyName,
              })
            : t('signupCustomerTitle')}
        </h1>
        <p className="muted">{t('signupCustomerLead')}</p>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="customerFullName">{t('clientFullName')}</label>
            <input
              id="customerFullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={t('clientFullNamePlaceholder')}
              autoComplete="name"
              required
            />
            <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
              {t('clientInviteFullNameHint')}
            </p>
          </div>

          <CountryPhoneField
            id="customerPhone"
            label={t('clientMobileNumber')}
            value={phone}
            onChange={setPhone}
            country={country}
            required
          />

          <div className="field">
            <label>{t('clientInviteLocationOptional')}</label>
            <div className="location-summary-card location-summary-card--nested">
              <strong>{t('locationField')}</strong>
              {locationLines ? (
                <div className="location-summary-details">
                  <p className="location-summary-text">{locationLines.title}</p>
                  {locationLines.subtitle ? (
                    <p className="location-summary-sub">
                      {locationLines.subtitle}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="location-summary-empty">{t('tapToSetLocation')}</p>
              )}
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingLocation(true)}>
                  <MapPin size={16} aria-hidden />
                  {locationLines ? t('changeLocation') : t('setLocation')}
                </button>
                {defaultLocation ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDefaultLocation(null)}>
                    {t('clientInviteClearLocation')}
                  </button>
                ) : null}
              </div>
              {!locationLines ? (
                <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
                  {t('clientInviteLocationHint')}
                </p>
              ) : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="customerInviteCode">{t('clientInviteCodeLabel')}</label>
            <input
              id="customerInviteCode"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder={t('clientInviteCodePlaceholder')}
              autoCapitalize="characters"
              required
            />
            <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
              {t('clientInviteCodeHint')}
            </p>
            {unavailable ? (
              <p className="login-error">{t('clientInviteAlreadyUsed')}</p>
            ) : null}
            {inviteQuery.isSuccess && inviteQuery.data?.available ? (
              <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
                {t('clientInviteCodeValid', {
                  company: inviteQuery.data.companyName,
                })}
              </p>
            ) : null}
          </div>

          <PasswordField
            id="customerPassword"
            label={t('loginPassword')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={4}
            required
          />
          <p className="muted" style={{margin: 0, fontSize: 13}}>
            {t('clientInvitePasswordHint')}
          </p>

          <PasswordField
            id="customerConfirmPassword"
            label={t('confirmPassword')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={4}
            required
          />

          {error ? <p className="login-error">{error}</p> : null}

          <button
            className="btn btn-primary"
            disabled={register.isPending || Boolean(unavailable)}
            type="submit">
            {register.isPending ? t('creatingAccount') : t('createAccount')}
          </button>
          <Link className="btn btn-ghost" to="/login">
            {t('backToLogin')}
          </Link>
        </form>
      </section>

      <Modal
        open={editingLocation}
        wide
        title={t('editPickupLocation')}
        onClose={() => setEditingLocation(false)}>
        <DeliveryLocationPicker
          kind="pickup"
          initial={defaultLocation}
          onConfirm={next => {
            setDefaultLocation(next);
            setEditingLocation(false);
          }}
        />
      </Modal>
    </main>
  );
}
