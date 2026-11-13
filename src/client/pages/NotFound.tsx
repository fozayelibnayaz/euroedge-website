import { Link } from 'react-router';
import { LuArrowRight, LuCompass } from 'react-icons/lu';
import { PublicLayout } from '../ui/layout/public-layout';
import { PageMeta } from '../ui/components/page-meta';
import { Section } from '../ui/primitives/blocks';
import { Reveal } from '../ui/primitives/motion';
import { useCms } from '@/client/context/cms-context';

const NotFound = () => {
  const { cms } = useCms();
  const links = cms.nav.filter((item) => item.visible).sort((a, b) => a.order - b.order);

  return (
    <PublicLayout>
      <PageMeta title="Page not found — EuroEdge Admission Group" description="The page you requested does not exist." noIndex />
      <Section block={{ id: 'not-found', background: 'gradient' }}>
        <div className="ee-stack ee-stack-md ee-center" style={{ alignItems: 'center', paddingBlock: 60 }}>
          <Reveal>
            <span className="ee-mono ee-accent" style={{ fontSize: '0.8rem', letterSpacing: '0.2em' }}>
              404
            </span>
          </Reveal>
          <Reveal delay={60} variant="mask">
            <h1 className="ee-h1" style={{ maxWidth: '18ch' }}>
              This page moved, or never existed.
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="ee-lead ee-center">
              Use the routes below, or press <kbd className="ee-badge">⌘K</kbd> to search the whole site.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="ee-row ee-row-sm" style={{ justifyContent: 'center' }}>
              {links.map((item) => (
                <Link key={item.id} to={item.path} className="ee-btn ee-btn-secondary ee-btn-sm">
                  <LuCompass size={13} /> {item.label}
                </Link>
              ))}
            </div>
          </Reveal>
          <Reveal delay={240}>
            <Link to="/" className="ee-btn ee-btn-primary ee-btn-lg">
              Back to home <LuArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </Section>
    </PublicLayout>
  );
};

export default NotFound;
