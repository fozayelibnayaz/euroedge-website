import { useState } from 'react';
import { LuEye, LuEyeOff, LuPlus } from 'react-icons/lu';
import {
  BLOCK_TYPES,
  createId,
  emptyBlock,
  emptyBlockItem,
  type BlockItem,
  type BlockType,
  type CmsData,
  type ContentBlock,
  type LinkItem,
  type MediaItem,
  type PageDoc,
} from '@/shared/cms-types';
import { Button, Card, Field, SectionHeading } from '../primitives/ui';
import { ImageField, ParagraphListField, SelectField, StringListField, TextAreaField, TextField, ToggleField } from './fields';

const BLOCK_LABELS: Record<BlockType, string> = {
  richText: 'Text block',
  stats: 'Number band',
  features: 'Feature grid',
  steps: 'Numbered steps',
  showcase: 'Card showcase',
  showreel: 'Motion film',
  priceGrid: 'Call to action',
  testimonials: 'Testimonials',
  faq: 'Questions & answers',
  gallery: 'Image gallery',
  logos: 'Logo marquee',
  cta: 'Call to action',
  contact: 'Contact & form',
  table: 'Comparison table',
  heroStage: 'Raycast hero window',
  keybed: 'Keybed configurator',
  storyLine: 'Admission line',
  corridorLedger: 'Corridor ledger',
  courseStudio: 'Course studio bento',
};

const SOURCE_HINTS: Record<ContentBlock['source'], string> = {
  manual: 'Uses the items you add below.',
  destinations: 'Pulls live from Study destinations.',
  courses: 'Pulls live from English courses.',
  roles: 'Pulls live from Jobs & work permits.',
  posts: 'Pulls live from the Journal.',
  testimonials: 'Pulls live from Student stories.',
  faqs: 'Pulls live from Questions & answers.',
  services: 'Pulls live from Services.',
  team: 'Pulls live from Team.',
};

/* ------------------------------------------------------------------ *
 * Block item editor
 * ------------------------------------------------------------------ */

const BlockItemEditor = ({
  item,
  update,
  remove,
  media,
  onUploaded,
}: {
  item: BlockItem;
  update: (patch: Partial<BlockItem>) => void;
  remove: () => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => (
  <div className="ee-panel ee-stack ee-stack-sm" style={{ padding: 16, background: 'var(--ee-surface-2)' }}>
    <div className="ee-field-grid">
      <TextField label="Title" value={item.title} onChange={(next) => { update({ title: next }); }} />
      <TextField label="Subtitle / tag" value={item.subtitle} onChange={(next) => { update({ subtitle: next }); }} />
    </div>
    <TextAreaField label="Body" value={item.body} rows={3} onChange={(next) => { update({ body: next }); }} />
    <div className="ee-field-grid">
      <TextField label="Meta line" value={item.meta} onChange={(next) => { update({ meta: next }); }} />
      <TextField label="Badge" value={item.badge} onChange={(next) => { update({ badge: next }); }} />
      <TextField label="Link (internal path)" value={item.href} onChange={(next) => { update({ href: next }); }} />
      <TextField label="Accent colour" value={item.accent} onChange={(next) => { update({ accent: next }); }} />
    </div>
    <ImageField
      label="Image"
      value={item.image}
      media={media}
      onUploaded={onUploaded}
      onChange={(next) => { update({ image: next }); }}
    />
    <StringListField label="Bullet points" items={item.points} onChange={(next) => { update({ points: next }); }} />
    <Button variant="danger" size="sm" onClick={remove} style={{ alignSelf: 'flex-start' }}>
      Delete item
    </Button>
  </div>
);

/* ------------------------------------------------------------------ *
 * Single block editor
 * ------------------------------------------------------------------ */

const BlockEditor = ({
  block,
  update,
  remove,
  move,
  media,
  onUploaded,
}: {
  block: ContentBlock;
  update: (patch: Partial<ContentBlock>) => void;
  remove: () => void;
  move: (direction: -1 | 1) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="ee-stack ee-stack-sm" data-block-id={block.id} data-block-type={block.type}>
      <div className="ee-row ee-row-between" style={{ gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ee-row ee-row-xs">
            <span className="ee-badge ee-badge-accent">{BLOCK_LABELS[block.type]}</span>
            {!block.visible ? <span className="ee-badge ee-badge-coral">Hidden</span> : null}
          </div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>{block.title || '(no heading)'}</div>
        </div>
        <div className="ee-row ee-row-xs">
          <Button variant="ghost" size="sm" onClick={() => { move(-1); }}>
            ↑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { move(1); }}>
            ↓
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { update({ visible: !block.visible }); }}
            title={block.visible ? 'Hide section' : 'Show section'}
          >
            {block.visible ? <LuEye size={14} /> : <LuEyeOff size={14} />}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setOpen((prev) => !prev); }}>
            {open ? 'Close' : 'Edit'}
          </Button>
          <Button variant="danger" size="sm" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {open ? (
        <div className="ee-stack ee-stack-sm" style={{ marginTop: 8 }}>
          <div className="ee-field-grid">
            <SelectField
              label="Section type"
              value={block.type}
              onChange={(next) => { update({ type: next as BlockType }); }}
              options={BLOCK_TYPES.map((type) => ({ value: type, label: BLOCK_LABELS[type] }))}
            />
            <SelectField
              label="Data source"
              value={block.source}
              onChange={(next) => { update({ source: next as ContentBlock['source'] }); }}
              options={Object.keys(SOURCE_HINTS).map((key) => ({
                value: key,
                label: key === 'manual' ? 'Manual items' : key,
              }))}
              hint={SOURCE_HINTS[block.source]}
            />
            <SelectField
              label="Background"
              value={block.background}
              onChange={(next) => { update({ background: next as ContentBlock['background'] }); }}
              options={[
                { value: 'surface', label: 'Surface' },
                { value: 'muted', label: 'Muted' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'ink', label: 'Dark' },
                { value: 'none', label: 'Transparent' },
              ]}
            />
            <SelectField
              label="Layout"
              value={block.layout}
              onChange={(next) => { update({ layout: next as ContentBlock['layout'] }); }}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'split', label: 'Split' },
                { value: 'center', label: 'Centred' },
                { value: 'grid', label: 'Grid' },
                { value: 'rail', label: 'Index rail' },
                { value: 'bento', label: 'Bento' },
                { value: 'bento-7-5', label: 'Bento 7 + 5' },
                { value: 'bento-5-7', label: 'Bento 5 + 7' },
                { value: 'marquee', label: 'Marquee' },
              ]}
            />
          </div>

          <div className="ee-field-grid">
            <TextField label="Eyebrow" value={block.eyebrow} onChange={(next) => { update({ eyebrow: next }); }} />
            <TextField label="Heading" value={block.title} onChange={(next) => { update({ title: next }); }} />
          </div>
          <TextField label="Subheading" value={block.subtitle} onChange={(next) => { update({ subtitle: next }); }} />

          <ParagraphListField
            label="Body paragraphs"
            items={block.body}
            onChange={(next) => { update({ body: next }); }}
          />

          <div className="ee-field-grid">
            <TextField label="Button label" value={block.ctaLabel} onChange={(next) => { update({ ctaLabel: next }); }} />
            <TextField label="Button link" value={block.ctaHref} onChange={(next) => { update({ ctaHref: next }); }} />
            <TextField label="Footnote" value={block.footnote} onChange={(next) => { update({ footnote: next }); }} />
            <ImageField
              label="Section image"
              value={block.image}
              media={media}
              onUploaded={onUploaded}
              onChange={(next) => { update({ image: next }); }}
            />
          </div>

          {block.source === 'manual' ? (
            <div className="ee-stack ee-stack-sm">
              <div className="ee-row ee-row-between">
                <span className="ee-label">Items ({block.items.length})</span>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<LuPlus size={13} />}
                  onClick={() => { update({ items: [...block.items, emptyBlockItem()] }); }}
                >
                  Add item
                </Button>
              </div>
              {block.items.map((item, index) => (
                <BlockItemEditor
                  key={item.id}
                  item={item}
                  update={(patch) => {
                    const next = [...block.items];
                    next[index] = { ...item, ...patch };
                    update({ items: next });
                  }}
                  remove={() => { update({ items: block.items.filter((_, i) => i !== index) }); }}
                  media={media}
                  onUploaded={onUploaded}
                />
              ))}
            </div>
          ) : (
            <div className="ee-field-grid">
              <Field label={`How many records to show (max ${String(block.limit)})`}>
                <input
                  className="ee-input"
                  type="number"
                  min={1}
                  max={24}
                  value={block.limit}
                  onChange={(event) => { update({ limit: Number(event.target.value) }); }}
                />
              </Field>
              <Field label="Columns">
                <input
                  className="ee-input"
                  type="number"
                  min={1}
                  max={4}
                  value={block.columns}
                  onChange={(event) => { update({ columns: Number(event.target.value) }); }}
                />
              </Field>
            </div>
          )}

          {block.type === 'showreel' ? (
            <SelectField
              label="Motion film scene"
              value={block.video}
              onChange={(next) => { update({ video: next }); }}
              options={[
                { value: 'campus', label: 'Campus — skyline & students' },
                { value: 'classroom', label: 'Classroom — coaching week' },
                { value: 'visa', label: 'Visa — filing & approval' },
              ]}
            />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};

/* ------------------------------------------------------------------ *
 * Page editor: hero + ordered section list
 * ------------------------------------------------------------------ */

export const PagesPanel = ({
  cms,
  patchPages,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patchPages: (next: PageDoc[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => {
  const [activeSlug, setActiveSlug] = useState(cms.pages[0]?.slug ?? '/');
  const page = cms.pages.find((entry) => entry.slug === activeSlug) ?? cms.pages[0];

  if (!page) {
    return null;
  }

  const updatePage = (patch: Partial<PageDoc>) => {
    patchPages(cms.pages.map((entry) => (entry.slug === page.slug ? { ...entry, ...patch } : entry)));
  };

  const updateBlock = (blockId: string, patch: Partial<ContentBlock>) => {
    updatePage({
      blocks: page.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = [...page.blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updatePage({ blocks: next });
  };

  return (
    <div className="ee-stack ee-stack-md">
      <SectionHeading
        title="Pages & sections"
        description="Pick a page, edit its hero, then add, reorder or remove sections. New sections render with a safe layout automatically."
      />

      <Field label="Page">
        <select
          className="ee-select"
          aria-label="Page"
          value={activeSlug}
          onChange={(event) => { setActiveSlug(event.target.value); }}
        >
          {cms.pages.map((entry) => (
            <option key={entry.id} value={entry.slug}>
              {entry.slug} — {entry.title}
            </option>
          ))}
        </select>
      </Field>

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Search &amp; hero</span>
        <div className="ee-field-grid">
          <TextField label="Page title" value={page.title} onChange={(next) => { updatePage({ title: next }); }} />
          <TextField
            label="SEO title"
            value={page.seoTitle}
            onChange={(next) => { updatePage({ seoTitle: next }); }}
            hint="Shown in search results and browser tabs."
          />
        </div>
        <TextField
          label="SEO description"
          value={page.seoDescription}
          onChange={(next) => { updatePage({ seoDescription: next }); }}
        />
        <ToggleField
          label="Show a hero banner on this page"
          value={page.showHero}
          onChange={(next) => { updatePage({ showHero: next }); }}
        />
        {page.showHero ? (
          <>
            <TextField
              label="Hero eyebrow"
              value={page.heroEyebrow}
              onChange={(next) => { updatePage({ heroEyebrow: next }); }}
            />
            <div className="ee-field-grid">
              <TextField
                label="Hero headline"
                value={page.heroTitle}
                onChange={(next) => { updatePage({ heroTitle: next }); }}
              />
              <TextField
                label="Highlighted words"
                value={page.heroHighlight}
                onChange={(next) => { updatePage({ heroHighlight: next }); }}
              />
            </div>
            <TextAreaField
              label="Hero paragraph"
              value={page.heroSubtitle}
              rows={3}
              onChange={(next) => { updatePage({ heroSubtitle: next }); }}
            />
            <ImageField
              label="Hero image (optional)"
              value={page.heroImage}
              media={media}
              onUploaded={onUploaded}
              onChange={(next) => { updatePage({ heroImage: next }); }}
            />
            <div className="ee-stack ee-stack-xs">
              <span className="ee-label">Hero buttons</span>
              {page.heroActions.map((action, index) => (
                <div key={action.id} className="ee-row ee-row-xs" style={{ flexWrap: 'nowrap' }}>
                  <input
                    className="ee-input"
                    value={action.label}
                    placeholder="Label"
                    onChange={(event) => {
                      const next = [...page.heroActions] as LinkItem[];
                      next[index] = { ...action, label: event.target.value };
                      updatePage({ heroActions: next });
                    }}
                  />
                  <input
                    className="ee-input"
                    value={action.href}
                    placeholder="/study or #consultation"
                    onChange={(event) => {
                      const next = [...page.heroActions] as LinkItem[];
                      next[index] = { ...action, href: event.target.value };
                      updatePage({ heroActions: next });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => { updatePage({ heroActions: page.heroActions.filter((_, i) => i !== index) }); }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  updatePage({
                    heroActions: [
                      ...page.heroActions,
                      {
                        id: createId('action'),
                        label: 'New button',
                        href: '#consultation',
                        variant: 'secondary',
                        external: false,
                      },
                    ],
                  }); 
                }
                }
                style={{ alignSelf: 'flex-start' }}
              >
                + Add hero button
              </Button>
            </div>
          </>
        ) : null}
      </Card>

      <div className="ee-row ee-row-between">
        <span className="ee-label">Sections ({page.blocks.length})</span>
        <Button
          size="sm"
          icon={<LuPlus size={13} />}
          onClick={() => { updatePage({ blocks: [...page.blocks, emptyBlock('features')] }); }}
        >
          Add section
        </Button>
      </div>

      <div className="ee-stack ee-stack-sm">
        {page.blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            update={(patch) => { updateBlock(block.id, patch); }}
            remove={() => { updatePage({ blocks: page.blocks.filter((entry) => entry.id !== block.id) }); }}
            move={(direction) => { moveBlock(index, direction); }}
            media={media}
            onUploaded={onUploaded}
          />
        ))}
      </div>
    </div>
  );
};
