import { useEffect, type ReactNode } from 'react';
import { LuX } from 'react-icons/lu';
import { type CmsData } from '@/shared/cms-types';
import { SiteNavbar } from '../layout/site-navbar';
import { SiteFooter } from '../layout/site-footer';
import { CommandPalette } from './command-palette';
import { SecuredInquiryForm } from './inquiry-form';
import { ScrollProgress } from './motion';
import { IconButton } from './ui';

export const ConsultationModal = ({
  open,
  onClose,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: { subject?: string; country?: string; program?: string };
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="ee-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="ee-modal"
        style={{ maxWidth: 640 }}
        role="dialog"
        aria-modal="true"
        aria-label="Book a free assessment"
      >
        <div className="ee-row ee-row-between" style={{ marginBottom: 16 }}>
          <span className="ee-eyebrow">FREE · NO OBLIGATION</span>
          <IconButton onClick={onClose} label="Close" icon={<LuX size={15} />} />
        </div>
        <SecuredInquiryForm prefill={prefill} onSuccess={() => window.setTimeout(onClose, 2600)} />
      </div>
    </div>
  );
};

export const SiteShell = ({
  cms,
  children,
  commandOpen,
  setCommandOpen,
  consultOpen,
  consultPrefill,
  closeConsultation,
  onConsult,
}: {
  cms: CmsData;
  children: ReactNode;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  consultOpen: boolean;
  consultPrefill: { subject?: string; country?: string; program?: string };
  closeConsultation: () => void;
  onConsult: (prefill?: { subject?: string; country?: string; program?: string }) => void;
}) => (
  <>
    <a href="#main" className="ee-skip-link">
      Skip to content
    </a>
    <ScrollProgress />
    <SiteNavbar cms={cms} onConsult={() => { onConsult(); }} />
    <main id="main">{children}</main>
    <SiteFooter cms={cms} />
    <CommandPalette
      open={commandOpen}
      onClose={() => { setCommandOpen(false); }}
      cms={cms}
      onConsult={() => { onConsult(); }}
    />
    <ConsultationModal open={consultOpen} onClose={closeConsultation} prefill={consultPrefill} />
  </>
);
