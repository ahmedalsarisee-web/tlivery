import {type ReactNode, useEffect, useState} from 'react';
import {APIProvider} from '@vis.gl/react-google-maps';
import {useTranslation} from 'react-i18next';
import {appEnv, hasGoogleMapsKey} from '../../config/env';
import './liveTrackingMaps.css';

type Props = {
  children: ReactNode;
};

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

/**
 * Shared Google Maps JS loader. Surfaces clear guidance when the key is
 * missing, quoted wrongly, or Maps JavaScript API is not enabled.
 */
export function GoogleMapsProvider({children}: Props) {
  const {t} = useTranslation();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setAuthError(t('mapsApiKeyAuthFailure'));
      previous?.();
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, [t]);

  if (!hasGoogleMapsKey()) {
    return (
      <div className="tracking-map-shell tracking-map-missing-key">
        {t('mapsApiKeyMissing')}
      </div>
    );
  }

  if (authError) {
    return (
      <div className="tracking-map-shell tracking-map-missing-key">
        <p style={{margin: 0}}>{t('mapsApiKeyInvalid')}</p>
        <p className="muted" style={{marginTop: 8, fontSize: '0.85rem'}}>
          {authError}
        </p>
        <p className="muted" style={{marginTop: 8, fontSize: '0.85rem'}}>
          {t('mapsApiKeyInvalidHint')}
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={appEnv.googleMapsApiKey}
      onError={error => {
        setAuthError(error instanceof Error ? error.message : String(error));
      }}>
      {children}
    </APIProvider>
  );
}
