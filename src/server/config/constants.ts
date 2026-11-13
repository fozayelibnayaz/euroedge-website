export const DEFAULT_PORT = '3000';

export const ROUTES = {
  HOME: '/',
  STUDY: '/study',
  STUDY_DETAIL: '/study/:slug',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:slug',
  SERVICES: '/services',
  RECRUITMENT: '/recruitment',
  RECRUITMENT_DETAIL: '/recruitment/:slug',
  ABOUT: '/about',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:slug',
  CONTACT: '/contact',
  LOGIN: '/admin/login',
  ADMIN: '/admin',
  POLICIES: '/policies',
  LOGOUT: '/admin/logout',
  SITEMAP: '/sitemap.xml',
  ROBOTS: '/robots.txt',
} as const;

export const API_PATHS = {
  LOGIN: '/login/password',
  LOGOUT: '/logout',
  SESSION: '/api/session',
  AUTH_ME: '/api/auth/me',
  KEY: '/api/key',
  CMS: '/api/cms',
  FORM_CHALLENGE: '/api/form-challenge',
  INQUIRIES: '/api/inquiries',
  ADMIN_CMS: '/api/admin/cms',
  ADMIN_CMS_RESET: '/api/admin/cms/reset',
  ADMIN_INQUIRIES: '/api/admin/inquiries',
  ADMIN_CREDENTIALS: '/api/admin/credentials',
  ADMIN_MEDIA: '/api/admin/media',
  ADMIN_AUDIT: '/api/admin/audit',
} as const;

/** Path prefix for API routes (e.g. for error handling). */
export const API_PREFIX = '/api';

/** Fallback admin credentials used only until the owner rotates them. */
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'euroedge';

// encryption parameters
export const ITERATIONS = 210000;
export const KEY_LENGTH = 64;
export const DIGEST = 'sha512';

export const BASE = 10;

/** Upload limits */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
