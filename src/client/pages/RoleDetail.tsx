import { Navigate, useParams } from 'react-router';
import { useCms } from '@/client/context/cms-context';
import { PublicLayout } from '../ui/layout/public-layout';
import { PageBlocks } from '../ui/layout/page-view';
import { PageMeta } from '../ui/components/page-meta';
import { DetailView } from '../ui/primitives/detail-view';
import { Section } from '../ui/primitives/blocks';
import { Reveal } from '../ui/primitives/motion';
import { Badge, Card } from '../ui/primitives/ui';

const statusTone = (status: string) =>
  status === 'open' ? 'good' : status === 'closing_soon' ? 'coral' : 'neutral';

const RoleDetail = () => {
  const { slug } = useParams();
  const { cms, openConsultationModal } = useCms();
  const role = cms.roles.find((item) => item.slug === slug);

  if (!role) {
    return <Navigate to="/recruitment" replace />;
  }

  return (
    <PublicLayout>
      <PageMeta title={`${role.title} — ${role.country}`} description={role.summary} image={role.image} />
      <DetailView
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Work & recruitment', to: '/recruitment' },
          { label: role.title },
        ]}
        eyebrow={role.sector}
        title={role.title}
        subtitle={role.summary}
        image={role.image}
        badge={role.status === 'open' ? 'Accepting applications' : role.status === 'closing_soon' ? 'Closing soon' : 'Closed'}
        facts={[
          { label: 'Location', value: role.city ? `${role.city}, ${role.country}` : role.country },
          { label: 'Salary', value: role.salary ? `${role.salary} ${role.currency}` : 'On application' },
          { label: 'Contract', value: role.contractType || 'Permanent' },
          { label: 'Visa route', value: role.visaRoute || 'Employer sponsored' },
        ]}
        bullets={[
          { heading: 'What the employer requires', points: role.requirements },
          { heading: 'What the package includes', points: role.benefits },
        ]}
        ctaLabel="Apply for this role"
        onConsult={() => { openConsultationModal({ subject: `Application: ${role.title}` }); }}
      >
        <Section block={{ id: 'role-notice', background: 'muted' }}>
          <Reveal>
            <Card className="ee-full ee-stack ee-stack-sm">
              <div className="ee-row ee-row-sm">
                <Badge tone={statusTone(role.status)}>
                  {role.status === 'open' ? 'Open' : role.status === 'closing_soon' ? 'Closing soon' : 'Closed'}
                </Badge>
                {role.processingTime ? <Badge>Permit processing: {role.processingTime}</Badge> : null}
                {role.employer ? <Badge>Employer: {role.employer}</Badge> : null}
              </div>
              <p className="ee-body" style={{ margin: 0 }}>
                We never charge a candidate a placement fee before a signed offer letter is issued, and we
                never hold your passport or original documents. Read the contract before you sign it — if
                anything in it does not match what we have told you, send it back to us and we will chase it.
              </p>
            </Card>
          </Reveal>
        </Section>
      </DetailView>
      <PageBlocks slug="/recruitment/:slug" />
    </PublicLayout>
  );
};

export default RoleDetail;
