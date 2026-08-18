import {useTranslation} from 'react-i18next';
import {WaselMark} from './WaselMark';

type PageLoadingProps = {
  label?: string;
};

export function PageLoading({label}: PageLoadingProps) {
  const {t} = useTranslation();
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <WaselMark size={72} className="page-loading-mark" />
      <span>{label ?? t('loading')}</span>
    </div>
  );
}
