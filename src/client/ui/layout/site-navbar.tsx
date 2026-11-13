import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { LuArrowRight, LuMenu, LuMoon, LuSun, LuX } from 'react-icons/lu';
import { useTheme } from 'next-themes';
import { type CmsData } from '@/shared/cms-types';
import { BrandMark } from './site-branding';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className="ee-icon-btn"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => { setTheme(isDark ? 'light' : 'dark'); }}
    >
      {isDark ? <LuSun size={15} /> : <LuMoon size={15} />}
    </button>
  );
};

export const SiteNavbar = ({
  cms,
  onConsult,
}: {
  cms: CmsData;
  onConsult: () => void;
}) => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = cms.nav.filter((item) => item.visible).sort((a, b) => a.order - b.order);

  return (
    <>
      <header className="ee-nav" data-scrolled={scrolled ? 'true' : 'false'}>
        <nav className="ee-container ee-nav-inner" aria-label="Primary">
          <Link to="/" aria-label={`${cms.settings.brandName} home`}>
            <BrandMark cms={cms} height={32} />
          </Link>

          <div className="ee-nav-links">
            {links.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className="ee-nav-link"
                data-active={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                  ? 'true'
                  : 'false'}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="ee-row ee-row-sm">
            <ThemeToggle />
            <button
              type="button"
              className="ee-btn ee-btn-primary ee-btn-sm ee-nav-cta"
              onClick={onConsult}
            >
              Free assessment <LuArrowRight size={13} />
            </button>
            <button
              type="button"
              className="ee-burger"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => { setOpen((prev) => !prev); }}
            >
              {open ? <LuX size={18} /> : <LuMenu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      <div className="ee-mobile-sheet" data-open={open ? 'true' : 'false'}>
        <div className="ee-stack" style={{ gap: 0 }}>
          {links.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="ee-mobile-link"
              data-active={pathname === item.path ? 'true' : 'false'}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="ee-btn ee-btn-primary ee-btn-block"
          style={{ marginTop: 18 }}
          onClick={() => {
            setOpen(false);
            onConsult();
          }}
        >
          Book a free assessment
        </button>
      </div>
    </>
  );
};
