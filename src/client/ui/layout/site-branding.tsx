import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTheme } from 'next-themes';
import { type CmsData } from '@/shared/cms-types';

/**
 * Single source of truth for the brand mark. The admin can swap the light and
 * dark logo URLs in Site Settings — every surface picks it up from here.
 */
export const BrandMark = ({
  cms,
  height = 34,
  variant = 'horizontal',
}: {
  cms: CmsData;
  height?: number;
  variant?: 'horizontal' | 'stacked';
}) => {
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [cms.settings.logoLight, cms.settings.logoDark]);

  const src = resolvedTheme === 'dark' ? cms.settings.logoDark : cms.settings.logoLight;

  if (!src || failed) {
    return (
      <span
        style={{
          fontFamily: 'var(--ee-font-display)',
          fontWeight: 700,
          fontSize: `${String(Math.round(height * 0.52))}px`,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Euro<span className="ee-accent">Edge</span>
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={cms.settings.brandName}
      onError={() => { setFailed(true); }}
      style={{ height: `${String(height)}px`, width: 'auto', objectFit: 'contain' }}
      data-variant={variant}
    />
  );
};

export const PoweredBy = ({ cms }: { cms: CmsData }) => (
  <Link to="/" className="ee-row ee-row-sm" style={{ gap: 10 }}>
    <BrandMark cms={cms} height={30} />
  </Link>
);
