import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  cmsDataSchema,
  type AuditLogEntry,
  type CmsData,
  type CreateInquiryInput,
  type InquirySubmission,
  type UpdateInquiryInput,
} from '../../shared/cms-types';
import { DEFAULT_CMS_DATA, DEFAULT_SEED_INQUIRIES } from '../../shared/default-cms-data';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CMS_FILE_PATH = path.join(DATA_DIR, 'cms-data.json');
const INQUIRIES_FILE_PATH = path.join(DATA_DIR, 'inquiries.json');
const CHALLENGE_TTL_MS = 45 * 60 * 1000;
const MIN_HUMAN_FILL_MS = 1200;

const getHmacSecret = (): string => {
  return process.env.SESSION_SECRET ?? 'euroedge-default-hmac-secret';
};

const ensureDataDir = (): void => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const writeJsonAtomic = (targetPath: string, data: unknown): void => {
  ensureDataDir();
  const tempPath = `${targetPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, targetPath);
};

export const sanitizePlainText = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Strips C0/C1 control characters from stored text on purpose.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
};

export const hashIpAddress = (ipAddress: string): string => {
  return crypto
    .createHmac('sha256', getHmacSecret())
    .update(ipAddress)
    .digest('hex')
    .slice(0, 16);
};

export const createFormChallenge = (): {
  question: string;
  challengeToken: string;
  issuedAt: number;
} => {
  const leftOperand = crypto.randomInt(3, 12);
  const rightOperand = crypto.randomInt(2, 9);
  const expectedSum = String(leftOperand + rightOperand);
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  const rawPayload = `${String(issuedAt)}.${nonce}.${expectedSum}`;
  const signature = crypto
    .createHmac('sha256', getHmacSecret())
    .update(rawPayload)
    .digest('hex');

  const encoded = Buffer.from(`${String(issuedAt)}.${nonce}.${signature}`).toString('base64url');

  return {
    question: `${String(leftOperand)} + ${String(rightOperand)}`,
    challengeToken: encoded,
    issuedAt,
  };
};

export const verifyFormChallenge = (
  challengeToken: string,
  userAnswer: string,
  formStartedAt?: number
): { valid: boolean; reason?: string } => {
  try {
    const decoded = Buffer.from(challengeToken, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid security verification token.' };
    }

    const [issuedAtStr, nonce, providedSignature] = parts;
    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt)) {
      return { valid: false, reason: 'Corrupted security verification timestamp.' };
    }

    const elapsed = Date.now() - issuedAt;
    if (elapsed > CHALLENGE_TTL_MS || elapsed < 0) {
      return { valid: false, reason: 'Security challenge expired. Please refresh the check.' };
    }

    if (typeof formStartedAt === 'number' && Date.now() - formStartedAt < MIN_HUMAN_FILL_MS) {
      return { valid: false, reason: 'Submission received too quickly. Please try again.' };
    }

    const normalizedAnswer = userAnswer.trim();
    const expectedSignature = crypto
      .createHmac('sha256', getHmacSecret())
      .update(`${issuedAtStr}.${nonce}.${normalizedAnswer}`)
      .digest('hex');

    const sigBufferA = Buffer.from(providedSignature, 'utf-8');
    const sigBufferB = Buffer.from(expectedSignature, 'utf-8');
    if (sigBufferA.length !== sigBufferB.length || !crypto.timingSafeEqual(sigBufferA, sigBufferB)) {
      return { valid: false, reason: 'Incorrect security check answer. Please solve the math prompt.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Failed to verify security token.' };
  }
};

export const getCmsData = (): CmsData => {
  ensureDataDir();
  if (!fs.existsSync(CMS_FILE_PATH)) {
    writeJsonAtomic(CMS_FILE_PATH, DEFAULT_CMS_DATA);
    return structuredClone(DEFAULT_CMS_DATA);
  }

  try {
    const raw = fs.readFileSync(CMS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = cmsDataSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    return structuredClone(DEFAULT_CMS_DATA);
  } catch {
    return structuredClone(DEFAULT_CMS_DATA);
  }
};

export const saveCmsData = (nextData: CmsData): CmsData => {
  const stamped: CmsData = {
    ...nextData,
    updatedAt: new Date().toISOString(),
  };
  const validated = cmsDataSchema.parse(stamped);
  writeJsonAtomic(CMS_FILE_PATH, validated);
  return validated;
};

export const resetCmsData = (): CmsData => {
  const fresh: CmsData = {
    ...structuredClone(DEFAULT_CMS_DATA),
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(CMS_FILE_PATH, fresh);
  return fresh;
};

export const getInquiries = (): InquirySubmission[] => {
  ensureDataDir();
  if (!fs.existsSync(INQUIRIES_FILE_PATH)) {
    writeJsonAtomic(INQUIRIES_FILE_PATH, DEFAULT_SEED_INQUIRIES);
    return structuredClone(DEFAULT_SEED_INQUIRIES);
  }

  try {
    const raw = fs.readFileSync(INQUIRIES_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as InquirySubmission[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

export const createInquiryRecord = (
  input: CreateInquiryInput,
  ipAddress: string
): InquirySubmission => {
  const existing = getInquiries();
  const nowIso = new Date().toISOString();
  const randomDigits = String(crypto.randomInt(1000, 9999));
  const year = new Date().getUTCFullYear();

  const record: InquirySubmission = {
    id: `inq-${crypto.randomUUID()}`,
    ticketId: `EE-${String(year)}-${randomDigits}`,
    firstName: sanitizePlainText(input.firstName),
    lastName: sanitizePlainText(input.lastName),
    email: sanitizePlainText(input.email).toLowerCase(),
    phone: sanitizePlainText(input.phone),
    countryOfInterest: sanitizePlainText(input.countryOfInterest),
    programInterest: sanitizePlainText(input.programInterest),
    preferredIntake: sanitizePlainText(input.preferredIntake),
    subject: sanitizePlainText(input.subject),
    message: sanitizePlainText(input.message),
    status: 'new',
    advisorNotes: '',
    ipHash: hashIpAddress(ipAddress),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updated = [record, ...existing];
  writeJsonAtomic(INQUIRIES_FILE_PATH, updated);
  return record;
};

export const updateInquiryRecord = (
  inquiryId: string,
  updates: UpdateInquiryInput
): InquirySubmission | null => {
  const existing = getInquiries();
  const targetIndex = existing.findIndex((item) => item.id === inquiryId);
  if (targetIndex < 0) {
    return null;
  }

  const current = existing[targetIndex];
  const updatedItem: InquirySubmission = {
    ...current,
    status: updates.status ?? current.status,
    advisorNotes: typeof updates.advisorNotes === 'string'
      ? sanitizePlainText(updates.advisorNotes)
      : current.advisorNotes,
    updatedAt: new Date().toISOString(),
  };

  const nextList = [...existing];
  nextList[targetIndex] = updatedItem;
  writeJsonAtomic(INQUIRIES_FILE_PATH, nextList);
  return updatedItem;
};

export const deleteInquiryRecord = (inquiryId: string): boolean => {
  const existing = getInquiries();
  const filtered = existing.filter((item) => item.id !== inquiryId);
  if (filtered.length === existing.length) {
    return false;
  }

  writeJsonAtomic(INQUIRIES_FILE_PATH, filtered);
  return true;
};

/* ------------------------------------------------------------------ *
 * Audit log
 * ------------------------------------------------------------------ */

const AUDIT_FILE_PATH = path.join(DATA_DIR, 'audit-log.json');
const MAX_AUDIT_ENTRIES = 250;

export const getAuditLog = (): AuditLogEntry[] => {
  ensureDataDir();
  if (!fs.existsSync(AUDIT_FILE_PATH)) {
    writeJsonAtomic(AUDIT_FILE_PATH, []);
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(AUDIT_FILE_PATH, 'utf-8')) as AuditLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const appendAuditEntry = (entry: {
  actor: string;
  action: string;
  detail?: string;
}): void => {
  try {
    const current = getAuditLog();
    const next: AuditLogEntry = {
      id: `log-${crypto.randomUUID()}`,
      at: new Date().toISOString(),
      actor: entry.actor,
      action: entry.action,
      detail: entry.detail ?? '',
    };
    writeJsonAtomic(AUDIT_FILE_PATH, [next, ...current].slice(0, MAX_AUDIT_ENTRIES));
  } catch {
    // Audit logging must never break a request.
  }
};
