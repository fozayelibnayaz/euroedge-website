import type { RequestHandler, CookieOptions } from 'express';
import passport from 'passport';
import { ROUTES } from '../config/constants';
import { extractAuthPayload } from '../middleware/auth';
import { revokeToken, signToken } from '../services/jwt';
import { getAdminAccountInfo, saveNewAdminCredentials, verifyUser } from '../services/auth';
import { appendAuditEntry } from '../services/cms-store';
import { API_ERRORS } from '../config/api-error';
import type { ErrorResponse } from '@/generated/api/api-types';

interface AuthUser {
  name: string;
  email: string;
  mustRotate?: boolean;
}

const TOKEN_COOKIE_NAME = 'token';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const getCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: ROUTES.HOME,
  };
};

const clientIp = (req: Parameters<RequestHandler>[0]): string =>
  req.ip ?? req.socket.remoteAddress ?? 'unknown';

const authenticateUser = (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
  onSuccess: (user: AuthUser) => void,
  onFailure: () => void
) => {
  passport.authenticate('local', (error: unknown, user: AuthUser | false) => {
    if (error) {
      next(error);
      return undefined;
    }
    if (!user) {
      onFailure();
      return undefined;
    }
    onSuccess(user);
  })(req, res, next);
};

const createSession = (res: Parameters<RequestHandler>[1], user: AuthUser): string => {
  const token = signToken({ email: user.email, name: user.name });

  res.cookie(TOKEN_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: SESSION_MAX_AGE_MS,
  });

  return token;
};

export const postLogin: RequestHandler = (req, res, next) => {
  authenticateUser(
    req,
    res,
    next,
    (user) => {
      createSession(res, user);
      appendAuditEntry({
        actor: user.email,
        action: 'LOGIN',
        detail: `${user.email} signed in from ${clientIp(req)}`,
      });
      res.redirect(ROUTES.ADMIN);
    },
    () => {
      res.redirect(`${ROUTES.LOGIN}?error=invalid`);
    }
  );
};

export const postSession: RequestHandler = (req, res, next) => {
  authenticateUser(
    req,
    res,
    next,
    (user) => {
      const token = createSession(res, user);
      appendAuditEntry({
        actor: user.email,
        action: 'LOGIN',
        detail: `${user.email} signed in from ${clientIp(req)}`,
      });
      res.status(201).json({
        user: {
          email: user.email,
          name: user.name,
          mustRotate: user.mustRotate ?? false,
        },
        token,
      });
    },
    () => {
      const payload: ErrorResponse = {
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect username or password.',
        status: 401,
      };
      res.status(401).json(payload);
    }
  );
};

export const getMe: RequestHandler = (req, res) => {
  const payload = extractAuthPayload(req);
  if (!payload) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.status(200).json({
    authenticated: true,
    user: {
      email: payload.email,
      name: payload.name,
      mustRotate: getAdminAccountInfo().mustRotate,
    },
  });
};

const endSession = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): void => {
  const bearer = req.headers.authorization;
  if (typeof bearer === 'string' && bearer.startsWith('Bearer ')) {
    revokeToken(bearer.slice(7).trim());
  }
  revokeToken(req.cookies?.[TOKEN_COOKIE_NAME] as string | undefined);
  res.clearCookie(TOKEN_COOKIE_NAME, getCookieOptions());
};

export const deleteSession: RequestHandler = (req, res) => {
  endSession(req, res);
  res.status(204).send();
};

export const getLogout: RequestHandler = (req, res) => {
  endSession(req, res);
  res.redirect(ROUTES.HOME);
};

export const putAdminCredentials: RequestHandler = (req, res) => {
  const body = (req.body ?? {}) as {
    currentPassword?: string;
    newUsername?: string;
    newPassword?: string;
  };

  const currentPassword = body.currentPassword ?? '';
  const newUsername = (body.newUsername ?? '').trim();
  const newPassword = body.newPassword ?? '';

  const payload = extractAuthPayload(req);
  if (!payload) {
    const err = API_ERRORS.unauthorized();
    res.status(err.status).json(err);
    return;
  }

  const verified = verifyUser(payload.email, currentPassword);
  if (!verified) {
    const err = API_ERRORS.validation('Current admin password is incorrect.');
    res.status(err.status).json(err);
    return;
  }

  if (newUsername.length < 3) {
    const err = API_ERRORS.validation('New username must be at least 3 characters.');
    res.status(err.status).json(err);
    return;
  }

  if (newPassword.length < 8) {
    const err = API_ERRORS.validation('New password must be at least 8 characters.');
    res.status(err.status).json(err);
    return;
  }

  if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    const err = API_ERRORS.validation(
      'New password must include an uppercase letter, a lowercase letter and a number.'
    );
    res.status(err.status).json(err);
    return;
  }

  const saved = saveNewAdminCredentials(newUsername, newPassword);
  const token = createSession(res, { email: saved.email, name: 'EuroEdge Admin' });

  appendAuditEntry({
    actor: saved.email,
    action: 'CREDENTIALS_ROTATED',
    detail: `Admin username changed from ${payload.email} to ${saved.email}`,
  });

  res.status(200).json({
    email: saved.email,
    updatedAt: saved.updatedAt,
    token,
  });
};

export const getAdminAccount: RequestHandler = (_req, res) => {
  res.status(200).json(getAdminAccountInfo());
};
