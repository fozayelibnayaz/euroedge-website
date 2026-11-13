import { Navigate, useParams } from 'react-router';
import { useCms } from '@/client/context/cms-context';
import { PublicLayout } from '../ui/layout/public-layout';
import { PageBlocks } from '../ui/layout/page-view';
import { PageMeta } from '../ui/components/page-meta';
import { DetailView } from '../ui/primitives/detail-view';
import { Section } from '../ui/primitives/blocks';
import { Reveal } from '../ui/primitives/motion';
import { Card } from '../ui/primitives/ui';

const StudyDestinationDetail = () => {
  const { slug } = useParams();
  const { cms, openConsultationModal } = useCms();
  const destination = cms.destinations.find((item) => item.slug === slug);

  if (!destination) {
    return <Navigate to="/study" replace />;
  }

  return (
    <PublicLayout>
      <PageMeta
        title={`Study in ${destination.country} — ${destination.visaCategory}`}
        description={destination.tagline}
        image={destination.heroImage}
      />
      <DetailView
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Study destinations', to: '/study' },
          { label: destination.country },
        ]}
        eyebrow={destination.region}
        title={`Study in ${destination.country}`}
        subtitle={destination.tagline}
        image={destination.heroImage}
        badge={destination.code}
        facts={[
          { label: 'Visa route', value: destination.visaCategory },
          { label: 'Decision time', value: destination.visaTimeline },
          { label: 'Tuition range', value: destination.tuitionRange },
          { label: 'Post-study work', value: destination.postStudyWork || 'Varies by course' },
        ]}
        intro={destination.overview}
        bullets={[
          { heading: 'What you need to file', points: destination.requirements },
          { heading: 'Strong fields here', points: destination.fields },
        ]}
        ctaLabel="Get a written plan for this country"
        onConsult={() => {
          openConsultationModal({
            country: destination.country,
            subject: `Study in ${destination.country}`,
          }); 
        }
        }
      >
        <Section block={{ id: 'destination-universities', background: 'muted' }}>
          <Reveal>
            <span className="ee-eyebrow">INSTITUTIONS WE FILE FOR</span>
            <h2 className="ee-h2" style={{ marginTop: 10 }}>
              Where our students enrol
            </h2>
          </Reveal>
          <div className="ee-grid ee-grid-auto" style={{ marginTop: 26 }}>
            {destination.universities.map((uni, index) => (
              <Reveal key={uni.name} delay={index * 60}>
                <Card hover className="ee-full">
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{uni.name}</div>
                  <div className="ee-row ee-row-between" style={{ marginTop: 10 }}>
                    <span className="ee-faint" style={{ fontSize: '0.78rem' }}>
                      Est. {uni.founded}
                    </span>
                    <span className="ee-badge ee-badge-accent">{uni.rank}</span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>
      </DetailView>

      <PageBlocks slug="/study/:slug" />
    </PublicLayout>
  );
};

export default StudyDestinationDetail;
