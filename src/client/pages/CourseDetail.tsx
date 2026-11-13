import { Navigate, useParams } from 'react-router';
import { useCms } from '@/client/context/cms-context';
import { PublicLayout } from '../ui/layout/public-layout';
import { PageBlocks } from '../ui/layout/page-view';
import { PageMeta } from '../ui/components/page-meta';
import { DetailView } from '../ui/primitives/detail-view';
import { Section } from '../ui/primitives/blocks';
import { Reveal } from '../ui/primitives/motion';
import { Card } from '../ui/primitives/ui';

const CourseDetail = () => {
  const { slug } = useParams();
  const { cms, openConsultationModal } = useCms();
  const course = cms.courses.find((item) => item.slug === slug);

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <PublicLayout>
      <PageMeta title={`${course.title} — EuroEdge`} description={course.summary} image={course.image} />
      <DetailView
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'English courses', to: '/courses' },
          { label: course.title },
        ]}
        eyebrow={course.level}
        title={course.title}
        subtitle={course.summary}
        image={course.image}
        badge={course.badge}
        facts={[
          { label: 'Duration', value: course.duration },
          { label: 'Classes', value: course.classesCount },
          { label: 'Format', value: course.format },
          {
            label: 'Fee',
            value: `${course.currency}${course.discountedPrice}${
              course.originalPrice ? ` (was ${course.currency}${course.originalPrice})` : ''
            }`,
          },
        ]}
        bullets={[
          { heading: 'What is included', points: course.highlights },
          { heading: 'What you leave with', points: course.outcomes },
        ]}
        ctaLabel="Check my level"
        onConsult={() => { openConsultationModal({ program: course.title, subject: `Enquiry: ${course.title}` }); }
        }
      >
        <Section block={{ id: 'course-compare', background: 'muted' }}>
          <Reveal>
            <span className="ee-eyebrow">OTHER TRACKS</span>
            <h2 className="ee-h2" style={{ marginTop: 10 }}>
              Not sure this is your level?
            </h2>
          </Reveal>
          <div className="ee-grid ee-grid-auto" style={{ marginTop: 26 }}>
            {cms.courses
              .filter((item) => item.id !== course.id)
              .map((item, index) => (
                <Reveal key={item.id} delay={index * 60}>
                  <a href={`/courses/${item.slug}`} style={{ display: 'block' }}>
                    <Card hover className="ee-full">
                      <span className="ee-badge">{item.level}</span>
                      <div style={{ fontWeight: 600, marginTop: 10 }}>{item.title}</div>
                      <div className="ee-row ee-row-between" style={{ marginTop: 10 }}>
                        <span className="ee-mono" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {item.currency}
                          {item.discountedPrice}
                        </span>
                        <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
                          {item.duration}
                        </span>
                      </div>
                    </Card>
                  </a>
                </Reveal>
              ))}
          </div>
        </Section>
      </DetailView>
      <PageBlocks slug="/courses/:slug" />
    </PublicLayout>
  );
};

export default CourseDetail;
