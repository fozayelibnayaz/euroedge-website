import { DEFAULT_PORT, BASE } from './config/constants';
import express from 'express';
import ViteExpress from 'vite-express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { applySecurityHeaders } from './middleware/security-headers';
import { csrfProtection } from './middleware/csrf';
import { globalErrorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import pageRoutes from './routes/pages';
import { bootstrapAdminAccount } from './services/auth';
import { ensureUploadDir } from './services/media-store';
import { isSessionSecretConfigured } from './services/jwt';

/** Admin surfaces must never be cached by a shared proxy or the browser. */
const noStore: express.RequestHandler = (req, res, next) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
};

const setupMiddleware = (app: express.Application) => {
  applySecurityHeaders(app);

  app.set('trust proxy', 1);
  app.use(express.static(path.resolve(process.cwd(), 'public')));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  // Media uploads arrive base64-encoded inside JSON, so allow a larger body here.
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());
  app.use(noStore);
};

const setupRoutes = (app: express.Application) => {
  app.use(csrfProtection);
  app.use(authRoutes);
  app.use(apiRoutes);

  // Unknown /api/* paths must answer with JSON, never the SPA shell, so a
  // mistyped or probed endpoint cannot be mistaken for a valid route.
  app.use('/api', (_req, res) => {
    res.status(404).json({
      status: 404,
      code: 'API_NOT_FOUND',
      message: 'Unknown API endpoint.',
    });
  });

  app.use(pageRoutes);
  app.use(globalErrorHandler);
};

const startServer = () => {
  const app = express();

  // Refuse to boot in production without a real session secret. A server that
  // signs admin tokens with the repository's dev fallback is worse than one
  // that never starts at all.
  if (process.env.NODE_ENV === 'production' && !isSessionSecretConfigured()) {
    // eslint-disable-next-line no-console
    console.error(
      '[security] Refusing to start: SESSION_SECRET is missing or shorter than 32 characters. ' +
        'Set a strong secret in the environment before going live.'
    );
    process.exit(1);
  }

  setupMiddleware(app);
  setupRoutes(app);

  const port = parseInt(process.env.PORT ?? DEFAULT_PORT, BASE);
  const host = process.env.HOST ?? '0.0.0.0';
  const displayPort = new Intl.NumberFormat('en-US', {
    useGrouping: false,
  }).format(port);

  const httpServer = app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(
      `${process.env.NODE_ENV ?? 'development'} EuroEdge server listening on http://${host}:${displayPort}`
    );
  });

  ViteExpress.bind(app, httpServer);
};

ensureUploadDir();
bootstrapAdminAccount();
startServer();
