import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { LuArrowRight, LuGraduationCap } from 'react-icons/lu';
import { type CmsData, type ContentBlock, type StudyDestination } from '@/shared/cms-types';
import { Button } from '../primitives/ui';
import { SmartImage } from '../primitives/media';
import { RailRow } from '../primitives/rail';

/* ------------------------------------------------------------------ *
 * Asymmetric 01–06 corridor ledger.
 * Hairline index rows on the left drive a sticky dossier frame on the
 * right — no stock-photo card grid.
 * ------------------------------------------------------------------ */

export const DestinationsBentoShowcase = ({
  block,
  cms,
  onConsult,
}: {
  block: ContentBlock;
  cms: CmsData;
  onConsult: (prefill?: { subject?: string }) => void;
}) => {
  const rows = useMemo(
    () => cms.destinations.slice(0, Math.max(1, Math.min(block.limit || 6, 12))),
    [block.limit, cms.destinations]
  );
  const [activeId, setActiveId] = useState<string>(rows[0]?.id ?? '');
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selection valid when the admin reorders or removes corridors.
  useEffect(() => {
    if (rows.length === 0) {
      return;
    }
    if (!rows.some((row) => row.id === activeId)) {
      setActiveId(rows[0].id);
    }
  }, [activeId, rows]);

  const active = rows.find((row) => row.id === activeId) ?? rows[0];

  return (
    <div className="ee-ledger">
      <div className="ee-ledger-index" ref={listRef}>
        {rows.map((row, index) => (
          <RailRow
            key={row.id}
            id={`ledger-${row.id}`}
            index={String(index + 1).padStart(2, '0')}
            active={row.id === active?.id}
            ariaLabel={`${row.country} corridor detail`}
            onSelect={() => { setActiveId(row.id); }}
          >
            <span className="ee-ledger-row-main">
              <span className="ee-ledger-row-code ee-mono" style={row.accent ? { color: row.accent } : undefined}>
                {row.code}
              </span>
              <span className="ee-ledger-row-title">{row.country}</span>
              <span className="ee-ledger-row-tagline ee-faint">{row.tagline}</span>
            </span>
            <span className="ee-ledger-row-meta ee-mono">{row.tuitionRange}</span>
          </RailRow>
        ))}
      </div>

      <aside className="ee-ledger-dossier" aria-live="polite">
        {active ? (
          <DossierFrame destination={active} onConsult={onConsult} />
        ) : (
          <p className="ee-hint">No corridors published yet.</p>
        )}
      </aside>
    </div>
  );
};

const DossierFrame = ({
  destination,
  onConsult,
}: {
  destination: StudyDestination;
  onConsult: (prefill?: { subject?: string }) => void;
}) => (
  <div className="ee-ledger-dossier-inner">
    <div className="ee-ledger-dossier-media">
      <SmartImage
        src={destination.heroImage}
        alt={`${destination.country} campus`}
        seed={destination.id}
      />
      <span className="ee-ledger-dossier-badge ee-mono">{destination.code}</span>
    </div>

    <div className="ee-ledger-dossier-body">
      <h3 className="ee-h3" style={{ margin: 0 }}>
        {destination.country}
      </h3>
      <p className="ee-body" style={{ margin: '6px 0 0' }}>
        {destination.overview}
      </p>

      <dl className="ee-ledger-facts">
        <div>
          <dt>Visa route</dt>
          <dd>{destination.visaCategory}</dd>
        </div>
        <div>
          <dt>Turnaround</dt>
          <dd>{destination.visaTimeline}</dd>
        </div>
        <div>
          <dt>Visa fee</dt>
          <dd>{destination.visaFee}</dd>
        </div>
        <div>
          <dt>Tuition</dt>
          <dd>{destination.tuitionRange}</dd>
        </div>
        <div>
          <dt>Intakes</dt>
          <dd>{destination.intakeMonths}</dd>
        </div>
        <div>
          <dt>After study</dt>
          <dd>{destination.postStudyWork || 'Ask the desk'}</dd>
        </div>
      </dl>

      {destination.universities.length > 0 ? (
        <div className="ee-ledger-unis">
          <span className="ee-label ee-mono">
            <LuGraduationCap size={12} /> Partner universities
          </span>
          <ul>
            {destination.universities.slice(0, 4).map((uni) => (
              <li key={uni.name}>
                <span>{uni.name}</span>
                <span className="ee-mono ee-faint">
                  {[uni.rank, uni.founded].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ee-ledger-actions">
        <Link to={`/study/${destination.slug}`} className="ee-btn ee-btn-primary ee-btn-sm">
          Open corridor <LuArrowRight size={13} />
        </Link>
        <Button size="sm" variant="secondary" onClick={() => { onConsult({ subject: destination.country }); }}>
          Assess my file
        </Button>
      </div>
    </div>
  </div>
);
