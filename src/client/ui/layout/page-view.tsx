import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCms } from '@/client/context/cms-context';
import { PageHero, HomeHero } from './page-hero';
import { PageMeta } from '../components/page-meta';
import { BlockRenderer } from '../primitives/blocks';
import { META } from '@/client/utilities/constants';

export interface ConsultPrefill {
  subject?: string;
  country?: string;
  program?: string;
}

/**
 * Every public route renders through this one component: it looks up the page
 * document by its route slug, draws the hero (home or inner) and then walks
 * the page's block list. Adding a section in the admin never touches code.
 */
export const PageView = ({
  slug,
  children,
  fallbackTitle,
}: {
  slug: string;
  children?: ReactNode;
  fallbackTitle?: string;
}) => {
  const { cms, openConsultationModal } = useCms();
  const page = cms.pages.find((entry) => entry.slug === slug);

  if (!page) {
    return fallbackTitle ? null : <Navigate to="/" replace />;
  }

  const seoTitle = page.seoTitle || `${page.title} — ${cms.settings.brandName}`;

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={page.seoDescription || cms.settings.brandSubline}
        image={page.heroImage || cms.settings.heroObjectImage || META.PREVIEW_IMAGE}
      />
      {slug === '/' ? (
        <HomeHero cms={cms} page={page} onConsult={() => { openConsultationModal(); }} />
      ) : page.showHero ? (
        <PageHero page={page} cms={cms} />
      ) : null}
      {children}
      {page.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          cms={cms}
          onConsult={(prefill?: ConsultPrefill) => { openConsultationModal(prefill ?? {}); }}
        />
      ))}
    </>
  );
};

/**
 * Renders only the editable section list of a page document. Detail routes use
 * this so the admin can still add sections beneath a record's own content.
 */
export const PageBlocks = ({ slug }: { slug: string }) => {
  const { cms, openConsultationModal } = useCms();
  const page = cms.pages.find((entry) => entry.slug === slug);

  if (!page) {
    return null;
  }

  return (
    <>
      {page.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          cms={cms}
          onConsult={(prefill?: ConsultPrefill) => { openConsultationModal(prefill ?? {}); }}
        />
      ))}
    </>
  );
};
