import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../theme/ThemeContext';
import type {ThemeMode} from '../theme/tokens';
import {useLanguage} from '../i18n/LangContext';
import type {AppLanguage} from '../i18n';
import {useCountry} from '../providers/CountryContext';
import {CountryFlag} from '../components/CountryFlag';

export function SettingsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {mode, setMode} = useTheme();
  const {language, changeLanguage} = useLanguage();
  const {country} = useCountry();

  return (
    <div className="page">
      <p className="page-lead">{t('settingsLead')}</p>

      <div className="card" style={{maxWidth: 480}}>
        <h2 style={{margin: '0 0 12px', fontSize: '1.05rem'}}>
          {t('themeTitle')}
        </h2>
        <div className="field">
          <label htmlFor="theme-mode">{t('themeMode')}</label>
          <select
            id="theme-mode"
            value={mode}
            onChange={e => setMode(e.target.value as ThemeMode)}>
            <option value="light">{t('themeLight')}</option>
            <option value="dark">{t('themeDark')}</option>
          </select>
        </div>
        <p className="muted" style={{marginTop: 12}}>
          {t('themeHint')}
        </p>
      </div>

      <div className="card" style={{maxWidth: 480}}>
        <h2 style={{margin: '0 0 12px', fontSize: '1.05rem'}}>
          {t('languageTitle')}
        </h2>
        <div className="field">
          <label htmlFor="app-lang">{t('language')}</label>
          <select
            id="app-lang"
            value={language}
            onChange={e => {
              void changeLanguage(e.target.value as AppLanguage);
            }}>
            <option value="en">{t('english')}</option>
            <option value="ar">{t('arabic')}</option>
          </select>
        </div>
        <p className="muted" style={{marginTop: 12}}>
          {t('languageHint')}
        </p>
      </div>

      <div className="card" style={{maxWidth: 480}}>
        <h2 style={{margin: '0 0 12px', fontSize: '1.05rem'}}>
          {t('countryTitle')}
        </h2>
        <p
          style={{
            margin: '0 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
          <CountryFlag iso={country.iso} size={22} />
          <span>
            {t(country.nameKey)} · {country.dialCode}
          </span>
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/settings/country')}>
          {t('changeCountry')}
        </button>
        <p className="muted" style={{marginTop: 12}}>
          {t('countryHint')}
        </p>
      </div>
    </div>
  );
}
