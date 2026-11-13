import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LuArrowRight, LuClock, LuCompass, LuSearch, LuWallet } from 'react-icons/lu';
import { type CmsData, type ContentBlock, type CourseItem, type StudyDestination } from '@/shared/cms-types';
import { Button } from '../primitives/ui';

/* ------------------------------------------------------------------ *
 * Live Raycast-style split-pane window rendered inside the hero.
 * Left pane filters every corridor and course; the right pane updates
 * instantly with timelines, fees and one-key route actions.
 * ------------------------------------------------------------------ */

interface StageEntry {
  id: string;
  kind: 'corridor' | 'course';
  code: string;
  title: string;
  group: string;
  /** Extra text folded into the search index. */
  keywords: string;
  href: string;
  timeline: string;
  timelineLabel: string;
  fee: string;
  feeLabel: string;
  meta: { label: string; value: string }[];
  points: string[];
  accent: string;
}

const destinationToEntry = (item: StudyDestination): StageEntry => ({
  id: item.id,
  kind: 'corridor',
  code: item.code,
  title: item.country,
  group: 'Study corridors',
  keywords: `${item.country} ${item.region} ${item.tagline} ${item.fields.join(' ')} ${item.visaCategory}`,
  href: `/study/${item.slug}`,
  timeline: item.visaTimeline,
  timelineLabel: 'Visa turnaround',
  fee: item.tuitionRange,
  feeLabel: 'Tuition band',
  meta: [
    { label: 'Visa route', value: item.visaCategory },
    { label: 'Visa fee', value: item.visaFee },
    { label: 'Intakes', value: item.intakeMonths },
    { label: 'After study', value: item.postStudyWork || 'Ask the desk' },
  ],
  points: item.requirements.slice(0, 3),
  accent: item.accent,
});

const courseToEntry = (item: CourseItem): StageEntry => ({
  id: item.id,
  kind: 'course',
  code: item.level.slice(0, 3).toUpperCase(),
  title: item.title,
  group: 'English coaching',
  keywords: `${item.title} ${item.level} ${item.format} ${item.summary}`,
  href: `/courses/${item.slug}`,
  timeline: item.duration,
  timelineLabel: 'Course length',
  fee: `${item.currency}${item.discountedPrice}`,
  feeLabel: item.originalPrice ? `Was ${item.currency}${item.originalPrice}` : 'Course fee',
  meta: [
    { label: 'Format', value: item.format },
    { label: 'Classes', value: item.classesCount },
    { label: 'Level', value: item.level },
  ],
  points: item.highlights.slice(0, 3),
  accent: '',
});

const matches = (entry: StageEntry, needle: string): boolean => {
  if (!needle) {
    return true;
  }
  const query = needle.trim().toLowerCase();
  return (
    entry.title.toLowerCase().includes(query) ||
    entry.code.toLowerCase().includes(query) ||
    entry.group.toLowerCase().includes(query) ||
    entry.keywords.toLowerCase().includes(query)
  );
};

export const HeroParallaxStage = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => {
  const navigate = useNavigate();
  const shellRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<StageEntry[]>(
    () => [
      ...cms.destinations.map(destinationToEntry),
      ...cms.courses.map(courseToEntry),
    ],
    [cms.destinations, cms.courses]
  );

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const results = useMemo(() => entries.filter((entry) => matches(entry, query)), [entries, query]);
  const active = results[Math.min(cursor, results.length - 1)] ?? results[0] ?? entries[0];

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Keep the highlighted row visible while the user arrows through results.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-cursor="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [cursor, query]);

  /* Mouse parallax — desktop pointers only, and never for reduced motion. */
  useEffect(() => {
    const node = shellRef.current;
    if (!node) {
      return undefined;
    }

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) {
      return undefined;
    }

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--stage-x', `${(px * 12).toFixed(2)}px`);
        node.style.setProperty('--stage-y', `${(py * 12).toFixed(2)}px`);
        node.style.setProperty('--stage-rx', `${(-py * 3.2).toFixed(2)}deg`);
        node.style.setProperty('--stage-ry', `${(px * 4.4).toFixed(2)}deg`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--stage-x', '0px');
      node.style.setProperty('--stage-y', '0px');
      node.style.setProperty('--stage-rx', '0deg');
      node.style.setProperty('--stage-ry', '0deg');
    };

    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('mousemove', onMove);
      node.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && active) {
      event.preventDefault();
      navigate(active.href);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, StageEntry[]>();
    for (const entry of results) {
      const bucket = map.get(entry.group) ?? [];
      bucket.push(entry);
      map.set(entry.group, bucket);
    }
    return Array.from(map.entries());
  }, [results]);

  return (
    <div className="ee-stage-shell" ref={shellRef}>
      <div className="ee-stage-window">
        {/* Window chrome */}
        <div className="ee-stage-bar">
          <span className="ee-stage-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="ee-stage-title ee-mono">
            {cms.settings.brandName} — Admission Desk
          </span>
          <span className="ee-stage-kbd ee-mono" aria-hidden="true">
            ⌘K
          </span>
        </div>

        <div className="ee-stage-body">
          {/* Left pane — search + live index */}
          <div className="ee-stage-list" ref={listRef}>
            <label className="ee-stage-search">
              <LuSearch size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Search corridors, courses, IELTS…"
                aria-label="Search corridors and courses"
                onChange={(event) => { setQuery(event.target.value); }}
                onKeyDown={onSearchKeyDown}
              />
            </label>

            <div className="ee-stage-results" role="listbox" aria-label="Corridors and courses">
              {groups.length === 0 ? (
                <p className="ee-hint" style={{ padding: '18px 4px' }}>
                  Nothing matches “{query}”. Try “UK”, “IELTS” or “Europe”.
                </p>
              ) : null}

              {groups.map(([group, bucket]) => (
                <div key={group} className="ee-stage-group">
                  <span className="ee-stage-group-label ee-mono">{group}</span>
                  {bucket.map((entry) => {
                    const isActive = active?.id === entry.id;
                    return (
                      <button
                        type="button"
                        key={entry.id}
                        className="ee-stage-item"
                        data-cursor={isActive ? 'true' : 'false'}
                        data-active={isActive ? 'true' : 'false'}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => { setCursor(results.indexOf(entry)); }}
                        onClick={() => { navigate(entry.href); }}
                      >
                        <span
                          className="ee-stage-item-code ee-mono"
                          style={entry.accent ? { color: entry.accent } : undefined}
                        >
                          {entry.code}
                        </span>
                        <span className="ee-stage-item-name">{entry.title}</span>
                        <span className="ee-stage-item-meta ee-mono">{entry.timeline}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right pane — live dossier */}
          <div className="ee-stage-detail">
            {active ? (
              <>
                <div className="ee-stage-detail-head">
                  <span className="ee-badge ee-badge-accent">
                    {active.kind === 'corridor' ? 'Corridor' : 'Coaching'}
                  </span>
                  <h3 className="ee-h4" style={{ margin: 0 }}>
                    {active.title}
                  </h3>
                </div>

                <div className="ee-stage-readouts">
                  <div className="ee-stage-readout">
                    <span className="ee-stage-readout-label ee-mono">
                      <LuClock size={12} /> {active.timelineLabel}
                    </span>
                    <strong className="ee-stage-readout-value">{active.timeline}</strong>
                  </div>
                  <div className="ee-stage-readout">
                    <span className="ee-stage-readout-label ee-mono">
                      <LuWallet size={12} /> {active.feeLabel}
                    </span>
                    <strong className="ee-stage-readout-value">{active.fee}</strong>
                  </div>
                </div>

                <dl className="ee-stage-facts">
                  {active.meta.map((fact) => (
                    <div key={fact.label} className="ee-stage-fact">
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>

                {active.points.length > 0 ? (
                  <ul className="ee-stage-points">
                    {active.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="ee-stage-actions">
                  <Button size="sm" onClick={() => { navigate(active.href); }}>
                    Open {active.kind === 'corridor' ? 'corridor' : 'course'} <LuArrowRight size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { onConsult({ subject: active.title }); }}
                  >
                    Assess my file
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="ee-stage-foot">
          <span className="ee-mono">
            <LuCompass size={11} /> {cms.destinations.length} corridors · {cms.courses.length} programmes
          </span>
          <span className="ee-mono ee-faint">↑ ↓ to browse · ↵ to open</span>
        </div>
      </div>

      {block.ctaLabel ? (
        <div className="ee-stage-cta">
          <Link to={block.ctaHref || '/contact'} className="ee-btn ee-btn-secondary ee-btn-sm">
            {block.ctaLabel} <LuArrowRight size={13} />
          </Link>
        </div>
      ) : null}
    </div>
  );
};
