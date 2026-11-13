import { Link } from 'react-router';
import { LuArrowRight } from 'react-icons/lu';
import { type CmsData, type ContentBlock, type CourseItem } from '@/shared/cms-types';

/* ------------------------------------------------------------------ *
 * 7 + 5 / 5 + 7 bento studio.
 * Technical module breakdowns inside an asymmetric hairline bento
 * instead of a stock-photo card grid.
 * ------------------------------------------------------------------ */

const Bento = ({
  course,
  span,
  index,
}: {
  course: CourseItem;
  span: 'wide' | 'tall' | 'unit';
  index: number;
}) => (
  <Link
    to={`/courses/${course.slug}`}
    className="ee-bento-tile"
    data-span={span}
    style={{ ['--tile-index' as string]: index }}
  >
    <span className="ee-bento-index ee-mono">{String(index + 1).padStart(2, '0')}</span>

    <div className="ee-bento-head">
      {course.badge ? <span className="ee-badge ee-badge-accent">{course.badge}</span> : null}
      <h3 className="ee-h4" style={{ margin: 0 }}>
        {course.title}
      </h3>
      <span className="ee-mono ee-muted" style={{ fontSize: '0.76rem' }}>
        {course.level} · {course.duration} · {course.format}
      </span>
    </div>

    <p className="ee-body" style={{ margin: 0 }}>
      {course.summary}
    </p>

    <div className="ee-bento-modules">
      <span className="ee-label ee-mono">Modules</span>
      <ul>
        {course.highlights.slice(0, span === 'unit' ? 3 : 5).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>

    {course.outcomes.length > 0 && span !== 'unit' ? (
      <div className="ee-bento-outcomes">
        <span className="ee-label ee-mono">Outcome</span>
        <p>{course.outcomes[0]}</p>
      </div>
    ) : null}

    <div className="ee-bento-foot">
      <span className="ee-bento-fee ee-mono">
        {course.currency}
        {course.discountedPrice}
        {course.originalPrice ? (
          <s className="ee-faint">
            {course.currency}
            {course.originalPrice}
          </s>
        ) : null}
      </span>
      <span className="ee-row ee-row-xs ee-accent" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
        {course.classesCount} <LuArrowRight size={12} />
      </span>
    </div>
  </Link>
);

export const CoursesStudioSection = ({ block, cms }: { block: ContentBlock; cms: CmsData }) => {
  const courses = cms.courses.slice(0, 4);
  const reverse = block.layout === 'bento-5-7';

  if (courses.length === 0) {
    return null;
  }

  const [first, second, third, fourth] = courses;

  // 7 + 5 : one large tile beside two stacked units.
  // 5 + 7 : two stacked units beside one large tile.
  const leading = first ? <Bento course={first} span="wide" index={0} /> : null;
  const trailing = (
    <div className="ee-bento-stack">
      {second ? <Bento course={second} span="unit" index={1} /> : null}
      {third ? <Bento course={third} span="unit" index={2} /> : null}
    </div>
  );

  return (
    <div className="ee-bento" data-reverse={reverse ? 'true' : 'false'}>
      {reverse ? (
        <>
          {trailing}
          {leading}
        </>
      ) : (
        <>
          {leading}
          {trailing}
        </>
      )}
      {fourth ? (
        <div className="ee-bento-full">
          <Bento course={fourth} span="tall" index={3} />
        </div>
      ) : null}
    </div>
  );
};
