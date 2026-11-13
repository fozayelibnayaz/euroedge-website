import helmet from 'helmet';
import type { RequestHandler, Application } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const cspDirectives: Record<string, string[]> = {
  defaultSrc: ['\'self\''],
  scriptSrc: isProduction
    ? ['\'self\'', '\'inline-speculation-rules\'']
    : ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
  styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
  imgSrc: ['\'self\'', 'data:', 'blob:', 'https:'],
  fontSrc: ['\'self\'', 'data:', 'https://fonts.gstatic.com'],
  connectSrc: ['\'self\'', 'ws:', 'wss:', 'https:'],
  objectSrc: ['\'none\''],
  baseUri: ['\'self\''],
  formAction: ['\'self\''],
  // Nothing here is meant to be embedded in a frame. frame-ancestors is the
  // modern directive; X-Frame-Options is kept alongside it for older agents.
  // Helmet ships frame-ancestors 'self' by default, so this must be explicit.
  frameAncestors: ['\'none\''],
};

const permissionsPolicyMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',
      'browsing-topics=()',
      'attribution-reporting=()',
    ].join(', ')
  );
  next();
};

export const applySecurityHeaders = (app: Application): void => {
  app.use(
    helmet({
      contentSecurityPolicy: { directives: cspDirectives },
      strictTransportSecurity: isProduction
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hidePoweredBy: true,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      xssFilter: false,
    })
  );

  app.use(permissionsPolicyMiddleware);
};
