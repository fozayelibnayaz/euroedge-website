import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type CmsData } from '@/shared/cms-types';
import { DEFAULT_CMS_DATA } from '@/shared/default-cms-data';
import { fetchCmsData } from '../utilities/api-client';

interface ConsultationPrefill {
  country?: string;
  program?: string;
  subject?: string;
}

interface CmsContextValue {
  cms: CmsData;
  isSyncing: boolean;
  refreshCms: () => Promise<void>;
  setCmsOptimistic: (next: CmsData) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  consultModalOpen: boolean;
  consultPrefill: ConsultationPrefill;
  openConsultationModal: (prefill?: ConsultationPrefill) => void;
  closeConsultationModal: () => void;
}

const CmsContext = createContext<CmsContextValue | null>(null);

export const CmsProvider = ({ children }: { children: ReactNode }) => {
  const [cms, setCms] = useState<CmsData>(DEFAULT_CMS_DATA);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [commandOpen, setCommandOpen] = useState<boolean>(false);
  const [consultModalOpen, setConsultModalOpen] = useState<boolean>(false);
  const [consultPrefill, setConsultPrefill] = useState<ConsultationPrefill>({});

  const refreshCms = useCallback(async () => {
    setIsSyncing(true);
    try {
      const liveData = await fetchCmsData();
      setCms(liveData);
    } catch {
      // Fall back to preloaded DEFAULT_CMS_DATA gracefully
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshCms();
  }, [refreshCms]);

  // Global Raycast Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const openConsultationModal = useCallback((prefill?: ConsultationPrefill) => {
    setConsultPrefill(prefill ?? {});
    setConsultModalOpen(true);
  }, []);

  const closeConsultationModal = useCallback(() => {
    setConsultModalOpen(false);
  }, []);

  const value = useMemo<CmsContextValue>(
    () => ({
      cms,
      isSyncing,
      refreshCms,
      setCmsOptimistic: setCms,
      commandOpen,
      setCommandOpen,
      consultModalOpen,
      consultPrefill,
      openConsultationModal,
      closeConsultationModal,
    }),
    [
      cms,
      isSyncing,
      refreshCms,
      commandOpen,
      consultModalOpen,
      consultPrefill,
      openConsultationModal,
      closeConsultationModal,
    ]
  );

  return <CmsContext value={value}>{children}</CmsContext>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCms = (): CmsContextValue => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within CmsProvider');
  }
  return context;
};
