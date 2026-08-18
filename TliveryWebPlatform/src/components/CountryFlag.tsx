import type {CountryIso} from '../config/countries';

type CountryFlagProps = {
  iso: CountryIso;
  className?: string;
  title?: string;
  /** Frame width in px; height follows 4:3 flag ratio. */
  size?: number;
};

/** Raster flags — emoji flags often fail on Windows browsers. */
export function CountryFlag({
  iso,
  className,
  title,
  size = 20,
}: CountryFlagProps) {
  const code = iso.toLowerCase();
  const height = Math.round((size * 3) / 4);

  return (
    <span
      className={['country-flag-frame', className].filter(Boolean).join(' ')}
      style={{width: size, height}}
      title={title}>
      <img
        src={`https://flagcdn.com/w80/${code}.png`}
        srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
        width={size}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
