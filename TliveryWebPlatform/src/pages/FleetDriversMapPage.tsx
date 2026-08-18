import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {FleetDriversMap} from '../components/live-tracking/FleetDriversMap';
import {useCompanyDriverLocations} from '../hooks/useCompanyDriverLocations';

export function FleetDriversMapPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const {locations, loading, error, isListening} = useCompanyDriverLocations(
    companyId,
    {enabled: Boolean(companyId)},
  );

  return (
    <div className="page">
      <div className="page-lead">
        <h2>{t('driversMap')}</h2>
        <p className="muted">
          {t('driversMapHint')}
          {isListening ? ` · ${t('live')}` : ''}
        </p>
      </div>
      {error ? (
        <p className="muted" style={{color: 'var(--danger, #b91c1c)'}}>
          {error.message}
        </p>
      ) : null}
      {!error && !loading && locations.length === 0 ? (
        <p className="muted">{t('fleetMapEmpty')}</p>
      ) : null}
      <div className="card" style={{padding: 12}}>
        <FleetDriversMap locations={locations} loading={loading} />
      </div>
    </div>
  );
}
