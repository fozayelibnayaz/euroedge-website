import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { META } from '../../utilities/constants';

interface PageMetaProps {
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
}

const getCanonicalUrl = (pathname: string): string => {
  if (typeof window === 'undefined') {
    return `${META.FALLBACK}${pathname}`;
  }

  return new URL(pathname, window.location.origin).toString();
};

interface TagSpec {
  tag: 'meta' | 'link';
  /** Selector used to find the existing tag so we never create duplicates. */
  key: string;
  attributes: Record<string, string>;
}

const upsertTag = ({ tag, key, attributes }: TagSpec): void => {
  if (typeof document === 'undefined') {
    return;
  }

  let element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(key);

  if (!element) {
    element = document.createElement(tag);
    document.head.appendChild(element);
  }

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
};

/**
 * One owner for every document head tag.
 *
 * The tags are updated in place (never appended twice), so a page keeps exactly
 * one title, one description and one canonical URL no matter how many times it
 * renders — and the static values shipped in index.html act as the pre-hydration
 * fallback and search-engine snapshot.
 */
export const PageMeta = ({ title, description, image, noIndex = false }: PageMetaProps) => {
  const { pathname } = useLocation();
  const canonicalUrl = getCanonicalUrl(pathname);
  const shareImage = image ?? META.PREVIEW_IMAGE;
  const imageAlt = `${title} Preview`;

  useEffect(() => {
    document.title = title;

    const tags: TagSpec[] = [
      { tag: 'meta', key: 'meta[name="title"]', attributes: { name: 'title', content: title } },
      {
        tag: 'meta',
        key: 'meta[name="description"]',
        attributes: { name: 'description', content: description },
      },
      {
        tag: 'meta',
        key: 'meta[name="robots"]',
        attributes: { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' },
      },
      { tag: 'meta', key: 'meta[name="author"]', attributes: { name: 'author', content: META.AUTHOR } },
      {
        tag: 'meta',
        key: 'meta[name="keywords"]',
        attributes: { name: 'keywords', content: META.KEYWORDS },
      },
      {
        tag: 'meta',
        key: 'meta[name="language"]',
        attributes: { name: 'language', content: META.LANGUAGE },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:type"]',
        attributes: { property: 'og:type', content: META.OG_TYPE },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:site_name"]',
        attributes: { property: 'og:site_name', content: META.SITE_NAME },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:title"]',
        attributes: { property: 'og:title', content: title },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:description"]',
        attributes: { property: 'og:description', content: description },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:image"]',
        attributes: { property: 'og:image', content: shareImage },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:image:alt"]',
        attributes: { property: 'og:image:alt', content: imageAlt },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:url"]',
        attributes: { property: 'og:url', content: canonicalUrl },
      },
      {
        tag: 'meta',
        key: 'meta[property="og:locale"]',
        attributes: { property: 'og:locale', content: META.LOCALE },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:card"]',
        attributes: { name: 'twitter:card', content: META.TWITTER_CARD },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:title"]',
        attributes: { name: 'twitter:title', content: title },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:description"]',
        attributes: { name: 'twitter:description', content: description },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:image"]',
        attributes: { name: 'twitter:image', content: shareImage },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:image:alt"]',
        attributes: { name: 'twitter:image:alt', content: imageAlt },
      },
      {
        tag: 'meta',
        key: 'meta[name="twitter:site"]',
        attributes: { name: 'twitter:site', content: META.TWITTER_SITE },
      },
      {
        tag: 'meta',
        key: 'meta[name="theme-color"]',
        attributes: { name: 'theme-color', content: META.THEME_COLOR },
      },
      { tag: 'link', key: 'link[rel="canonical"]', attributes: { rel: 'canonical', href: canonicalUrl } },
    ];

    for (const spec of tags) {
      upsertTag(spec);
    }
  }, [title, description, shareImage, imageAlt, canonicalUrl, noIndex]);

  return null;
};
