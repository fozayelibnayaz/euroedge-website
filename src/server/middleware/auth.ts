import type { RequestHandler, Request } from 'express';
import { API_PREFIX, ROUTES } from '../config/constants';
import { API_ERRORS } from '../config/api-error';
import { verifyToken, type JwtPayload } from '../services/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const extractAuthPayload = (req: Request): JwtPayload | null => {
  const cookieToken = req.cookies?.token as string | undefined;
  if (cookieToken) {
    const verifiedCookie = verifyToken(cookieToken);
    if (verifiedCookie) {
      return verifiedCookie;
    }
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      return verifyToken(bearerToken);
    }
  }

  return null;
};

export const ensureAuthenticated: RequestHandler = (req, res, next) => {
  const payload = extractAuthPayload(req);
  if (payload) {
    (req as AuthenticatedRequest).user = payload;
    next();
    return undefined;
  }

  if (req.path.startsWith(API_PREFIX)) {
    const error = API_ERRORS.unauthorized();
    res.status(error.status).json(error);
    return undefined;
  }

  res.redirect(ROUTES.LOGIN);
};
