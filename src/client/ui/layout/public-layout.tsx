import type { ReactNode } from 'react';
import { useCms } from '@/client/context/cms-context';
import { SiteShell } from '../primitives/site-shell';
import type { ConsultPrefill } from './page-view';

/**
 * Wraps every public route with the shared chrome (navbar, footer, palette,
 * consultation modal). Pages never re-declare this.
 */
export const PublicLayout = ({ children }: { children: ReactNode }) => {
  const {
    cms,
    commandOpen,
    setCommandOpen,
    consultModalOpen,
    consultPrefill,
    openConsultationModal,
    closeConsultationModal,
  } = useCms();

  return (
    <SiteShell
      cms={cms}
      commandOpen={commandOpen}
      setCommandOpen={setCommandOpen}
      consultOpen={consultModalOpen}
      consultPrefill={consultPrefill}
      closeConsultation={closeConsultationModal}
      onConsult={(prefill?: ConsultPrefill) => { openConsultationModal(prefill ?? {}); }}
    >
      {children}
    </SiteShell>
  );
};
