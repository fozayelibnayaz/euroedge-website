export type RedirectStatusCode = 301 | 302 | 307 | 308;

interface RedirectRule {
  from: string;
  to: string;
  status: RedirectStatusCode;
}

const normalizeRoutePath = (routePath: string): string => {
  if (routePath === '/') {
    return routePath;
  }
  return routePath.replace(/\/+$/, '');
};

const REDIRECT_RULES: readonly RedirectRule[] = [
  { from: '/privacy', to: '/policies', status: 301 },
  { from: '/terms', to: '/policies', status: 301 },
  // Legacy WordPress SEO preservation redirects
  { from: '/about-us', to: '/about', status: 301 },
  { from: '/study-in-uk', to: '/study/study-in-uk', status: 301 },
  { from: '/study-in-usa', to: '/study/study-in-usa', status: 301 },
  { from: '/study-in-canada', to: '/study/study-in-canada', status: 301 },
  { from: '/study-in-australia', to: '/study/study-in-australia', status: 301 },
  { from: '/study-in-europe', to: '/study/study-in-europe', status: 301 },
  { from: '/study-in-malaysia', to: '/study/study-in-malaysia', status: 301 },
  { from: '/b1-english-course', to: '/courses/b1-english-course', status: 301 },
  { from: '/b2-english-course', to: '/courses/b2-english-course', status: 301 },
  { from: '/ielts-preparation', to: '/courses/ielts-preparation', status: 301 },
  { from: '/spoken-english', to: '/courses/spoken-english', status: 301 },
  { from: '/visa-assistance', to: '/services', status: 301 },
  { from: '/university-admission', to: '/services', status: 301 },
  { from: '/scholarship-guidance', to: '/services', status: 301 },
  { from: '/pre-departure-briefing', to: '/services', status: 301 },
];

const REDIRECT_LOOKUP = new Map(
  REDIRECT_RULES.map((rule) => [normalizeRoutePath(rule.from), rule])
);

export const getRedirectRule = (requestPath: string): RedirectRule | undefined => {
  return REDIRECT_LOOKUP.get(normalizeRoutePath(requestPath));
};

export const REDIRECT_CONFIGURATION_PATH = 'src/server/config/redirects.ts';
