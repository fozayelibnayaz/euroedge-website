import { Router, type RequestHandler } from 'express';
import { ROUTES } from '../config/constants';
import { getRedirectRule } from '../config/redirects';
import { getSitemap } from '../controllers/sitemap';
import { getCmsData } from '../services/cms-store';

const router = Router();
const passToVite: RequestHandler = (_req, _res, next) => {
  next();
};

/**
 * Paths that must fall straight through to Vite / the static handler.
 * Anything with a file extension, or under a build or media prefix, is a
 * resource request rather than a route.
 */
const RESOURCE_PREFIXES = [
  '/@',
  '/src',
  '/assets',
  '/node_modules',
  '/media',
  '/brand',
  '/uploads',
  '/team',
  '/.well-known',
  '/api',
  '/favicon',
];

const hasFileExtension = (pathname: string): boolean =>
  /\.[a-z0-9]{2,6}$/i.test(pathname.slice(pathname.lastIndexOf('/') + 1));

const isResourceRequest = (pathname: string): boolean =>
  hasFileExtension(pathname) ||
  RESOURCE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

/** Every public URL the app can render, built from live CMS content. */
export const getKnownPaths = (): Set<string> => {
  const cms = getCmsData();
  const paths = new Set<string>([ROUTES.ADMIN, ROUTES.LOGIN, ROUTES.LOGOUT, ROUTES.SITEMAP, ROUTES.ROBOTS]);

  for (const page of cms.pages) {
    if (page.slug.includes(':')) {
      // Dynamic shells such as /study/:slug stay "known" by their prefix.
      paths.add(page.slug.slice(0, page.slug.indexOf(':')));
      continue;
    }
    paths.add(page.slug);
  }

  for (const destination of cms.destinations) {
    paths.add(`/study/${destination.slug}`);
  }
  for (const course of cms.courses) {
    paths.add(`/courses/${course.slug}`);
  }
  for (const role of cms.roles) {
    paths.add(`/recruitment/${role.slug}`);
  }
  for (const post of cms.posts) {
    paths.add(`/blog/${post.slug}`);
  }

  return paths;
};

const isKnownPath = (pathname: string): boolean => {
  const known = getKnownPaths();
  if (known.has(pathname)) {
    return true;
  }

  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (known.has(normalised)) {
    return true;
  }

  for (const candidate of known) {
    if (candidate.length > 1 && candidate.endsWith('/') && pathname.startsWith(candidate)) {
      return true;
    }
  }

  return false;
};

/**
 * Unknown URLs must answer 404 so crawlers do not index soft-404s.
 * The status is set before falling through, and the SPA shell is still sent so
 * React Router can paint the friendly not-found page.
 */
const statusForUnknownRoutes: RequestHandler = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  if (isResourceRequest(req.path) || isKnownPath(req.path)) {
    next();
    return;
  }

  res.status(404);
  next();
};

router.use((req, res, next) => {
  const redirectRule = getRedirectRule(req.path);
  if (!redirectRule) {
    next();
    return;
  }

  const queryStart = req.originalUrl.indexOf('?');
  const query = queryStart >= 0 ? req.originalUrl.slice(queryStart) : '';
  res.redirect(redirectRule.status, `${redirectRule.to}${query}`);
});

// The studio is documented as /login. It is an alias of /admin, answered with
// a redirect so there is exactly one canonical admin URL rather than two.
router.get('/login', (_req, res) => {
  res.redirect(302, ROUTES.ADMIN);
});

router.get(ROUTES.SITEMAP, getSitemap);

router.get(ROUTES.ROBOTS, (_req, res) => {
  const host = process.env.SITE_URL ?? 'https://euroedgeadmissiongroup.com';
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/login',
      'Disallow: /login',
      'Disallow: /api/',
      '',
      `Sitemap: ${host}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

router.get(ROUTES.ADMIN, passToVite);
router.get(ROUTES.LOGIN, passToVite);
router.get(ROUTES.LOGOUT, passToVite);
router.get(ROUTES.HOME, passToVite);

router.use(statusForUnknownRoutes);

export default router;
