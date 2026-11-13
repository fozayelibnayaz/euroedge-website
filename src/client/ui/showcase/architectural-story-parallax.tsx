import { useEffect, useMemo, useRef, useState } from 'react';
import { type BlockItem, type CmsData, type ContentBlock } from '@/shared/cms-types';
import { Reveal } from '../primitives/motion';

/* ------------------------------------------------------------------ *
 * Scroll-drawn admission line.
 * A live 1px vertical filament traces the file as the reader scrolls:
 * transcript check → shortlist → offer and CAS → biometrics.
 * ------------------------------------------------------------------ */

const useScrollProgress = (ref: React.RefObject<HTMLElement | null>): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setProgress(1);
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the section top reaches 85% of the viewport, 1 when its bottom
      // passes 55% — the line finishes drawing while the steps are still readable.
      const start = viewport * 0.85;
      const end = viewport * 0.55;
      const travelled = start - rect.top;
      const distance = start - end + rect.height * 0.72;
      const next = distance <= 0 ? 1 : travelled / distance;
      setProgress(Math.min(1, Math.max(0, next)));
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
};

export const ArchitecturalStoryParallax = ({
  block,
  cms,
}: {
  block: ContentBlock;
  cms: CmsData;
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);

  const steps = useMemo<BlockItem[]>(() => {
    if (block.source === 'services' && cms.services.length > 0) {
      return cms.services.slice(0, block.limit).map<BlockItem>((service) => ({
        id: service.id,
        title: service.title,
        subtitle: service.subtitle,
        body: service.description,
        meta: service.stepNumber,
        tag: '',
        badge: '',
        image: '',
        video: '',
        href: '',
        accent: '',
        points: service.deliverables.slice(0, 3),
      }));
    }
    return block.items;
  }, [block.items, block.limit, block.source, cms.services]);

  if (steps.length === 0) {
    return null;
  }

  const activeCount = Math.round(progress * steps.length);

  return (
    <div className="ee-storyline" ref={sectionRef} style={{ ['--story-progress' as string]: progress }}>
      <div className="ee-storyline-rail" aria-hidden="true">
        <span className="ee-storyline-track" />
        <span className="ee-storyline-filament" style={{ transform: `scaleY(${progress.toFixed(4)})` }} />
        <span className="ee-storyline-head" style={{ top: `${(progress * 100).toFixed(2)}%` }} />
      </div>

      <ol className="ee-storyline-steps">
        {steps.map((step, index) => {
          const reached = index < activeCount;
          return (
            <li
              key={step.id}
              className="ee-storyline-step"
              data-reached={reached ? 'true' : 'false'}
            >
              <span className="ee-storyline-node" aria-hidden="true">
                <span className="ee-storyline-node-dot" />
                <span className="ee-storyline-node-index ee-mono">
                  {step.meta || String(index + 1).padStart(2, '0')}
                </span>
              </span>

              <Reveal delay={index * 70}>
                <div className="ee-storyline-card">
                  <h3 className="ee-h4" style={{ margin: 0 }}>
                    {step.title}
                  </h3>
                  {step.subtitle ? (
                    <span className="ee-mono ee-muted" style={{ fontSize: '0.76rem' }}>
                      {step.subtitle}
                    </span>
                  ) : null}
                  <p className="ee-body" style={{ marginTop: 8, marginBottom: 0 }}>
                    {step.body}
                  </p>
                  {step.points.length > 0 ? (
                    <ul className="ee-storyline-points">
                      {step.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
