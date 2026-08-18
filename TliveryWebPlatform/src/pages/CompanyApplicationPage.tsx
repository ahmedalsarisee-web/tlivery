import {useState, type FormEvent} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/AuthContext';
import {useCountry} from '../providers/CountryContext';
import {CountryPhoneField} from '../components/CountryPhoneField';
import {toE164} from '../config/countries';
import {
  useMyCompanyApplication,
  useSubmitCompanyApplication,
} from '../hooks/useWorkflow';
import type {SubmitCompanyApplicationInput} from '../models/workflow';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';

const EMPTY: SubmitCompanyApplicationInput = {
  companyName: '',
  companyCode: '',
  commercialRegister: '',
  city: '',
  address: '',
  contactName: '',
  phone: '',
  email: '',
  maxDrivers: 20,
  notes: '',
};

export function CompanyApplicationPage() {
  const {t} = useTranslation();
  const {user, refreshUser} = useAuth();
  const {country, countryIso} = useCountry();
  const navigate = useNavigate();
  const application = useMyCompanyApplication(user?.id ?? '');
  const submit = useSubmitCompanyApplication(user?.id ?? '');
  const [form, setForm] = useState(EMPTY);
  const cityPlaceholder = country.cities?.[0]
    ? t('companyCityPlaceholderExample', {city: country.cities[0]})
    : t('companyCityPlaceholder');

  if (!user) {
    return null;
  }
  if (application.isLoading) {
    return <div className="page"><div className="card">{t('loading')}</div></div>;
  }
  if (application.isError) {
    return <div className="page"><div className="card login-error">{t('workflowLoadError')}</div></div>;
  }
  if (application.data) {
    return (
      <div className="page">
        <div className="card">
          <h2>{t('applicationSubmitted')}</h2>
          <p>{t('applicationStatusLabel')}: <strong>{t(`status${application.data.status[0].toUpperCase()}${application.data.status.slice(1)}`)}</strong></p>
          {application.data.reviewNote ? <p className="muted">{application.data.reviewNote}</p> : null}
          {application.data.status === 'approved' ? (
            <button
              className="btn btn-primary"
              onClick={() => void refreshUser().then(() => navigate('/', {replace: true}))}>
              {t('continueToDashboard')}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const update = (key: keyof SubmitCompanyApplicationInput, value: string | number) =>
    setForm(current => ({...current, [key]: value}));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate(
      {
        ...form,
        phone: toE164(countryIso, form.phone),
        email: user.email,
      },
      {
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  return (
    <div className="page">
      <p className="page-lead">{t('companyApplicationLead')}</p>
      {!user.emailVerified ? (
        <div className="card login-error">{t('verifiedEmailRequired')}</div>
      ) : null}
      <form className="company-form card" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field"><label>{t('companyName')}</label><input required value={form.companyName} onChange={e => update('companyName', e.target.value)} /></div>
          <div className="field"><label>{t('companyCode')}</label><input value={form.companyCode} onChange={e => update('companyCode', e.target.value.toUpperCase())} /></div>
          <div className="field"><label>{t('commercialRegister')}</label><input required value={form.commercialRegister} onChange={e => update('commercialRegister', e.target.value)} /></div>
          <div className="field">
            <label>{t('companyCity')}</label>
            <input
              required
              value={form.city}
              placeholder={cityPlaceholder}
              onChange={e => update('city', e.target.value)}
            />
          </div>
          <div className="field field-span-2"><label>{t('companyAddress')}</label><input required value={form.address} onChange={e => update('address', e.target.value)} /></div>
          <div className="field"><label>{t('contactName')}</label><input required value={form.contactName} onChange={e => update('contactName', e.target.value)} /></div>
          <CountryPhoneField
            id="companyPhone"
            label={t('companyPhone')}
            value={form.phone}
            country={country}
            onChange={value => update('phone', value)}
            required
          />
          <div className="field"><label>{t('companyEmail')}</label><input disabled value={user.email} /></div>
          <div className="field"><label>{t('maxDrivers')}</label><input type="number" min={1} value={form.maxDrivers} onChange={e => update('maxDrivers', Number(e.target.value))} /></div>
          <div className="field field-span-2"><label>{t('companyNotes')}</label><textarea value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
        </div>
        {submit.isError ? (
          <p className="login-error">
            {t(getWorkflowErrorTranslationKey(submit.error))}
          </p>
        ) : null}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={!user.emailVerified || submit.isPending}>
            {submit.isPending ? t('submitting') : t('submitApplication')}
          </button>
        </div>
      </form>
    </div>
  );
}
