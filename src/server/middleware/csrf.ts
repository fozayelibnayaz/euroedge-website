import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { API_PATHS, ROUTES } from '../config/constants';
import { API_ERRORS } from '../config/api-error';

export const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_FIELD_NAME = '_csrf';

/**
 * Double-submit cookie CSRF protection with Bearer/HMAC API compatibility.
 *
 * - Browser cookie form/session mutations require matching `csrf-token` cookie
 *   via `_csrf` body field or `x-csrf-token` header.
 * - `Authorization: Bearer <jwt>` API requests are inherently immune to cross-site
 *   cookie auto-attachment, enabling admin CMS usage even when third-party cookies
 *   are partitioned in embedded preview iframes.
 * - Public inquiry submissions additionally verify a stateless HMAC challenge token.
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  let activeCookieToken = existingToken;

  if (!activeCookieToken) {
    activeCookieToken = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, activeCookieToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: ROUTES.HOME,
    });
  }

  const isUnsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isUnsafeMethod) {
    next();
    return;
  }

  // Requests carrying an explicit Authorization Bearer token are not vulnerable to cookie CSRF
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // Public inquiry endpoint enforces its own HMAC challenge + honeypot + rate limit,
  // and REST JSON session login sends x-requested-with header from same-origin fetch
  const requestedWith = req.headers['x-requested-with'];
  if (
    (req.path === API_PATHS.INQUIRIES || req.path === API_PATHS.SESSION)
    && requestedWith === 'EuroEdgeClient'
  ) {
    next();
    return;
  }

  const bodyRecord = (req.body ?? {}) as Record<string, unknown>;
  const formToken = (bodyRecord[CSRF_FIELD_NAME] as string | undefined)
    ?? (req.headers['x-csrf-token'] as string | undefined);

  if (!existingToken || !formToken || existingToken !== formToken) {
    const error = API_ERRORS.forbidden('CSRF token validation failed');
    res.status(error.status).json(error);
    return;
  }

  next();
};
