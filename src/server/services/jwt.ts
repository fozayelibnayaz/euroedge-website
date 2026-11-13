import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_ALGORITHM = 'HS256' as const;
const JWT_EXPIRY = '8h';
const MAX_REVOKED = 500;

const revokedTokenIds = new Set<string>();

export const MIN_SECRET_LENGTH = 32;

export const isSessionSecretConfigured = (): boolean =>
  (process.env.SESSION_SECRET ?? '').length >= MIN_SECRET_LENGTH;

/**
 * Fail closed, never open.
 *
 * Signing with a secret that ships in the repository would let anyone forge an
 * admin session, so in production a missing or short SESSION_SECRET is a hard
 * error rather than a silent downgrade to a well-known value. Outside
 * production the dev fallback keeps `npm run dev` working out of the box.
 */
const getSecret = (): string => {
  const secret = process.env.SESSION_SECRET ?? '';
  if (secret.length >= MIN_SECRET_LENGTH) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Refusing to sign tokens: SESSION_SECRET is missing or shorter than ${String(MIN_SECRET_LENGTH)} characters. ` +
        'Set a strong secret in the environment before starting the production server.'
    );
  }
  // Dev fallback only. Production must set SESSION_SECRET.
  return 'euroedge-development-session-secret-do-not-use-in-production';
};

export interface JwtPayload extends jwt.JwtPayload {
  email: string;
  name: string;
  jti: string;
}

export const signToken = (payload: { email: string; name: string }): string => {
  return jwt.sign(payload, getSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRY,
    jwtid: crypto.randomUUID(),
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: [JWT_ALGORITHM],
    }) as JwtPayload;

    if (!decoded?.email || typeof decoded.email !== 'string') {
      return null;
    }

    if (decoded.jti && revokedTokenIds.has(decoded.jti)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const revokeToken = (token: string | undefined): void => {
  if (!token) {
    return;
  }
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: [JWT_ALGORITHM],
    }) as JwtPayload;
    if (decoded?.jti) {
      revokedTokenIds.add(decoded.jti);
      if (revokedTokenIds.size > MAX_REVOKED) {
        const oldest = revokedTokenIds.values().next().value;
        if (oldest) {
          revokedTokenIds.delete(oldest);
        }
      }
    }
  } catch {
    // An invalid token needs no revocation.
  }
};
