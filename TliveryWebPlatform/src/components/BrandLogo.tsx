import './BrandLogo.css';
import brand from '../config/brand';

type BrandLogoProps = {
  tone?: 'onDark' | 'onLight';
  size?: 'header' | 'hero';
  className?: string;
};

const EN_LETTERS = brand.name.toUpperCase().split('');
const SYMBOL_SRC = brand.images.symbol;

export function BrandLogo({
  tone = 'onDark',
  size = 'header',
  className = '',
}: BrandLogoProps) {
  return (
    <div
      className={`brand-logo-lockup brand-logo-${size} brand-logo-${tone} ${className}`.trim()}
      role="img"
      aria-label={brand.name}>
      <div className="brand-logo-wordmark">
        <span className="brand-logo-ar">{brand.nameAr}</span>
        <div className="brand-logo-en" aria-hidden>
          {EN_LETTERS.map((letter, i) => (
            <span key={`${letter}-${i}`} className="brand-logo-en-letter">
              {letter}
            </span>
          ))}
        </div>
      </div>
      {tone === 'onLight' ? (
        <span
          className="brand-logo-symbol brand-logo-symbol-masked"
          style={{
            WebkitMaskImage: `url(${SYMBOL_SRC})`,
            maskImage: `url(${SYMBOL_SRC})`,
          }}
          aria-hidden
        />
      ) : (
        <img
          className="brand-logo-symbol"
          src={SYMBOL_SRC}
          alt=""
          aria-hidden
        />
      )}
    </div>
  );
}
