import { useRef } from 'react';
import {
  LuArrowRight,
  LuBadgeCheck,
  LuGraduationCap,
  LuMessageCircle,
  LuSparkles,
} from 'react-icons/lu';
import { motion, useScroll, useTransform } from 'framer-motion';
import { type CmsData, type PageDoc } from '@/shared/cms-types';
import { SmartImage } from '../primitives/media';
import { Reveal, Scramble, CountUp } from '../primitives/motion';
import { ActionLink, Badge } from '../primitives/ui';

/* ------------------------------------------------------------------ *
 * Home hero — centred, typographic, Raycast-style landing
 * ------------------------------------------------------------------ */

export const HomeHero = ({
  cms,
  page,
  onConsult,
}: {
  cms: CmsData;
  page: PageDoc;
  onConsult: () => void;
}) => {
  const { settings } = cms;
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-linked depth: the photograph drifts slower than the copy, the
  // colour mesh slower still, and the copy lifts and fades as you leave.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const backdropY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.2]);
  const meshY = useTransform(scrollYProgress, [0, 1], [0, 96]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0.3]);

  const highlight = page.heroHighlight || settings.heroHighlight;

  return (
    <section ref={sectionRef} className="ee-hero" aria-labelledby="hero-title">
      <motion.div className="ee-hero-backdrop" aria-hidden="true" style={{ y: backdropY }}>
        <motion.img
          src="/media/hero-backdrop.png"
          alt=""
          loading="eager"
          decoding="async"
          style={{ scale: backdropScale }}
        />
      </motion.div>

      <motion.div className="ee-hero-mesh" aria-hidden="true" style={{ y: meshY }}>
        <span style={{ top: '6%', left: '4%', width: 420, height: 420, background: 'rgba(226,152,58,0.17)' }} />
        <span style={{ top: '32%', right: '2%', width: 480, height: 480, background: 'rgba(37,86,196,0.14)' }} />
        <span style={{ bottom: '-6%', left: '38%', width: 380, height: 380, background: 'rgba(20,140,132,0.11)' }} />
      </motion.div>
      <div className="ee-grid-lines" aria-hidden="true" />

      <motion.div className="ee-container ee-z1" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="ee-hero-center">
          <div className="ee-stack ee-stack-md ee-center">
            {settings.announcementEnabled && settings.announcementText ? (
              <Reveal>
                <div className="ee-row ee-row-sm ee-justify-center">
                  <Badge tone="accent">
                    <LuSparkles size={11} /> {settings.announcementText}
                  </Badge>
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={60}>
              <span className="ee-eyebrow">{page.heroEyebrow || settings.heroBadge}</span>
            </Reveal>

            <Reveal delay={110} variant="mask">
              <h1 id="hero-title" className="ee-h1 ee-hero-title">
                {page.heroTitle || settings.heroTitle}{' '}
                <span className="ee-accent">{highlight}</span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="ee-lead ee-hero-lead">{page.heroSubtitle || settings.heroSubtitle}</p>
            </Reveal>

            <Reveal delay={240}>
              <div className="ee-row ee-row-sm ee-justify-center">
                {page.heroActions.map((action, index) =>
                  action.href === '#consultation' ? (
                    <button
                      key={action.id}
                      type="button"
                      className={`ee-btn ${action.variant === 'primary' ? 'ee-btn-primary' : 'ee-btn-secondary'} ee-btn-lg`}
                      onClick={onConsult}
                    >
                      {action.label}
                      <LuArrowRight size={15} />
                    </button>
                  ) : (
                    <ActionLink
                      key={action.id}
                      href={action.href}
                      className={`ee-btn-lg ${action.variant === 'primary' ? '' : 'ee-btn-secondary'}`}
                    >
                      {action.label}
                      {index === 0 ? <LuArrowRight size={15} /> : null}
                    </ActionLink>
                  )
                )}
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ee-btn ee-btn-secondary ee-btn-lg"
                >
                  <LuMessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="ee-row ee-row-md ee-justify-center" style={{ flexWrap: 'wrap', rowGap: 10 }}>
                {[
                  { icon: <LuBadgeCheck size={14} />, label: 'Registered in the UK' },
                  { icon: <LuGraduationCap size={14} />, label: '6 country corridors' },
                  { icon: <LuMessageCircle size={14} />, label: '48-hour written shortlist' },
                ].map((item) => (
                  <span key={item.label} className="ee-row ee-row-xs ee-muted" style={{ fontSize: '0.82rem' }}>
                    <span className="ee-accent">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={340}>
          <div className="ee-grid ee-grid-4" style={{ marginTop: 'clamp(26px, 3.6vw, 46px)', gap: 12 }}>
            {settings.stats.slice(0, 4).map((stat) => (
              <div
                key={stat.id}
                className="ee-card ee-stage"
                style={{ padding: '16px 18px', flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <div className="ee-h3 ee-accent" style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                  <CountUp value={stat.value} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{stat.label}</div>
                  <div className="ee-faint" style={{ fontSize: '0.73rem' }}>
                    {stat.sublabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
};

/* ------------------------------------------------------------------ *
 * Inner page hero — shared by every route
 * ------------------------------------------------------------------ */

export const PageHero = ({ page, cms }: { page: PageDoc; cms: CmsData }) => (
  <section
    className="ee-hero ee-bg-gradient"
    style={{ paddingBottom: 'clamp(34px, 5vw, 58px)' }}
    aria-labelledby="page-title"
  >
    <div className="ee-grid-lines" aria-hidden="true" />
    <div className="ee-container ee-z1">
      <Reveal>
        <span className="ee-eyebrow">{page.heroEyebrow}</span>
      </Reveal>
      <Reveal delay={70} variant="mask">
        <h1 id="page-title" className="ee-h1" style={{ marginTop: 14, maxWidth: '20ch' }}>
          {page.heroTitle}{' '}
          {page.heroHighlight ? <span className="ee-accent">{page.heroHighlight}</span> : null}
        </h1>
      </Reveal>
      {page.heroSubtitle ? (
        <Reveal delay={140}>
          <p className="ee-lead" style={{ marginTop: 16 }}>
            {page.heroSubtitle}
          </p>
        </Reveal>
      ) : null}
      {page.heroActions.length > 0 ? (
        <Reveal delay={200}>
          <div className="ee-row ee-row-sm" style={{ marginTop: 22 }}>
            {page.heroActions.map((action) => (
              <ActionLink key={action.id} href={action.href}>
                {action.label} <LuArrowRight size={14} />
              </ActionLink>
            ))}
          </div>
        </Reveal>
      ) : null}
      {page.heroImage ? (
        <Reveal delay={240} variant="scale">
          <div className="ee-figure" style={{ marginTop: 34, aspectRatio: '21 / 8' }}>
            <SmartImage src={page.heroImage} alt={page.title} seed={page.slug} loading="eager" />
          </div>
        </Reveal>
      ) : null}
      <span className="ee-sr">
        <Scramble text={cms.settings.brandName} />
      </span>
    </div>
  </section>
);
