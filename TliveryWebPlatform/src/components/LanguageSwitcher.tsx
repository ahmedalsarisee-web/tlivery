import {useTranslation} from 'react-i18next';
import {useLanguage} from '../i18n/LangContext';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const {t} = useTranslation();
  const {language, changeLanguage} = useLanguage();

  const next = language === 'en' ? 'ar' : 'en';
  const label = language === 'en' ? 'ع' : 'EN';

  return (
    <button
      type="button"
      className="icon-btn lang-toggle-btn"
      aria-label={t('language')}
      title={next === 'ar' ? t('arabic') : t('english')}
      onClick={() => {
        void changeLanguage(next);
      }}>
      <span className="lang-toggle-label">{label}</span>
    </button>
  );
}
