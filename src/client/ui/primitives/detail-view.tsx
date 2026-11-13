import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { LuArrowRight, LuChevronRight } from 'react-icons/lu';
import { Reveal, Parallax } from './motion';
import { SmartImage } from './media';
import { Badge, Card } from './ui';
import { Section } from './blocks';

export interface DetailFact {
  label: string;
  value: string;
}

interface DetailViewProps {
  breadcrumb: { label: string; to?: string }[];
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: string;
  facts: DetailFact[];
  intro?: string;
  bullets?: { heading: string; points: string[] }[];
  badge?: string;
  ctaLabel: string;
  onConsult: () => void;
  children?: ReactNode;
}

/**
 * Shared layout for destination, course, role and article detail routes.
 * Every detail page passes data + facts; the chrome is written once.
 */
export const DetailView = ({
  breadcrumb,
  eyebrow,
  title,
  subtitle,
  image,
  facts,
  intro,
  bullets = [],
  badge,
  ctaLabel,
  onConsult,
  children,
}: DetailViewProps) => (
  <Section block={{ id: 'detail', background: 'surface' }}>
    <Reveal>
      <nav className="ee-row ee-row-xs ee-mono" style={{ fontSize: '0.74rem' }} aria-label="Breadcrumb">
        {breadcrumb.map((crumb, index) => (
          <span key={`${crumb.label}-${String(index)}`} className="ee-row ee-row-xs">
            {index > 0 ? <LuChevronRight size={11} /> : null}
            {crumb.to ? (
              <Link to={crumb.to} className="ee-muted">
                {crumb.label}
              </Link>
            ) : (
              <span className="ee-faint">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </Reveal>

    <div className="ee-stack ee-stack-md" style={{ marginTop: 20 }}>
      <Reveal>
        <div className="ee-row ee-row-sm">
          <span className="ee-eyebrow">{eyebrow}</span>
          {badge ? <Badge tone="accent">{badge}</Badge> : null}
        </div>
      </Reveal>

      <Reveal delay={60} variant="mask">
        <h1 className="ee-h1" style={{ maxWidth: '22ch' }}>
          {title}
        </h1>
      </Reveal>

      {subtitle ? (
        <Reveal delay={110}>
          <p className="ee-lead">{subtitle}</p>
        </Reveal>
      ) : null}

      <Reveal delay={150}>
        <button type="button" className="ee-btn ee-btn-primary ee-btn-lg" onClick={onConsult}>
          {ctaLabel} <LuArrowRight size={15} />
        </button>
      </Reveal>
    </div>

    {image ? (
      <Reveal variant="scale" delay={180}>
        <Parallax distance={22}>
          <div className="ee-figure" style={{ marginTop: 34, aspectRatio: '21 / 9' }}>
            <SmartImage src={image} alt={title} seed={title} loading="eager" />
          </div>
        </Parallax>
      </Reveal>
    ) : null}

    <div className="ee-grid ee-grid-4" style={{ marginTop: 30, gap: 12 }}>
      {facts.map((fact, index) => (
        <Reveal key={fact.label} delay={index * 55}>
          <Card className="ee-full">
            <span className="ee-label">{fact.label}</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 4 }}>{fact.value}</div>
          </Card>
        </Reveal>
      ))}
    </div>

    {intro ? (
      <Reveal>
        <p className="ee-body" style={{ marginTop: 30, fontSize: '1.02rem', maxWidth: '78ch' }}>
          {intro}
        </p>
      </Reveal>
    ) : null}

    {bullets.length > 0 ? (
      <div className="ee-grid ee-grid-2" style={{ marginTop: 34 }}>
        {bullets.map((group, index) => (
          <Reveal key={group.heading} delay={index * 70}>
            <Card className="ee-full" style={{ height: '100%' }}>
              <h2 className="ee-h4" style={{ marginBottom: 12 }}>
                {group.heading}
              </h2>
              <ul className="ee-stack ee-stack-xs" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.points.map((point) => (
                  <li key={point} className="ee-row ee-row-xs" style={{ alignItems: 'flex-start' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--ee-accent)',
                        marginTop: 9,
                        flexShrink: 0,
                      }}
                    />
                    <span className="ee-body" style={{ fontSize: '0.9rem' }}>
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        ))}
      </div>
    ) : null}

    {children}
  </Section>
);
