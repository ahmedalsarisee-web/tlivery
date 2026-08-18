import brand from '../config/brand';
import './WaselMark.css';

type WaselMarkProps = {
  size?: number;
  className?: string;
  alt?: string;
};

/** General Wasel app mark (navy + gold) for loading, empty, and compact branding. */
export function WaselMark({
  size = 56,
  className = '',
  alt = brand.name,
}: WaselMarkProps) {
  return (
    <img
      className={`wasel-mark ${className}`.trim()}
      src={brand.images.appIcon}
      width={size}
      height={size}
      alt={alt}
      decoding="async"
    />
  );
}
