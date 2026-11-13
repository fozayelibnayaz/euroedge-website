import { useState, type ReactNode } from 'react';
import { LuPlus, LuSearch } from 'react-icons/lu';
import {
  createId,
  slugify,
  type BlogPost,
  type CmsData,
  type ContentBlock,
  type CourseItem,
  type FaqItem,
  type MediaItem,
  type NavItem,
  type RecruitmentRole,
  type ServiceItem,
  type StatItem,
  type StudyDestination,
  type TeamMember,
  type TestimonialItem,
} from '@/shared/cms-types';
import { Button, EmptyState, Field, SectionHeading } from '../primitives/ui';
import {
  ImageField,
  NumberField,
  ParagraphListField,
  SelectField,
  StringListField,
  TextAreaField,
  TextField,
  ToggleField,
} from './fields';

/* ------------------------------------------------------------------ *
 * Generic collection editor — every list in the admin uses this shell
 * ------------------------------------------------------------------ */

export interface CollectionPanelProps<T extends { id: string }> {
  title: string;
  description: string;
  items: T[];
  onChange: (next: T[]) => void;
  createItem: () => T;
  titleOf: (item: T) => string;
  metaOf?: (item: T) => string;
  renderForm: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  searchable?: boolean;
}

export const CollectionPanel = <T extends { id: string }>({
  title,
  description,
  items,
  onChange,
  createItem,
  titleOf,
  metaOf,
  renderForm,
  searchable = true,
}: CollectionPanelProps<T>) => {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter(
      (item) =>
        titleOf(item).toLowerCase().includes(needle) ||
          (metaOf?.(item) ?? '').toLowerCase().includes(needle)
    )
    : items;

  const update = (id: string, patch: Partial<T>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const remove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    if (openId === id) {
      setOpenId(null);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="ee-stack ee-stack-md">
      <div className="ee-row ee-row-between" style={{ gap: 14, flexWrap: 'wrap' }}>
        <SectionHeading title={title} subtitle={description} />
        <Button
          icon={<LuPlus size={14} />}
          onClick={() => {
            const item = createItem();
            onChange([item, ...items]);
            setOpenId(item.id);
          }}
        >
          Add new
        </Button>
      </div>

      {searchable && items.length > 4 ? (
        <Field>
          <div className="ee-row ee-row-sm" style={{ flexWrap: 'nowrap', maxWidth: 420 }}>
            <LuSearch size={15} className="ee-faint" />
            <input
              className="ee-input"
              placeholder={`Filter ${title.toLowerCase()}…`}
              value={query}
              onChange={(event) => { setQuery(event.target.value); }}
            />
          </div>
        </Field>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState>
          {items.length === 0 ? `No ${title.toLowerCase()} yet. Add your first one.` : 'No matches.'}
        </EmptyState>
      ) : (
        <div className="ee-stack ee-stack-sm">
          {visible.map((item) => {
            const index = items.findIndex((entry) => entry.id === item.id);
            const open = openId === item.id;
            return (
              <div key={item.id} className="ee-panel" style={{ padding: 16 }}>
                <div className="ee-row ee-row-between" style={{ gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => { setOpenId(open ? null : item.id); }}
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: 0,
                      flex: 1,
                    }}
                    aria-expanded={open}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>
                      {titleOf(item) || 'Untitled'}
                    </div>
                    {metaOf?.(item) ? (
                      <div className="ee-faint" style={{ fontSize: '0.78rem' }}>
                        {metaOf(item)}
                      </div>
                    ) : null}
                  </button>
                  <div className="ee-row ee-row-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { move(index, -1); }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { move(index, 1); }}
                      disabled={index === items.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setOpenId(open ? null : item.id); }}
                    >
                      {open ? 'Close' : 'Edit'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => { remove(item.id); }}>
                      Delete
                    </Button>
                  </div>
                </div>
                {open ? (
                  <div className="ee-stack ee-stack-sm" style={{ marginTop: 16 }}>
                    {renderForm(item, (patch) => { update(item.id, patch); })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Field helpers shared by the panels below
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Destinations
 * ------------------------------------------------------------------ */

export const DestinationsPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: StudyDestination[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<StudyDestination>
    title="Study destinations"
    description="Countries, visa routes, costs and requirements. Edit one and every page updates."
    items={cms.destinations}
    onChange={patch}
    titleOf={(item) => item.country}
    metaOf={(item) => `${item.region} · /study/${item.slug}`}
    createItem={() => ({
      id: createId('dest'),
      slug: `study-in-${createId('x').slice(-4)}`,
      country: 'New destination',
      region: 'Europe & UK',
      code: 'NEW',
      tagline: 'One-line summary shown on cards.',
      heroImage: '',
      overview: 'Describe the route honestly: costs, timelines and post-study work rights.',
      visaCategory: 'Visa route name',
      visaTimeline: '4 – 8 weeks',
      visaFee: 'Fee',
      tuitionRange: 'Range per year',
      intakeMonths: 'September · January',
      postStudyWork: 'Post-study rights',
      accent: '#1D4ED8',
      fields: [],
      requirements: [],
      universities: [],
      featured: true,
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField
            label="Country"
            value={item.country}
            onChange={(next) => {
              update({
                country: next,
                slug: item.slug.startsWith('study-in-x') ? `study-in-${slugify(next)}` : item.slug,
              }); 
            }
            }
          />
          <TextField
            label="URL slug"
            value={item.slug}
            mono
            onChange={(next) => { update({ slug: slugify(next) }); }}
            hint={`/study/${item.slug}`}
          />
          <TextField label="Region" value={item.region} onChange={(next) => { update({ region: next }); }} />
          <TextField label="Code (2–4 letters)" value={item.code} onChange={(next) => { update({ code: next.slice(0, 4) }); }} />
        </div>
        <TextField label="Card tagline" value={item.tagline} onChange={(next) => { update({ tagline: next }); }} />
        <TextAreaField label="Overview" value={item.overview} rows={5} onChange={(next) => { update({ overview: next }); }} />
        <ImageField
          label="Hero image"
          value={item.heroImage}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ heroImage: next }); }}
        />
        <div className="ee-field-grid">
          <TextField label="Visa route" value={item.visaCategory} onChange={(next) => { update({ visaCategory: next }); }} />
          <TextField label="Decision time" value={item.visaTimeline} onChange={(next) => { update({ visaTimeline: next }); }} />
          <TextField label="Visa fee" value={item.visaFee} onChange={(next) => { update({ visaFee: next }); }} />
          <TextField label="Tuition range" value={item.tuitionRange} onChange={(next) => { update({ tuitionRange: next }); }} />
          <TextField label="Intake months" value={item.intakeMonths} onChange={(next) => { update({ intakeMonths: next }); }} />
          <TextField label="Post-study work" value={item.postStudyWork} onChange={(next) => { update({ postStudyWork: next }); }} />
        </div>
        <StringListField
          label="Strong fields"
          items={item.fields}
          onChange={(next) => { update({ fields: next }); }}
        />
        <StringListField
          label="Requirements checklist"
          items={item.requirements}
          onChange={(next) => { update({ requirements: next }); }}
        />
        <div className="ee-stack ee-stack-sm">
          <span className="ee-label">Universities</span>
          {item.universities.map((uni, index) => (
            <div key={`${uni.name}-${String(index)}`} className="ee-row ee-row-xs" style={{ flexWrap: 'nowrap' }}>
              <input
                className="ee-input"
                value={uni.name}
                placeholder="University name"
                onChange={(event) => {
                  const next = [...item.universities];
                  next[index] = { ...uni, name: event.target.value };
                  update({ universities: next });
                }}
              />
              <input
                className="ee-input"
                value={uni.founded}
                placeholder="Est."
                style={{ maxWidth: 110 }}
                onChange={(event) => {
                  const next = [...item.universities];
                  next[index] = { ...uni, founded: event.target.value };
                  update({ universities: next });
                }}
              />
              <input
                className="ee-input"
                value={uni.rank}
                placeholder="Rank"
                style={{ maxWidth: 140 }}
                onChange={(event) => {
                  const next = [...item.universities];
                  next[index] = { ...uni, rank: event.target.value };
                  update({ universities: next });
                }}
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => { update({ universities: item.universities.filter((_, i) => i !== index) }); }}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { update({ universities: [...item.universities, { name: 'New university', founded: '', rank: '' }] }); }
            }
            style={{ alignSelf: 'flex-start' }}
          >
            + Add university
          </Button>
        </div>
        <ToggleField label="Show on the site" value={item.featured} onChange={(next) => { update({ featured: next }); }} />
      </>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Courses
 * ------------------------------------------------------------------ */

export const CoursesPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: CourseItem[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<CourseItem>
    title="English courses"
    description="Tracks, pricing, highlights and outcomes."
    items={cms.courses}
    onChange={patch}
    titleOf={(item) => item.title}
    metaOf={(item) => `${item.level} · ${item.currency}${item.discountedPrice}`}
    createItem={() => ({
      id: createId('course'),
      slug: `course-${createId('x').slice(-4)}`,
      title: 'New course',
      level: 'Level',
      classesCount: '40 live classes',
      duration: '10 weeks',
      format: 'Live online',
      badge: '',
      currency: '£',
      originalPrice: '',
      discountedPrice: '0',
      image: '',
      summary: 'One paragraph on who this track is for.',
      highlights: [],
      outcomes: [],
      featured: true,
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField
            label="Course title"
            value={item.title}
            onChange={(next) => {
              update({
                title: next,
                slug: item.slug.startsWith('course-x') ? slugify(next) : item.slug,
              }); 
            }
            }
          />
          <TextField
            label="URL slug"
            value={item.slug}
            mono
            onChange={(next) => { update({ slug: slugify(next) }); }}
            hint={`/courses/${item.slug}`}
          />
          <TextField label="Level" value={item.level} onChange={(next) => { update({ level: next }); }} />
          <TextField label="Badge" value={item.badge} onChange={(next) => { update({ badge: next }); }} />
        </div>
        <TextAreaField label="Summary" value={item.summary} rows={3} onChange={(next) => { update({ summary: next }); }} />
        <div className="ee-field-grid">
          <TextField label="Duration" value={item.duration} onChange={(next) => { update({ duration: next }); }} />
          <TextField label="Classes" value={item.classesCount} onChange={(next) => { update({ classesCount: next }); }} />
          <TextField label="Format" value={item.format} onChange={(next) => { update({ format: next }); }} />
          <TextField label="Currency symbol" value={item.currency} onChange={(next) => { update({ currency: next }); }} />
          <TextField label="Price" value={item.discountedPrice} onChange={(next) => { update({ discountedPrice: next }); }} />
          <TextField label="Was (optional)" value={item.originalPrice} onChange={(next) => { update({ originalPrice: next }); }} />
        </div>
        <ImageField
          label="Cover image"
          value={item.image}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ image: next }); }}
        />
        <StringListField label="Highlights" items={item.highlights} onChange={(next) => { update({ highlights: next }); }} />
        <StringListField label="Outcomes" items={item.outcomes} onChange={(next) => { update({ outcomes: next }); }} />
        <ToggleField label="Show on the site" value={item.featured} onChange={(next) => { update({ featured: next }); }} />
      </>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Services
 * ------------------------------------------------------------------ */

export const ServicesPanel = ({ cms, patch }: { cms: CmsData; patch: (next: ServiceItem[]) => void }) => (
  <CollectionPanel<ServiceItem>
    title="Services"
    description="The six stages shown on the Services page."
    items={cms.services}
    onChange={patch}
    titleOf={(item) => `${item.stepNumber} · ${item.title}`}
    metaOf={(item) => item.subtitle}
    createItem={() => ({
      id: createId('svc'),
      slug: `service-${createId('x').slice(-4)}`,
      stepNumber: String(cms.services.length + 1).padStart(2, '0'),
      title: 'New service',
      subtitle: 'Short subtitle',
      description: 'What this stage covers and why it matters.',
      deliverables: [],
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField label="Step number" value={item.stepNumber} onChange={(next) => { update({ stepNumber: next }); }} />
          <TextField label="Title" value={item.title} onChange={(next) => { update({ title: next }); }} />
          <TextField label="Subtitle" value={item.subtitle} onChange={(next) => { update({ subtitle: next }); }} />
          <TextField
            label="URL slug"
            value={item.slug}
            mono
            onChange={(next) => { update({ slug: slugify(next) }); }}
          />
        </div>
        <TextAreaField label="Description" value={item.description} rows={4} onChange={(next) => { update({ description: next }); }} />
        <StringListField
          label="Deliverables"
          items={item.deliverables}
          onChange={(next) => { update({ deliverables: next }); }}
        />
      </>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Recruitment roles
 * ------------------------------------------------------------------ */

export const RolesPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: RecruitmentRole[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<RecruitmentRole>
    title="Jobs & work permits"
    description="Overseas vacancies with visa route, pay and requirements."
    items={cms.roles}
    onChange={patch}
    titleOf={(item) => item.title}
    metaOf={(item) => `${item.country} · ${item.sector} · ${item.status}`}
    createItem={() => ({
      id: createId('role'),
      slug: `role-${createId('x').slice(-4)}`,
      title: 'New role',
      country: 'Country',
      city: '',
      sector: 'Sector',
      employer: '',
      salary: '',
      currency: '',
      contractType: 'Permanent',
      visaRoute: '',
      processingTime: '',
      summary: 'One paragraph describing the role and the route.',
      requirements: [],
      benefits: [],
      image: '',
      status: 'open',
      featured: true,
      postedAt: new Date().toISOString().slice(0, 10),
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField
            label="Job title"
            value={item.title}
            onChange={(next) => {
              update({
                title: next,
                slug: item.slug.startsWith('role-x') ? slugify(next) : item.slug,
              }); 
            }
            }
          />
          <TextField
            label="URL slug"
            value={item.slug}
            mono
            onChange={(next) => { update({ slug: slugify(next) }); }}
            hint={`/recruitment/${item.slug}`}
          />
          <TextField label="Country" value={item.country} onChange={(next) => { update({ country: next }); }} />
          <TextField label="City" value={item.city} onChange={(next) => { update({ city: next }); }} />
          <TextField label="Sector" value={item.sector} onChange={(next) => { update({ sector: next }); }} />
          <TextField label="Employer" value={item.employer} onChange={(next) => { update({ employer: next }); }} />
        </div>
        <TextAreaField label="Summary" value={item.summary} rows={4} onChange={(next) => { update({ summary: next }); }} />
        <div className="ee-field-grid">
          <TextField label="Salary" value={item.salary} onChange={(next) => { update({ salary: next }); }} />
          <TextField label="Currency" value={item.currency} onChange={(next) => { update({ currency: next }); }} />
          <TextField label="Contract type" value={item.contractType} onChange={(next) => { update({ contractType: next }); }} />
          <TextField label="Visa route" value={item.visaRoute} onChange={(next) => { update({ visaRoute: next }); }} />
          <TextField label="Processing time" value={item.processingTime} onChange={(next) => { update({ processingTime: next }); }} />
          <SelectField
            label="Status"
            value={item.status}
            onChange={(next) => { update({ status: next as RecruitmentRole['status'] }); }}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'closing_soon', label: 'Closing soon' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
        <ImageField
          label="Image"
          value={item.image}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ image: next }); }}
        />
        <StringListField
          label="Requirements"
          items={item.requirements}
          onChange={(next) => { update({ requirements: next }); }}
        />
        <StringListField label="Benefits" items={item.benefits} onChange={(next) => { update({ benefits: next }); }} />
        <ToggleField label="Show on the site" value={item.featured} onChange={(next) => { update({ featured: next }); }} />
      </>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Team, testimonials, FAQs, journal
 * ------------------------------------------------------------------ */

export const TeamPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: TeamMember[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<TeamMember>
    title="Team"
    description="The people clients actually speak to."
    items={cms.team}
    onChange={patch}
    titleOf={(item) => item.name}
    metaOf={(item) => item.role}
    createItem={() => ({
      id: createId('team'),
      name: 'New team member',
      role: 'Role',
      bio: 'Short biography in plain language.',
      photo: '',
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField label="Name" value={item.name} onChange={(next) => { update({ name: next }); }} />
          <TextField label="Role" value={item.role} onChange={(next) => { update({ role: next }); }} />
        </div>
        <TextAreaField label="Bio" value={item.bio} rows={4} onChange={(next) => { update({ bio: next }); }} />
        <ImageField
          label="Photo"
          value={item.photo}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ photo: next }); }}
        />
      </>
    )}
  />
);

export const TestimonialsPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: TestimonialItem[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<TestimonialItem>
    title="Student stories"
    description="Quotes shown in the marquee and on landing sections."
    items={cms.testimonials}
    onChange={patch}
    titleOf={(item) => item.name}
    metaOf={(item) => item.destination}
    createItem={() => ({
      id: createId('tst'),
      name: 'Student name',
      destination: 'United Kingdom',
      program: 'Programme',
      quote: 'What the student actually said.',
      avatar: '',
      rating: 5,
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField label="Name" value={item.name} onChange={(next) => { update({ name: next }); }} />
          <TextField label="Destination" value={item.destination} onChange={(next) => { update({ destination: next }); }} />
          <TextField label="Programme" value={item.program} onChange={(next) => { update({ program: next }); }} />
          <NumberField label="Rating" value={item.rating} min={1} max={5} onChange={(next) => { update({ rating: next }); }} />
        </div>
        <TextAreaField label="Quote" value={item.quote} rows={3} onChange={(next) => { update({ quote: next }); }} />
        <ImageField
          label="Avatar (optional)"
          value={item.avatar}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ avatar: next }); }}
        />
      </>
    )}
  />
);

export const FaqsPanel = ({ cms, patch }: { cms: CmsData; patch: (next: FaqItem[]) => void }) => (
  <CollectionPanel<FaqItem>
    title="Questions & answers"
    description="Grouped by category on the home and destination pages."
    items={cms.faqs}
    onChange={patch}
    titleOf={(item) => item.question}
    metaOf={(item) => item.category}
    createItem={() => ({
      id: createId('faq'),
      category: 'General',
      question: 'A question clients ask',
      answer: 'A direct, useful answer.',
    })}
    renderForm={(item, update) => (
      <>
        <TextField label="Category" value={item.category} onChange={(next) => { update({ category: next }); }} />
        <TextField label="Question" value={item.question} onChange={(next) => { update({ question: next }); }} />
        <TextAreaField label="Answer" value={item.answer} rows={5} onChange={(next) => { update({ answer: next }); }} />
      </>
    )}
  />
);

export const PostsPanel = ({
  cms,
  patch,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: BlogPost[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <CollectionPanel<BlogPost>
    title="Journal"
    description="Guides and articles. Each paragraph is one block of body text."
    items={cms.posts}
    onChange={patch}
    titleOf={(item) => item.title}
    metaOf={(item) => `${item.category} · ${item.publishedAt}`}
    createItem={() => ({
      id: createId('post'),
      slug: `post-${createId('x').slice(-4)}`,
      title: 'New guide',
      category: 'Admissions',
      readTime: '6 min read',
      publishedAt: new Date().toISOString().slice(0, 10),
      author: 'EuroEdge Desk',
      coverImage: '',
      excerpt: 'One-sentence summary shown on the card.',
      content: ['First paragraph.'],
    })}
    renderForm={(item, update) => (
      <>
        <div className="ee-field-grid">
          <TextField
            label="Title"
            value={item.title}
            onChange={(next) => {
              update({
                title: next,
                slug: item.slug.startsWith('post-x') ? slugify(next) : item.slug,
              }); 
            }
            }
          />
          <TextField
            label="URL slug"
            value={item.slug}
            mono
            onChange={(next) => { update({ slug: slugify(next) }); }}
            hint={`/blog/${item.slug}`}
          />
          <TextField label="Category" value={item.category} onChange={(next) => { update({ category: next }); }} />
          <TextField label="Read time" value={item.readTime} onChange={(next) => { update({ readTime: next }); }} />
          <TextField label="Published" value={item.publishedAt} onChange={(next) => { update({ publishedAt: next }); }} />
          <TextField label="Author" value={item.author} onChange={(next) => { update({ author: next }); }} />
        </div>
        <TextAreaField label="Excerpt" value={item.excerpt} rows={2} onChange={(next) => { update({ excerpt: next }); }} />
        <ImageField
          label="Cover image"
          value={item.coverImage}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { update({ coverImage: next }); }}
        />
        <ParagraphListField
          label="Article body"
          items={item.content}
          onChange={(next) => { update({ content: next }); }}
        />
      </>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

export const NavPanel = ({ cms, patch }: { cms: CmsData; patch: (next: NavItem[]) => void }) => (
  <CollectionPanel<NavItem>
    title="Navigation"
    description="Menu links in the header and footer. Hidden routes still work if you type the URL."
    items={[...cms.nav].sort((a, b) => a.order - b.order)}
    onChange={patch}
    titleOf={(item) => item.label}
    metaOf={(item) => item.path}
    searchable={false}
    createItem={() => ({
      id: createId('nav'),
      label: 'New link',
      path: '/new-page',
      visible: true,
      order: cms.nav.length,
    })}
    renderForm={(item, update) => (
      <div className="ee-field-grid">
        <TextField label="Label" value={item.label} onChange={(next) => { update({ label: next }); }} />
        <TextField label="Path" value={item.path} mono onChange={(next) => { update({ path: next }); }} />
        <NumberField label="Order" value={item.order} max={20} onChange={(next) => { update({ order: next }); }} />
        <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 8 }}>
          <ToggleField label="Visible" value={item.visible} onChange={(next) => { update({ visible: next }); }} />
        </div>
      </div>
    )}
  />
);

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export const StatsPanel = ({
  cms,
  patch,
}: {
  cms: CmsData;
  patch: (next: StatItem[]) => void;
}) => (
  <CollectionPanel<StatItem>
    title="Headline numbers"
    description="Shown in the hero strip and the stats band."
    items={cms.settings.stats}
    onChange={patch}
    titleOf={(item) => `${item.value} — ${item.label}`}
    metaOf={(item) => item.sublabel}
    searchable={false}
    createItem={() => ({ id: createId('stat'), value: '0', label: 'New metric', sublabel: '' })}
    renderForm={(item, update) => (
      <div className="ee-field-grid">
        <TextField label="Value" value={item.value} onChange={(next) => { update({ value: next }); }} />
        <TextField label="Label" value={item.label} onChange={(next) => { update({ label: next }); }} />
        <TextField label="Sub-label" value={item.sublabel} onChange={(next) => { update({ sublabel: next }); }} />
      </div>
    )}
  />
);

export type { ContentBlock };
