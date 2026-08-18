import {useEffect, useState, type FormEvent} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@tanstack/react-query';
import {MapPin} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {workflowService} from '../services/workflowService';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '../constants/jordanLocations';
import {Modal} from '../components/Modal';
import {DeliveryLocationPicker} from '../components/DeliveryLocationPicker';
import {CountryPhoneField} from '../components/CountryPhoneField';
import {useCountry} from '../providers/CountryContext';
import {
  isValidNationalNumber,
  normalizeNationalDigits,
  toE164,
} from '../config/countries';

function emptyLocation(): PublicOrderLocation {
  return {
    countryCode: 'JO',
    governorateId: '',
    areaId: '',
    note: null,
  };
}

export function CompleteClientProfilePage() {
  const {t, i18n} = useTranslation();
  const navigate = useNavigate();
  const {user, refreshUser, logout} = useAuth();
  const {country, countryIso} = useCountry();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const [cancelling, setCancelling] = useState(false);

  const [fullName, setFullName] = useState(
    () => user?.profile?.fullName?.trim() || user?.name?.trim() || '',
  );
  const [phone, setPhone] = useState(() => {
    const raw = user?.profile?.phoneNumber || user?.profile?.phone || '';
    return raw ? normalizeNationalDigits(countryIso, raw) : '';
  });
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(() => {
    const raw = user?.profile?.phoneNumber || user?.profile?.phone || '';
    if (!raw) {
      return false;
    }
    const national = normalizeNationalDigits(countryIso, raw);
    return isValidNationalNumber(countryIso, national);
  });
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState<string | null>(
    () => {
      const raw = user?.profile?.phoneNumber || user?.profile?.phone || '';
      if (!raw) {
        return null;
      }
      const national = normalizeNationalDigits(countryIso, raw);
      return isValidNationalNumber(countryIso, national)
        ? toE164(countryIso, national)
        : null;
    },
  );
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [altPhone, setAltPhone] = useState('');
  const [location, setLocation] = useState<PublicOrderLocation>(() => {
    const existing = user?.profile?.defaultLocation;
    return existing && isPublicLocationFilled(existing)
      ? existing
      : emptyLocation();
  });
  const [locationNote, setLocationNote] = useState(
    () => user?.profile?.defaultLocation?.note?.trim() || '',
  );
  const [editingLocation, setEditingLocation] = useState(false);

  useEffect(() => {
    if (!phoneVerified || !verifiedPhoneE164) {
      return;
    }
    const currentE164 = isValidNationalNumber(countryIso, phone)
      ? toE164(countryIso, phone)
      : '';
    if (currentE164 !== verifiedPhoneE164) {
      setPhoneVerified(false);
      setVerifiedPhoneE164(null);
      setOtpCode('');
      setDebugCode(null);
    }
  }, [countryIso, phone, phoneVerified, verifiedPhoneE164]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'client' && user.role !== 'merchant') {
    return <Navigate to="/" replace />;
  }
  if (user.profile?.profileComplete) {
    return <Navigate to="/orders" replace />;
  }

  const requestOtp = useMutation({
    mutationFn: async () => {
      if (!isValidNationalNumber(countryIso, phone)) {
        throw new Error('invalid-phone');
      }
      return workflowService.requestProfilePhoneOtp(toE164(countryIso, phone));
    },
    onSuccess: result => {
      setPhoneVerified(false);
      setVerifiedPhoneE164(null);
      setOtpCode(result.debugCode ?? '');
      setDebugCode(result.debugCode ?? null);
      showToast(
        ToastType.success,
        result.delivery === 'whatsapp'
          ? t('otpSentWhatsApp')
          : t('otpSentDebug'),
      );
    },
    onError: error =>
      showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      if (!isValidNationalNumber(countryIso, phone) || !otpCode.trim()) {
        throw new Error('invalid');
      }
      return workflowService.verifyProfilePhoneOtp(
        toE164(countryIso, phone),
        otpCode.trim(),
      );
    },
    onSuccess: result => {
      setPhoneVerified(true);
      setVerifiedPhoneE164(result.phoneNumber);
      setDebugCode(null);
      showToast(ToastType.success, t('otpVerified'));
    },
    onError: error =>
      showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
  });

  const completeProfile = useMutation({
    mutationFn: async () => {
      if (!fullName.trim() || !phoneVerified || !verifiedPhoneE164) {
        throw new Error('incomplete');
      }
      if (!isPublicLocationFilled(location)) {
        throw new Error('missing-location');
      }
      if (altPhone.trim() && !isValidNationalNumber(countryIso, altPhone)) {
        throw new Error('invalid-alt');
      }
      return workflowService.completeIssuedProfile({
        fullName: fullName.trim(),
        phoneNumber: verifiedPhoneE164,
        defaultLocation: {
          ...location,
          note: locationNote.trim() || location.note || null,
        },
        locationNote: locationNote.trim() || undefined,
        altPhoneNumber: altPhone.trim()
          ? toE164(countryIso, altPhone)
          : undefined,
      });
    },
    onSuccess: async () => {
      await refreshUser();
      showToast(ToastType.success, t('profileCompletedToast'));
      navigate('/orders', {replace: true});
    },
    onError: error =>
      showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    completeProfile.mutate();
  };

  const onCancel = async () => {
    const confirmed = window.confirm(t('cancelCompleteProfileBody'));
    if (!confirmed) {
      return;
    }
    setCancelling(true);
    try {
      await logout();
      navigate('/login', {replace: true});
    } finally {
      setCancelling(false);
    }
  };

  const filled = isPublicLocationFilled(location);
  const place = filled
    ? (
        (locale === 'ar' ? location.placeNameAr : location.placeNameEn) || ''
      ).trim() || formatPublicLocation(location, locale)
    : '';

  return (
    <div className="page">
      <form className="card company-form" onSubmit={onSubmit}>
        <strong>{t('completeClientProfileTitle')}</strong>
        <p className="muted">{t('completeClientProfileIntro')}</p>

        <fieldset className="form-section">
          <legend>{t('completeProfileBasics')}</legend>

          <label className="field">
            {t('clientFullName')}
            <input
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              placeholder={t('clientFullNamePlaceholder')}
            />
            <span className="field-hint">{t('clientFullNameHint')}</span>
          </label>

          <CountryPhoneField
            id="clientMobile"
            label={t('clientMobileNumber')}
            value={phone}
            country={country}
            onChange={setPhone}
            required
          />

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={
                requestOtp.isPending ||
                !isValidNationalNumber(countryIso, phone)
              }
              onClick={() => requestOtp.mutate()}>
              {t('sendWhatsAppOtp')}
            </button>
          </div>

          <label className="field">
            {t('otpCode')}
            <input
              value={otpCode}
              onChange={event => setOtpCode(event.target.value)}
              placeholder="••••••"
              inputMode="numeric"
              maxLength={6}
            />
            {debugCode ? (
              <span className="field-hint">
                {t('otpDebugHint', {code: debugCode})}
              </span>
            ) : null}
            {phoneVerified ? (
              <span className="field-success">{t('otpVerified')}</span>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                style={{marginTop: 8}}
                disabled={verifyOtp.isPending || otpCode.trim().length < 4}
                onClick={() => verifyOtp.mutate()}>
                {t('verifyOtp')}
              </button>
            )}
          </label>

          <CountryPhoneField
            id="clientAltPhone"
            label={t('clientAltPhoneOptional')}
            value={altPhone}
            country={country}
            onChange={setAltPhone}
          />
        </fieldset>

        <fieldset className="form-section">
          <legend>{t('completeProfileLocation')}</legend>

          <div className="location-summary-card location-summary-card--nested">
            <strong>{t('locationField')}</strong>
            {filled ? (
              <p className="location-summary-text">{place}</p>
            ) : (
              <p className="location-summary-empty">{t('selectProfileLocation')}</p>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingLocation(true)}>
              <MapPin size={16} aria-hidden />
              {filled ? t('changeLocation') : t('setLocation')}
            </button>
          </div>

          <label className="field">
            {t('recipientLandmark')}
            <input
              value={locationNote}
              onChange={event => setLocationNote(event.target.value)}
              placeholder={t('recipientLandmarkPlaceholder')}
            />
          </label>
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              completeProfile.isPending ||
              cancelling ||
              !fullName.trim() ||
              !phoneVerified ||
              !isPublicLocationFilled(location)
            }>
            {t('saveClientProfile')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={completeProfile.isPending || cancelling}
            onClick={() => {
              void onCancel();
            }}>
            {cancelling ? t('loading') : t('cancelCompleteProfile')}
          </button>
        </div>
        <p className="muted">{t('completeClientProfileRequiredHint')}</p>
      </form>

      <Modal
        open={editingLocation}
        wide
        title={t('editProfileLocation')}
        onClose={() => setEditingLocation(false)}>
        <DeliveryLocationPicker
          kind="pickup"
          initial={location}
          onConfirm={next => {
            setLocation(next);
            if (next.note) {
              setLocationNote(next.note);
            }
            setEditingLocation(false);
          }}
        />
      </Modal>
    </div>
  );
}
