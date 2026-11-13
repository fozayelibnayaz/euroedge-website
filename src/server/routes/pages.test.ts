import { describe, expect, it } from 'vitest';
import { getKnownPaths } from './pages';

describe('public route catalogue', () => {
  it('includes every static route', () => {
    const paths = getKnownPaths();

    for (const route of [
      '/',
      '/study',
      '/courses',
      '/services',
      '/recruitment',
      '/about',
      '/blog',
      '/contact',
      '/policies',
      '/admin',
      '/sitemap.xml',
      '/robots.txt',
    ]) {
      expect(paths.has(route), `${route} should be a known route`).toBe(true);
    }
  });

  it('only whitelists the admin area as a route, never as content', () => {
    const adminRoutes = Array.from(getKnownPaths()).filter((path) => path.startsWith('/admin'));
    // /admin plus its sign-in and sign-out screens are the only admin URLs.
    expect(adminRoutes.sort()).toEqual(['/admin', '/admin/login', '/admin/logout']);
  });

  it('adds a prefix route for every dynamic page shell', () => {
    const paths = getKnownPaths();
    expect(paths.has('/study/')).toBe(true);
    expect(paths.has('/courses/')).toBe(true);
    expect(paths.has('/recruitment/')).toBe(true);
  });

  it('lists every published content slug', () => {
    const paths = getKnownPaths();
    const dynamic = Array.from(paths).filter((path) => /\/(study|courses|recruitment|blog)\/.+/.test(path));
    expect(dynamic.length).toBeGreaterThan(10);
    for (const slug of ['study-in-uk', 'ielts-preparation', 'uk-care-assistant']) {
      expect(dynamic.some((path) => path.endsWith(`/${slug}`)), slug).toBe(true);
    }
  });
});
