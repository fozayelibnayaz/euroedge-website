import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { LuArrowRight, LuKeyboard } from 'react-icons/lu';
import { type CmsData, type ContentBlock } from '@/shared/cms-types';
import { Button } from '../primitives/ui';

/* ------------------------------------------------------------------ *
 * Tactile 3D mechanical keybed.
 * Press U S C A E M 1 2 I V F on a real keyboard (or click a keycap) to
 * inspect visa turnaround windows, post-study work rules, course fees
 * and the 28-day bank audit rule.
 * ------------------------------------------------------------------ */

interface KeySpec {
  /** Physical key that selects this cap. */
  key: string;
  code: string;
  label: string;
  hint: string;
  group: 'Corridors' | 'Coaching' | 'Rules';
}

const KEYS: KeySpec[] = [
  { key: 'u', code: 'UK', label: 'United Kingdom', hint: 'Corridor', group: 'Corridors' },
  { key: 's', code: 'US', label: 'United States', hint: 'Corridor', group: 'Corridors' },
  { key: 'c', code: 'CA', label: 'Canada', hint: 'Corridor', group: 'Corridors' },
  { key: 'a', code: 'AU', label: 'Australia', hint: 'Corridor', group: 'Corridors' },
  { key: 'e', code: 'EU', label: 'Europe', hint: 'Corridor', group: 'Corridors' },
  { key: 'm', code: 'MY', label: 'Malaysia', hint: 'Corridor', group: 'Corridors' },
  { key: '1', code: 'B1', label: 'B1 English', hint: 'Course', group: 'Coaching' },
  { key: '2', code: 'B2', label: 'B2 English', hint: 'Course', group: 'Coaching' },
  { key: 'i', code: 'IEL', label: 'IELTS Prep', hint: 'Course', group: 'Coaching' },
  { key: 'v', code: 'VIS', label: 'Visa windows', hint: 'Rule', group: 'Rules' },
  { key: 'f', code: 'FND', label: '28-day funds', hint: 'Rule', group: 'Rules' },
];

const CODE_TO_SLUG: Record<string, string> = {
  UK: 'study-in-uk',
  US: 'study-in-usa',
  CA: 'study-in-canada',
  AU: 'study-in-australia',
  EU: 'study-in-europe',
  MY: 'study-in-malaysia',
  B1: 'b1-english-course',
  B2: 'b2-english-course',
  IEL: 'ielts-preparation',
};

/* ------------------------------------------------------------------ *
 * A keystroke must never hijack typing inside a form control.
 * ------------------------------------------------------------------ */

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

export const PathwayConfigurator = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => {
  const [selected, setSelected] = useState<string>('u');
  const [pressed, setPressed] = useState<string>('');

  const select = useCallback((key: string) => {
    setSelected(key);
    setPressed(key);
    window.setTimeout(() => {
      setPressed((current) => (current === key ? '' : current));
    }, 160);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const key = event.key.toLowerCase();
      const spec = KEYS.find((entry) => entry.key === key);
      if (!spec) {
        return;
      }
      event.preventDefault();
      select(spec.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [select]);

  const dossier = useMemo(() => {
    const spec = KEYS.find((entry) => entry.key === selected) ?? KEYS[0];
    const slug = CODE_TO_SLUG[spec.code];
    const destination = cms.destinations.find((item) => item.slug === slug);
    const course = cms.courses.find((item) => item.slug === slug);

    if (destination) {
      return {
        spec,
        title: destination.country,
        lead: destination.tagline,
        href: `/study/${destination.slug}`,
        rows: [
          { label: 'Visa route', value: destination.visaCategory },
          { label: 'Turnaround window', value: destination.visaTimeline },
          { label: 'Visa fee', value: destination.visaFee },
          { label: 'Tuition band', value: destination.tuitionRange },
          { label: 'Intake months', value: destination.intakeMonths },
          { label: 'Post-study work', value: destination.postStudyWork || 'Ask the desk' },
        ],
        notes: destination.requirements.slice(0, 4),
        fee: destination.tuitionRange,
      };
    }

    if (course) {
      return {
        spec,
        title: course.title,
        lead: course.summary,
        href: `/courses/${course.slug}`,
        rows: [
          { label: 'Level', value: course.level },
          { label: 'Length', value: course.duration },
          { label: 'Classes', value: course.classesCount },
          { label: 'Format', value: course.format },
          {
            label: 'Fee',
            value: `${course.currency}${course.discountedPrice}${
              course.originalPrice ? ` (was ${course.currency}${course.originalPrice})` : ''
            }`,
          },
        ],
        notes: course.highlights.slice(0, 4),
        fee: `${course.currency}${course.discountedPrice}`,
      };
    }

    if (spec.code === 'VIS') {
      return {
        spec,
        title: 'Visa turnaround windows',
        lead: 'How long each corridor actually takes once a complete file is lodged.',
        href: '/study',
        rows: cms.destinations.map((item) => ({
          label: item.country,
          value: item.visaTimeline,
        })),
        notes: [
          'A decision clock starts when the file is complete — not when you first enquire.',
          'Credential evaluations (USA, Canada) and medicals add their own lead time.',
          'Peak season (June–September) stretches every window by roughly two weeks.',
        ],
        fee: '',
      };
    }

    return {
      spec,
      title: 'The 28-day bank audit rule',
      lead: 'UK student route: funds must sit in the account for a continuous 28 days before the statement date.',
      href: '/blog/uk-student-visa-financial-evidence',
      rows: [
        { label: 'Rule', value: '28 consecutive days below the required balance' },
        { label: 'Statement date', value: 'Must be within 31 days of the application' },
        { label: 'Who counts', value: 'Applicant, parent or legal guardian with consent' },
        { label: 'What fails', value: 'A single day dipping under the threshold' },
        { label: 'What helps', value: 'One clean account, no large unexplained credits' },
      ],
      notes: [
        'Money market and fixed deposits are acceptable if the provider letter is dated correctly.',
        'Salary credits with matching payslips are the easiest evidence to defend.',
        'If a parent funds the file, bring the birth certificate plus a signed consent letter.',
      ],
      fee: '',
    };
  }, [cms.courses, cms.destinations, selected]);

  const grouped = useMemo(() => {
    const order: KeySpec['group'][] = ['Corridors', 'Coaching', 'Rules'];
    return order.map((group) => ({
      group,
      keys: KEYS.filter((entry) => entry.group === group),
    }));
  }, []);

  return (
    <div className="ee-keybed">
      <div className="ee-keybed-deck">
        {grouped.map(({ group, keys }) => (
          <div key={group} className="ee-keybed-group">
            <span className="ee-keybed-group-label ee-mono">{group}</span>
            <div className="ee-keybed-row">
              {keys.map((spec) => (
                <button
                  key={spec.key}
                  type="button"
                  className="ee-keycap"
                  data-active={selected === spec.key ? 'true' : 'false'}
                  data-pressed={pressed === spec.key ? 'true' : 'false'}
                  aria-pressed={selected === spec.key}
                  onClick={() => { select(spec.key); }}
                  title={`${spec.label} — press ${spec.key.toUpperCase()}`}
                >
                  <span className="ee-keycap-top ee-mono">{spec.code}</span>
                  <span className="ee-keycap-key ee-mono">{spec.key.toUpperCase()}</span>
                  <span className="ee-keycap-label">{spec.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="ee-keybed-hint ee-mono">
          <LuKeyboard size={12} /> Press a key on your keyboard — U S C A E M 1 2 I V F
        </p>
      </div>

      <div className="ee-keybed-dossier" aria-live="polite">
        <div className="ee-keybed-dossier-head">
          <span className="ee-badge ee-badge-accent">{dossier.spec.code}</span>
          <h3 className="ee-h4" style={{ margin: 0 }}>
            {dossier.title}
          </h3>
          <p className="ee-body" style={{ margin: 0 }}>
            {dossier.lead}
          </p>
        </div>

        <dl className="ee-keybed-rows">
          {dossier.rows.map((row) => (
            <div key={row.label} className="ee-keybed-row-item">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        {dossier.notes.length > 0 ? (
          <ul className="ee-keybed-notes">
            {dossier.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}

        <div className="ee-keybed-actions">
          <Link to={dossier.href} className="ee-btn ee-btn-primary ee-btn-sm">
            Open detail <LuArrowRight size={13} />
          </Link>
          <Button size="sm" variant="secondary" onClick={() => { onConsult({ subject: dossier.title }); }}>
            Assess my file
          </Button>
        </div>

        {block.footnote ? <p className="ee-hint">{block.footnote}</p> : null}
      </div>
    </div>
  );
};
