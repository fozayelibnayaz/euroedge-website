import { Link } from 'react-router';
import {
  LuFacebook,
  LuInstagram,
  LuLinkedin,
  LuMail,
  LuMapPin,
  LuMessageCircle,
  LuPhone,
  LuYoutube,
} from 'react-icons/lu';
import { type CmsData } from '@/shared/cms-types';
import { BrandMark } from './site-branding';

const SOCIAL_ICONS = {
  facebook: LuFacebook,
  instagram: LuInstagram,
  linkedin: LuLinkedin,
  youtube: LuYoutube,
  whatsapp: LuMessageCircle,
  x: LuMessageCircle,
} as const;

export const SiteFooter = ({ cms }: { cms: CmsData }) => {
  const { settings } = cms;
  const links = cms.nav.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const year = new Date().getFullYear();

  return (
    <footer className="ee-bg-muted" style={{ borderTop: '1px solid var(--ee-line)' }}>
      <div className="ee-container" style={{ paddingBlock: 'clamp(40px, 6vw, 68px)' }}>
        <div className="ee-grid ee-grid-auto" style={{ gap: 40 }}>
          <div className="ee-stack ee-stack-sm">
            <BrandMark cms={cms} height={38} />
            <p className="ee-body" style={{ maxWidth: '34ch' }}>
              {settings.brandSubline}
            </p>
            {settings.companyRegistrationNumber ? (
              <p className="ee-mono ee-faint" style={{ fontSize: '0.76rem', margin: 0 }}>
                Company registration number {settings.companyRegistrationNumber}
              </p>
            ) : null}
            <div className="ee-row ee-row-xs" style={{ marginTop: 4 }}>
              {settings.socials
                .filter((social) => social.href)
                .map((social) => {
                  const Icon = SOCIAL_ICONS[social.icon] ?? LuFacebook;
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="ee-icon-btn"
                      aria-label={social.label}
                      title={social.label}
                    >
                      <Icon size={15} />
                    </a>
                  );
                })}
            </div>
          </div>

          <div className="ee-stack ee-stack-sm">
            <span className="ee-label">Our offices</span>
            {settings.offices.map((office) => (
              <div key={office.id} className="ee-stack" style={{ gap: 2 }}>
                <span className="ee-badge" style={{ alignSelf: 'flex-start' }}>
                  {office.label}
                </span>
                <p className="ee-body" style={{ fontSize: '0.85rem', margin: 0 }}>
                  <LuMapPin
                    size={13}
                    style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5, color: 'var(--ee-accent)' }}
                  />
                  {office.address}
                </p>
                {office.mapUrl ? (
                  <a
                    href={office.mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ee-accent"
                    style={{ fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    View on map
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          <div className="ee-stack ee-stack-sm">
            <span className="ee-label">Contact</span>
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="ee-row ee-row-xs ee-body" style={{ fontSize: '0.88rem' }}>
              <LuPhone size={13} /> {settings.phone}
            </a>
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer noopener"
              className="ee-row ee-row-xs ee-body"
              style={{ fontSize: '0.88rem' }}
            >
              <LuMessageCircle size={13} /> WhatsApp desk
            </a>
            <a href={`mailto:${settings.email}`} className="ee-row ee-row-xs ee-body" style={{ fontSize: '0.88rem' }}>
              <LuMail size={13} /> {settings.email}
            </a>
            <div className="ee-stack" style={{ gap: 2, marginTop: 4 }}>
              <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
                {settings.weekdayHours}
              </span>
              <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
                {settings.saturdayHours}
              </span>
              <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
                {settings.sundayHours}
              </span>
            </div>
          </div>
        </div>

        <hr className="ee-hairline" style={{ marginBlock: 30 }} />

        <div className="ee-row ee-row-between" style={{ gap: 16 }}>
          <nav className="ee-row ee-row-md" aria-label="Footer" style={{ flexWrap: 'wrap' }}>
            {links.map((item) => (
              <Link key={item.id} to={item.path} className="ee-muted" style={{ fontSize: '0.84rem' }}>
                {item.label}
              </Link>
            ))}
            <Link to="/policies" className="ee-muted" style={{ fontSize: '0.84rem' }}>
              Policies
            </Link>
          </nav>
          <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
            © {String(year)} {settings.brandName}
          </span>
        </div>

        {settings.footerNote ? (
          <p className="ee-faint" style={{ fontSize: '0.75rem', marginTop: 18, maxWidth: '86ch' }}>
            {settings.footerNote}
          </p>
        ) : null}
      </div>
    </footer>
  );
};
