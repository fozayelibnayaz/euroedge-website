import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  LuArrowRight,
  LuCheck,
  LuChevronDown,
  LuMapPin,
  LuPhone,
  LuStar,
} from 'react-icons/lu';
import {
  type BlockItem,
  type BlogPost,
  type CmsData,
  type ContentBlock,
  type CourseItem,
  type FaqItem,
  type RecruitmentRole,
  type ServiceItem,
  type StudyDestination,
  type TeamMember,
  type TestimonialItem,
} from '@/shared/cms-types';
import { Card, SectionHeading } from './ui';
import { Showreel, SmartImage } from './media';
import { RailFrame } from './rail';
import { Reveal, CountUp, Marquee, Tilt, Spotlight, Parallax } from './motion';
import { SecuredInquiryForm } from './inquiry-form';
import { HeroParallaxStage } from '../showcase/hero-parallax-stage';
import { PathwayConfigurator } from '../showcase/pathway-configurator';
import { ArchitecturalStoryParallax } from '../showcase/architectural-story-parallax';
import { DestinationsBentoShowcase } from '../showcase/destinations-bento-showcase';
import { CoursesStudioSection } from '../showcase/courses-studio-section';

const backgroundClass: Record<ContentBlock['background'], string> = {
  surface: 'ee-bg-surface',
  muted: 'ee-bg-muted',
  gradient: 'ee-bg-gradient',
  ink: 'ee-bg-ink',
  none: 'ee-bg-none',
};

export const Section = ({
  block,
  children,
  wide = false,
}: {
  block: Pick<ContentBlock, 'background' | 'id'>;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <section
    id={block.id}
    className={`ee-section ${backgroundClass[block.background] ?? 'ee-bg-surface'}`.trim()}
  >
    <span className="ee-laser" aria-hidden="true" />
    <RailFrame wide={wide}>{children}</RailFrame>
  </section>
);

/* ------------------------------------------------------------------ *
 * Source resolution — turns a CMS collection into renderable items
 * ------------------------------------------------------------------ */

const resolveItems = (block: ContentBlock, cms: CmsData): BlockItem[] => {
  switch (block.source) {
    case 'destinations':
      return cms.destinations.slice(0, block.limit).map<BlockItem>((item: StudyDestination) => ({
        id: item.id,
        title: item.country,
        subtitle: item.tagline,
        body: item.overview,
        meta: item.tuitionRange,
        tag: item.region,
        badge: item.code,
        image: item.heroImage,
        video: '',
        href: `/study/${item.slug}`,
        accent: item.accent,
        points: item.requirements.slice(0, 4),
      }));
    case 'courses':
      return cms.courses.slice(0, block.limit).map<BlockItem>((item: CourseItem) => ({
        id: item.id,
        title: item.title,
        subtitle: item.level,
        body: item.summary,
        meta: `${item.currency}${item.discountedPrice}`,
        tag: item.duration,
        badge: item.badge,
        image: item.image,
        video: '',
        href: `/courses/${item.slug}`,
        accent: '',
        points: item.highlights.slice(0, 3),
      }));
    case 'roles':
      return cms.roles.slice(0, block.limit).map<BlockItem>((item: RecruitmentRole) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.sector} · ${item.country}`,
        body: item.summary,
        meta: item.salary,
        tag: item.city || item.country,
        badge: item.status === 'open' ? 'Open' : item.status === 'closing_soon' ? 'Closing soon' : 'Closed',
        image: item.image,
        video: '',
        href: `/recruitment/${item.slug}`,
        accent: '',
        points: item.requirements.slice(0, 3),
      }));
    case 'posts':
      return cms.posts.slice(0, block.limit).map<BlockItem>((item: BlogPost) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.category} · ${item.readTime}`,
        body: item.excerpt,
        meta: item.publishedAt,
        tag: item.category,
        badge: '',
        image: item.coverImage,
        video: '',
        href: `/blog/${item.slug}`,
        accent: '',
        points: [],
      }));
    case 'services':
      return cms.services.slice(0, block.limit).map<BlockItem>((item: ServiceItem) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        body: item.description,
        meta: item.stepNumber,
        tag: '',
        badge: '',
        image: '',
        video: '',
        href: `/services#${item.slug}`,
        accent: '',
        points: item.deliverables,
      }));
    case 'team':
      return cms.team.slice(0, block.limit).map<BlockItem>((item: TeamMember) => ({
        id: item.id,
        title: item.name,
        subtitle: item.role,
        body: item.bio,
        meta: '',
        tag: '',
        badge: '',
        image: item.photo,
        video: '',
        href: '',
        accent: '',
        points: [],
      }));
    case 'testimonials':
      return cms.testimonials.slice(0, block.limit).map<BlockItem>((item: TestimonialItem) => ({
        id: item.id,
        title: item.name,
        subtitle: item.program || item.destination,
        body: item.quote,
        meta: item.destination,
        tag: '',
        badge: '',
        image: item.avatar,
        video: '',
        href: '',
        accent: '',
        points: [],
      }));
    case 'faqs':
      return cms.faqs.slice(0, block.limit).map<BlockItem>((item: FaqItem) => ({
        id: item.id,
        title: item.question,
        subtitle: item.category,
        body: item.answer,
        meta: '',
        tag: item.category,
        badge: '',
        image: '',
        video: '',
        href: '',
        accent: '',
        points: [],
      }));
    default:
      return block.items;
  }
};

/* ------------------------------------------------------------------ *
 * Block layouts
 * ------------------------------------------------------------------ */

const ItemCard = ({
  item,
  showImage = true,
  accent,
}: {
  item: BlockItem;
  showImage?: boolean;
  accent?: string;
}) => {
  const body = (
    <Card hover className="ee-full" style={{ height: '100%' }}>
      {showImage && item.image ? (
        <div className="ee-card-media" style={{ marginBottom: 16, borderRadius: 10 }}>
          <SmartImage src={item.image} alt={item.title} seed={item.id} />
        </div>
      ) : null}
      <div className="ee-stack ee-stack-xs ee-grow">
        {item.badge ? (
          <span className="ee-badge ee-badge-accent" style={{ alignSelf: 'flex-start' }}>
            {item.badge}
          </span>
        ) : null}
        <h3 className="ee-h3">{item.title}</h3>
        {item.subtitle ? (
          <span className="ee-mono ee-muted" style={{ fontSize: '0.76rem' }}>
            {item.subtitle}
          </span>
        ) : null}
        {item.body ? (
          <p className="ee-body ee-clamp-3" style={{ marginTop: 4 }}>
            {item.body}
          </p>
        ) : null}
        {item.points.length > 0 ? (
          <ul className="ee-stack ee-stack-xs" style={{ listStyle: 'none', padding: 0, marginTop: 6 }}>
            {item.points.slice(0, 3).map((point) => (
              <li key={point} className="ee-row ee-row-xs" style={{ alignItems: 'flex-start', fontSize: '0.84rem' }}>
                <LuCheck size={13} style={{ color: accent ?? 'var(--ee-accent)', marginTop: 4, flexShrink: 0 }} />
                <span className="ee-muted">{point}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {item.meta ? (
        <div
          className="ee-row ee-row-between"
          style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ee-line)' }}
        >
          <span className="ee-mono" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {item.meta}
          </span>
          {item.href ? (
            <span className="ee-row ee-row-xs ee-accent" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Detail <LuArrowRight size={13} />
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );

  if (item.href) {
    return (
      <Link to={item.href} className="ee-full" style={{ display: 'block' }}>
        {body}
      </Link>
    );
  }
  return body;
};

const gridClass = (columns: number): string => {
  if (columns >= 4) {
    return 'ee-grid ee-grid-4';
  }
  if (columns === 3) {
    return 'ee-grid ee-grid-3';
  }
  if (columns === 2) {
    return 'ee-grid ee-grid-2';
  }
  return 'ee-grid ee-grid-auto';
};

/* ------------------------------------------------------------------ *
 * Individual block renderers
 * ------------------------------------------------------------------ */

interface NormalisedStat {
  id: string;
  value: string;
  label: string;
  sublabel: string;
}

const normaliseStats = (block: ContentBlock, cms: CmsData): NormalisedStat[] => {
  if (block.items.length > 0) {
    return block.items.map((item) => ({
      id: item.id,
      value: item.meta || item.title,
      label: item.subtitle || item.body,
      sublabel: item.tag,
    }));
  }
  return cms.settings.stats.slice(0, block.limit).map((stat) => ({
    id: stat.id,
    value: stat.value,
    label: stat.label,
    sublabel: stat.sublabel,
  }));
};

const StatsBlock = ({ block, cms }: { block: ContentBlock; cms: CmsData }) => {
  const stats = normaliseStats(block, cms);

  return (
    <Section block={block}>
      <Reveal>
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
          align={block.layout === 'center' ? 'center' : 'left'}
        />
      </Reveal>
      <div className={gridClass(block.columns)} style={{ marginTop: 34, gap: 14 }}>
        {stats.map((stat, index) => (
          <Reveal key={`${block.id}-${stat.id}`} delay={index * 70}>
            <Card className="ee-full ee-center">
              <div
                className="ee-h2"
                style={{ color: 'var(--ee-accent)', fontVariantNumeric: 'tabular-nums' }}
              >
                <CountUp value={stat.value || '0'} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: 6 }}>{stat.label}</div>
              {stat.sublabel ? (
                <div className="ee-faint" style={{ fontSize: '0.78rem', marginTop: 2 }}>
                  {stat.sublabel}
                </div>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
};

const FeaturesBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block}>
    <Reveal>
      <SectionHeading
        eyebrow={block.eyebrow}
        title={block.title}
        subtitle={block.subtitle}
        align={block.layout === 'center' ? 'center' : 'left'}
      />
    </Reveal>
    <div className={gridClass(block.columns)} style={{ marginTop: 34 }}>
      {items.map((item, index) => (
        <Reveal key={item.id} delay={index * 70}>
          <Spotlight>
            <Card hover className="ee-full" style={{ height: '100%' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: item.accent || 'var(--ee-accent)',
                  opacity: 0.14,
                  marginBottom: 14,
                }}
              />
              <h3 className="ee-h3">{item.title}</h3>
              {item.subtitle ? (
                <span className="ee-mono ee-muted" style={{ fontSize: '0.74rem' }}>
                  {item.subtitle}
                </span>
              ) : null}
              <p className="ee-body" style={{ marginTop: 8 }}>
                {item.body}
              </p>
            </Card>
          </Spotlight>
        </Reveal>
      ))}
    </div>
  </Section>
);

const ShowcaseBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (block.layout === 'rail') {
    return (
      <Section block={block} wide>
        <Reveal>
          <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
        </Reveal>
        <div className="ee-grid ee-grid-hero" style={{ marginTop: 34, alignItems: 'start' }}>
          <div className="ee-stack ee-stack-xs" style={{ gap: 0 }}>
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveId(item.id); }}
                className="ee-row ee-row-between"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 0,
                  borderBottom: '1px solid var(--ee-line)',
                  padding: '18px 4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                <span className="ee-row ee-row-md" style={{ minWidth: 0 }}>
                  <span className="ee-mono ee-faint" style={{ fontSize: '0.74rem' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '1rem' }}>{item.title}</span>
                    <span className="ee-muted ee-clamp-2" style={{ fontSize: '0.84rem' }}>
                      {item.subtitle}
                    </span>
                  </span>
                </span>
                <LuArrowRight
                  size={16}
                  style={{
                    color: active?.id === item.id ? 'var(--ee-accent)' : 'var(--ee-faint)',
                    transform: active?.id === item.id ? 'translateX(0)' : 'translateX(-6px)',
                    transition: 'transform .3s var(--ee-ease), color .3s ease',
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}
          </div>
          <div style={{ position: 'sticky', top: 96 }}>
            {active ? (
              <Reveal variant="scale">
                <Card flush>
                  <div className="ee-card-media" style={{ aspectRatio: '16 / 9' }}>
                    <SmartImage src={active.image} alt={active.title} seed={active.id} />
                  </div>
                  <div className="ee-stack ee-stack-sm" style={{ padding: 22 }}>
                    <span className="ee-badge ee-badge-accent" style={{ alignSelf: 'flex-start' }}>
                      {active.badge || active.tag}
                    </span>
                    <h3 className="ee-h3">{active.title}</h3>
                    <p className="ee-body">{active.body}</p>
                    <div
                      className="ee-row ee-row-between"
                      style={{ paddingTop: 12, borderTop: '1px solid var(--ee-line)' }}
                    >
                      <span className="ee-mono" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                        {active.meta}
                      </span>
                      <Link
                        to={active.href}
                        className="ee-row ee-row-xs ee-accent"
                        style={{ fontSize: '0.84rem', fontWeight: 600 }}
                      >
                        Open file <LuArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ) : null}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section block={block} wide={block.layout === 'bento'}>
      <Reveal>
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
          align={block.layout === 'bento' ? 'center' : 'left'}
        />
      </Reveal>
      <div className={gridClass(block.columns)} style={{ marginTop: 34 }}>
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 60}>
            <Tilt max={block.layout === 'bento' ? 6 : 4}>
              <ItemCard item={item} accent={item.accent} />
            </Tilt>
          </Reveal>
        ))}
      </div>
      {block.ctaLabel ? (
        <div className="ee-row" style={{ marginTop: 30, justifyContent: 'center' }}>
          <Link to={block.ctaHref || '#'} className="ee-btn ee-btn-secondary">
            {block.ctaLabel} <LuArrowRight size={14} />
          </Link>
        </div>
      ) : null}
      {block.footnote ? (
        <p className="ee-faint ee-center" style={{ fontSize: '0.8rem', marginTop: 18 }}>
          {block.footnote}
        </p>
      ) : null}
    </Section>
  );
};

const StepsBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block}>
    <Reveal>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    </Reveal>
    <div className="ee-stack ee-stack-sm" style={{ marginTop: 34 }}>
      {items.map((item, index) => (
        <Reveal key={item.id} delay={index * 60}>
          <div
            className="ee-row ee-row-md"
            style={{
              alignItems: 'flex-start',
              padding: '20px 0',
              borderTop: index === 0 ? '1px solid var(--ee-line)' : '1px solid var(--ee-line)',
              flexWrap: 'nowrap',
              gap: 22,
            }}
          >
            <div
              className="ee-mono"
              style={{
                minWidth: 46,
                height: 46,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--ee-accent-soft)',
                color: 'var(--ee-accent)',
                fontWeight: 600,
                fontSize: '0.86rem',
                flexShrink: 0,
              }}
            >
              {item.meta || String(index + 1).padStart(2, '0')}
            </div>
            <div className="ee-stack ee-stack-xs" style={{ minWidth: 0, flex: 1 }}>
              <div className="ee-row ee-row-sm">
                <h3 className="ee-h3" style={{ margin: 0 }}>
                  {item.title}
                </h3>
                {item.tag ? <span className="ee-badge">{item.tag}</span> : null}
              </div>
              <p className="ee-body">{item.body}</p>
              {item.points.length > 0 ? (
                <ul className="ee-stack ee-stack-xs" style={{ listStyle: 'none', padding: 0, marginTop: 4 }}>
                  {item.points.map((point) => (
                    <li key={point} className="ee-row ee-row-xs" style={{ alignItems: 'flex-start', fontSize: '0.85rem' }}>
                      <LuCheck size={13} style={{ color: 'var(--ee-accent)', marginTop: 4, flexShrink: 0 }} />
                      <span className="ee-muted">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
    {block.ctaLabel ? (
      <div style={{ marginTop: 26 }}>
        <Link to={block.ctaHref || '#'} className="ee-btn ee-btn-primary">
          {block.ctaLabel} <LuArrowRight size={14} />
        </Link>
      </div>
    ) : null}
  </Section>
);

const ShowreelBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block} wide>
    <div className="ee-grid ee-grid-hero" style={{ alignItems: 'center' }}>
      <div className="ee-stack ee-stack-md">
        <Reveal>
          <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
        </Reveal>
        <div className="ee-stack ee-stack-sm">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 60}>
              <div className="ee-row ee-row-md" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <span
                  className="ee-mono ee-faint"
                  style={{ fontSize: '0.72rem', minWidth: 74, paddingTop: 4 }}
                >
                  {item.meta}
                </span>
                <div className="ee-stack" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f2f6fd' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.86rem', color: '#b9c6dd' }}>{item.body}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        {block.ctaLabel ? (
          <Link to={block.ctaHref || '#'} className="ee-btn ee-btn-primary" style={{ alignSelf: 'flex-start' }}>
            {block.ctaLabel} <LuArrowRight size={14} />
          </Link>
        ) : null}
      </div>
      <Reveal variant="scale">
        <Parallax distance={26}>
          <Showreel scene={block.video} caption={block.footnote || undefined} />
        </Parallax>
      </Reveal>
    </div>
  </Section>
);

const TestimonialsBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => {
  if (block.layout === 'marquee') {
    return (
      <Section block={block}>
        <Reveal>
          <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
        </Reveal>
        <div style={{ marginTop: 32 }}>
          <Marquee speed={58}>
            {items.map((item) => (
              <Card key={item.id} style={{ width: 350, flexShrink: 0 }}>
                <div className="ee-row ee-row-xs" style={{ color: 'var(--ee-amber)', marginBottom: 10 }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LuStar key={`s-${String(index)}`} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="ee-body" style={{ minHeight: 92 }}>
                  “{item.body}”
                </p>
                <div
                  className="ee-row ee-row-between"
                  style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ee-line)' }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.title}</span>
                  <span className="ee-faint" style={{ fontSize: '0.76rem' }}>
                    {item.meta}
                  </span>
                </div>
              </Card>
            ))}
          </Marquee>
        </div>
      </Section>
    );
  }

  return (
    <Section block={block}>
      <Reveal>
        <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
      </Reveal>
      <div className={gridClass(block.columns)} style={{ marginTop: 32 }}>
        {items.map((item, index) => (
          <Reveal key={item.id} delay={index * 60}>
            <Card className="ee-full" style={{ height: '100%' }}>
              <div className="ee-row ee-row-xs" style={{ color: 'var(--ee-amber)', marginBottom: 10 }}>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <LuStar key={`s-${String(starIndex)}`} size={13} fill="currentColor" />
                ))}
              </div>
              <p className="ee-body">“{item.body}”</p>
              <div
                className="ee-row ee-row-between"
                style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ee-line)' }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.title}</span>
                <span className="ee-faint" style={{ fontSize: '0.76rem' }}>
                  {item.meta}
                </span>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
};

const FaqBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => {
  const [openId, setOpenId] = useState(items[0]?.id ?? '');
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.tag).filter(Boolean))),
    [items]
  );

  return (
    <Section block={block}>
      <div className="ee-grid ee-grid-hero" style={{ alignItems: 'start' }}>
        <div className="ee-stack ee-stack-sm" style={{ position: 'sticky', top: 96 }}>
          <Reveal>
            <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
          </Reveal>
          {categories.length > 1 ? (
            <Reveal delay={80}>
              <div className="ee-row ee-row-xs" style={{ marginTop: 8 }}>
                {categories.map((category) => (
                  <span key={category} className="ee-badge">
                    {category}
                  </span>
                ))}
              </div>
            </Reveal>
          ) : null}
          {block.ctaLabel ? (
            <Link to={block.ctaHref || '#'} className="ee-btn ee-btn-secondary" style={{ alignSelf: 'flex-start' }}>
              {block.ctaLabel} <LuArrowRight size={14} />
            </Link>
          ) : null}
        </div>
        <div className="ee-stack" style={{ gap: 0 }}>
          {items.map((item, index) => {
            const open = openId === item.id;
            return (
              <Reveal key={item.id} delay={index * 40}>
                <div style={{ borderBottom: '1px solid var(--ee-line)' }}>
                  <button
                    type="button"
                    onClick={() => { setOpenId(open ? '' : item.id); }}
                    className="ee-row ee-row-between"
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 0,
                      padding: '18px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: 16,
                    }}
                    aria-expanded={open}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{item.title}</span>
                    <LuChevronDown
                      size={17}
                      style={{
                        transition: 'transform .3s var(--ee-ease)',
                        transform: open ? 'rotate(180deg)' : 'none',
                        color: 'var(--ee-accent)',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: open ? '1fr' : '0fr',
                      transition: 'grid-template-rows .38s var(--ee-ease)',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <p className="ee-body" style={{ paddingBottom: 18, maxWidth: '68ch' }}>
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

const RichTextBlock = ({ block }: { block: ContentBlock }) => (
  <Section block={block}>
    <div
      className={block.layout === 'split' ? 'ee-grid ee-grid-2' : 'ee-stack ee-stack-md'}
      style={{ gap: block.layout === 'split' ? 44 : undefined }}
    >
      <Reveal>
        <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
      </Reveal>
      <div className="ee-stack ee-stack-md">
        {block.body.map((paragraph, index) => (
          <Reveal key={`${block.id}-p-${String(index)}`} delay={index * 70}>
            <p className="ee-body" style={{ fontSize: '1rem' }}>
              {paragraph}
            </p>
          </Reveal>
        ))}
      </div>
    </div>
    {block.footnote ? (
      <p className="ee-faint" style={{ fontSize: '0.82rem', marginTop: 26 }}>
        {block.footnote}
      </p>
    ) : null}
  </Section>
);

const CtaBlock = ({
  block,
  onConsult,
}: {
  block: ContentBlock;
  onConsult: (prefill?: { subject?: string }) => void;
}) => (
  <Section block={block}>
    <Reveal variant="scale">
      <div
        className="ee-panel ee-center ee-stack ee-stack-md"
        style={{ alignItems: 'center', padding: 'clamp(30px, 5vw, 58px)' }}
      >
        {block.eyebrow ? <span className="ee-eyebrow">{block.eyebrow}</span> : null}
        <h2 className="ee-h2" style={{ maxWidth: '22ch' }}>
          {block.title}
        </h2>
        {block.subtitle ? <p className="ee-lead ee-center">{block.subtitle}</p> : null}
        {block.ctaLabel ? (
          <button
            type="button"
            className="ee-btn ee-btn-primary ee-btn-lg"
            onClick={() => { onConsult({ subject: block.ctaLabel }); }}
          >
            {block.ctaLabel} <LuArrowRight size={15} />
          </button>
        ) : null}
        {block.footnote ? (
          <p className="ee-faint" style={{ fontSize: '0.8rem', margin: 0, maxWidth: '52ch' }}>
            {block.footnote}
          </p>
        ) : null}
      </div>
    </Reveal>
  </Section>
);

const GalleryBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block} wide>
    <Reveal>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    </Reveal>
    <div className={gridClass(block.columns)} style={{ marginTop: 30 }}>
      {items.map((item, index) => (
        <Reveal key={item.id} delay={index * 60} variant="scale">
          <Tilt max={6}>
            <div className="ee-figure">
              <SmartImage
                src={item.image}
                alt={item.title || item.subtitle || 'Gallery image'}
                seed={item.id}
                style={{ aspectRatio: '4 / 3', objectFit: 'cover', width: '100%' }}
              />
              {item.title ? (
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    padding: '5px 12px',
                    borderRadius: 999,
                    background: 'rgba(8,12,22,0.72)',
                    color: '#fff',
                    fontSize: '0.76rem',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {item.title}
                </div>
              ) : null}
            </div>
          </Tilt>
        </Reveal>
      ))}
    </div>
  </Section>
);

const LogosBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block}>
    <Reveal>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} align="center" />
    </Reveal>
    <div style={{ marginTop: 28 }}>
      <Marquee speed={40}>
        {items.map((item) => (
          <div
            key={item.id}
            className="ee-row ee-row-sm"
            style={{
              padding: '14px 26px',
              border: '1px solid var(--ee-line)',
              borderRadius: 999,
              background: 'var(--ee-surface)',
            }}
          >
            {item.image ? (
              <SmartImage
                src={item.image}
                alt={item.title}
                seed={item.id}
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
              />
            ) : null}
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.title}</span>
          </div>
        ))}
      </Marquee>
    </div>
  </Section>
);

const TableBlock = ({ block, items }: { block: ContentBlock; items: BlockItem[] }) => (
  <Section block={block} wide>
    <Reveal>
      <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    </Reveal>
    <div className="ee-table-wrap" style={{ marginTop: 28 }}>
      <table className="ee-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>Visa route</th>
            <th>Tuition</th>
            <th>Timeline</th>
            <th>Intakes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: 600 }}>
                <Link to={item.href} className="ee-accent">
                  {item.title}
                </Link>
              </td>
              <td className="ee-muted">{item.subtitle}</td>
              <td className="ee-mono">{item.meta}</td>
              <td className="ee-muted">{item.tag}</td>
              <td className="ee-muted">{item.badge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {block.footnote ? (
      <p className="ee-faint" style={{ fontSize: '0.8rem', marginTop: 14 }}>
        {block.footnote}
      </p>
    ) : null}
  </Section>
);

const ContactBlock = ({ block, cms }: { block: ContentBlock; cms: CmsData }) => (
  <Section block={block}>
    <div className="ee-grid ee-grid-hero" style={{ alignItems: 'start' }}>
      <Reveal>
        <div className="ee-stack ee-stack-md">
          <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
          <div className="ee-stack ee-stack-sm">
            {cms.settings.offices.map((office) => (
              <Card key={office.id}>
                <div className="ee-row ee-row-between">
                  <span className="ee-badge ee-badge-accent">{office.label}</span>
                  {office.isPrimary ? <span className="ee-badge ee-badge-good">Primary</span> : null}
                </div>
                <p className="ee-body" style={{ marginTop: 10, marginBottom: 0 }}>
                  <LuMapPin
                    size={14}
                    style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6, color: 'var(--ee-accent)' }}
                  />
                  {office.address}
                </p>
                {office.mapUrl ? (
                  <a
                    href={office.mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ee-accent"
                    style={{ fontSize: '0.84rem', fontWeight: 600, marginTop: 8, display: 'inline-block' }}
                  >
                    Open in Maps <LuArrowRight size={12} style={{ display: 'inline', verticalAlign: -1 }} />
                  </a>
                ) : null}
                <div className="ee-row ee-row-md" style={{ marginTop: 10 }}>
                  {office.phone ? (
                    <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="ee-row ee-row-xs ee-muted" style={{ fontSize: '0.85rem' }}>
                      <LuPhone size={13} /> {office.phone}
                    </a>
                  ) : null}
                  {office.hours ? (
                    <span className="ee-faint" style={{ fontSize: '0.8rem' }}>
                      {office.hours}
                    </span>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal variant="scale">
        <SecuredInquiryForm />
      </Reveal>
    </div>
  </Section>
);


/* ------------------------------------------------------------------ *
 * Raycast / Framer signature systems
 * ------------------------------------------------------------------ */

export const HeroStageBlock = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => (
  <Section block={block} wide>
    <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    <Reveal variant="scale" delay={60}>
      <HeroParallaxStage block={block} cms={cms} onConsult={onConsult} />
    </Reveal>
  </Section>
);

export const KeybedBlock = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => (
  <Section block={block} wide>
    <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    <Reveal delay={40}>
      <PathwayConfigurator block={block} cms={cms} onConsult={onConsult} />
    </Reveal>
  </Section>
);

export const StoryLineBlock = ({ block, cms }: { block: ContentBlock; cms: CmsData }) => (
  <Section block={block}>
    <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    <ArchitecturalStoryParallax block={block} cms={cms} />
  </Section>
);

export const CorridorLedgerBlock = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => (
  <Section block={block} wide>
    <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    <Reveal delay={40}>
      <DestinationsBentoShowcase block={block} cms={cms} onConsult={onConsult} />
    </Reveal>
  </Section>
);

export const CourseStudioBlock = ({ block, cms }: { block: ContentBlock; cms: CmsData }) => (
  <Section block={block} wide>
    <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
    <Reveal delay={40}>
      <CoursesStudioSection block={block} cms={cms} />
    </Reveal>
  </Section>
);

/* ------------------------------------------------------------------ *
 * Registry — unknown types fall back to a safe generic renderer
 * ------------------------------------------------------------------ */

export const BlockRenderer = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => {
  const items = useMemo(() => resolveItems(block, cms), [block, cms]);

  if (!block.visible) {
    return null;
  }

  switch (block.type) {
    case 'stats':
      return <StatsBlock block={block} cms={cms} />;
    case 'features':
      return <FeaturesBlock block={block} items={items} />;
    case 'showcase':
      return <ShowcaseBlock block={block} items={items} />;
    case 'steps':
      return <StepsBlock block={block} items={items} />;
    case 'showreel':
      return <ShowreelBlock block={block} items={items} />;
    case 'testimonials':
      return <TestimonialsBlock block={block} items={items} />;
    case 'faq':
      return <FaqBlock block={block} items={items} />;
    case 'richText':
      return <RichTextBlock block={block} />;
    case 'gallery':
      return <GalleryBlock block={block} items={items} />;
    case 'logos':
      return <LogosBlock block={block} items={items} />;
    case 'table':
      return <TableBlock block={block} items={items} />;
    case 'contact':
      return <ContactBlock block={block} cms={cms} />;
    case 'cta':
    case 'priceGrid':
      return <CtaBlock block={block} onConsult={onConsult} />;
    case 'heroStage':
      return <HeroStageBlock block={block} cms={cms} onConsult={onConsult} />;
    case 'keybed':
      return <KeybedBlock block={block} cms={cms} onConsult={onConsult} />;
    case 'storyLine':
      return <StoryLineBlock block={block} cms={cms} />;
    case 'corridorLedger':
      return <CorridorLedgerBlock block={block} cms={cms} onConsult={onConsult} />;
    case 'courseStudio':
      return <CourseStudioBlock block={block} cms={cms} />;
    default:
      return (
        <Section block={block}>
          <SectionHeading eyebrow={block.eyebrow} title={block.title} subtitle={block.subtitle} />
          {items.length > 0 ? (
            <div className={gridClass(block.columns)} style={{ marginTop: 28 }}>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </Section>
      );
  }
};
