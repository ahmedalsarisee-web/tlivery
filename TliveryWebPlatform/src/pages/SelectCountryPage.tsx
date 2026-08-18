import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useCountry} from '../providers/CountryContext';
import type {CountryIso} from '../config/countries';
import {CountryFlag} from '../components/CountryFlag';

export function SelectCountryPage({mode = 'firstRun'}: {mode?: 'firstRun' | 'change'} = {}) {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {countries, countryIso, setCountry} = useCountry();
  const [selected, setSelected] = useState<CountryIso>(countryIso);
  const isChange = mode === 'change';

  const selectedCountry = useMemo(
    () => countries.find(country => country.iso === selected),
    [countries, selected],
  );

  const onContinue = () => {
    setCountry(selected);
    if (isChange) {
      navigate('/settings');
      return;
    }
    navigate('/', {replace: true});
  };

  return (
    <div className="page select-country-page">
      <div className="card select-country-card">
        <h1>{t('selectCountryTitle')}</h1>
        <p className="muted">{t('selectCountrySubtitle')}</p>
        <ul className="country-list">
          {countries.map(country => {
            const active = selected === country.iso;
            return (
              <li key={country.iso}>
                <button
                  type="button"
                  className={`country-option${active ? ' is-active' : ''}`}
                  onClick={() => setSelected(country.iso)}>
                  <CountryFlag iso={country.iso} size={28} className="country-flag" />
                  <span className="country-meta">
                    <strong>{t(country.nameKey)}</strong>
                    <span className="muted">{country.dialCode}</span>
                  </span>
                  {active ? <span className="country-check">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          {t('onboardingNext')}
          {selectedCountry ? (
            <>
              {' · '}
              <CountryFlag iso={selectedCountry.iso} size={16} />
            </>
          ) : null}
        </button>
        {isChange ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/settings')}>
            {t('cancel')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
