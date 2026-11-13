import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  ITERATIONS,
  KEY_LENGTH,
  DIGEST,
} from '../config/constants';
import { AUTH_PROFILES, getAuthProfile, isExternalAuthProfile } from '../config/auth-profile';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ADMIN_AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

interface StoredAdminAuth {
  name: string;
  email: string;
  password: string;
  salt: string;
  updatedAt: string;
  mustRotate: boolean;
}

export interface VerifiedAdmin {
  name: string;
  email: string;
  mustRotate: boolean;
}

type HashFunction = (password: string, salt: string) => string;

export const hashPassword: HashFunction = (password, salt) => {
  return crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
};

export const generateSalt = (): string => crypto.randomBytes(18).toString('hex');

const ensureDataDir = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const writeAuthAtomic = (record: StoredAdminAuth): void => {
  ensureDataDir();
  const tempPath = `${ADMIN_AUTH_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(record, null, 2), 'utf-8');
  fs.renameSync(tempPath, ADMIN_AUTH_FILE);
  fs.chmodSync(ADMIN_AUTH_FILE, 0o600);
};

const readStoredAdminAccount = (): StoredAdminAuth | null => {
  try {
    if (!fs.existsSync(ADMIN_AUTH_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(ADMIN_AUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoredAdminAuth>;
    if (parsed.email && parsed.password && parsed.salt) {
      return {
        name: parsed.name ?? 'EuroEdge Admin',
        email: parsed.email,
        password: parsed.password,
        salt: parsed.salt,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
        mustRotate: parsed.mustRotate ?? false,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * First boot writes a PBKDF2 hash of the shipped owner password into
 * `data/admin-auth.json`. The plaintext default never appears in the file.
 */
export const bootstrapAdminAccount = (): StoredAdminAuth => {
  const existing = readStoredAdminAccount();
  if (existing) {
    return existing;
  }

  const username = (process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME).trim();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const salt = generateSalt();
  const record: StoredAdminAuth = {
    name: 'EuroEdge Admin',
    email: username,
    password: hashPassword(password, salt),
    salt,
    updatedAt: new Date().toISOString(),
    mustRotate: password === DEFAULT_ADMIN_PASSWORD,
  };
  writeAuthAtomic(record);
  return record;
};

export const saveNewAdminCredentials = (
  nextEmail: string,
  nextPlainPassword: string
): { email: string; updatedAt: string } => {
  const salt = generateSalt();
  const record: StoredAdminAuth = {
    name: 'EuroEdge Admin',
    email: nextEmail.trim(),
    password: hashPassword(nextPlainPassword, salt),
    salt,
    updatedAt: new Date().toISOString(),
    mustRotate: false,
  };
  writeAuthAtomic(record);
  return { email: record.email, updatedAt: record.updatedAt };
};

let hasWarnedAboutAuthProfile = false;

const getActiveAdminAccount = (): StoredAdminAuth => {
  const stored = readStoredAdminAccount();
  if (stored) {
    return stored;
  }

  const envUsername = process.env.ADMIN_USERNAME?.trim();
  const envSalt = process.env.ADMIN_PASSWORD_SALT?.trim();
  const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (envUsername && envSalt && envHash) {
    return {
      name: 'EuroEdge Admin',
      email: envUsername,
      password: envHash,
      salt: envSalt,
      updatedAt: '',
      mustRotate: false,
    };
  }

  return bootstrapAdminAccount();
};

const timingSafeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyWithLocalUser = (username: string, password: string): VerifiedAdmin | null => {
  const user = getActiveAdminAccount();

  // Always run the (expensive) hash so response time does not leak whether
  // the username exists.
  const hashedPassword = hashPassword(password, user.salt);
  const usernameMatches = timingSafeEqual(username.trim(), user.email);
  const passwordMatches = timingSafeEqual(hashedPassword, user.password);

  if (!usernameMatches || !passwordMatches) {
    return null;
  }

  return { name: user.name, email: user.email, mustRotate: user.mustRotate };
};

const warnUnsupportedProfile = (profile: string): void => {
  if (hasWarnedAboutAuthProfile) {
    return;
  }

  hasWarnedAboutAuthProfile = true;

  console.warn(
    `[auth] AUTH_PROFILE="${profile}" is starter-mode only. ` +
      'Wire real provider verification before enabling production auth backends.'
  );
};

export const verifyUser = (username: string, password: string): VerifiedAdmin | null => {
  const profile = getAuthProfile();

  if (profile === AUTH_PROFILES.LOCAL) {
    return verifyWithLocalUser(username, password);
  }

  if (isExternalAuthProfile(profile)) {
    warnUnsupportedProfile(profile);
    return null;
  }

  return null;
};

export const getAdminAccountInfo = (): { email: string; updatedAt: string; mustRotate: boolean } => {
  const account = getActiveAdminAccount();
  return {
    email: account.email,
    updatedAt: account.updatedAt,
    mustRotate: account.mustRotate,
  };
};
