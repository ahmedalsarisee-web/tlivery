import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';

type ComingSoonPageProps = {
  titleKey: string;
  leadKey?: string;
  links?: Array<{to: string; labelKey: string}>;
};

export function ComingSoonPage({
  titleKey,
  leadKey = 'sectionComingSoon',
  links,
}: ComingSoonPageProps) {
  const {t} = useTranslation();
  return (
    <div className="page">
      <h2 style={{marginTop: 0}}>{t(titleKey)}</h2>
      <div className="card" style={{maxWidth: 560}}>
        <p className="page-lead" style={{margin: 0}}>
          {t(leadKey)}
        </p>
        {links?.length ? (
          <ul style={{margin: '16px 0 0', paddingInlineStart: 18}}>
            {links.map(link => (
              <li key={link.to}>
                <Link to={link.to}>{t(link.labelKey)}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
