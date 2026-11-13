import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import {
  cmsDataSchema,
  createInquirySchema,
  updateInquirySchema,
} from '../../shared/cms-types';
import {
  appendAuditEntry,
  createFormChallenge,
  createInquiryRecord,
  deleteInquiryRecord,
  getCmsData,
  getInquiries,
  resetCmsData,
  saveCmsData,
  updateInquiryRecord,
  verifyFormChallenge,
} from '../services/cms-store';
import { CSRF_COOKIE_NAME } from '../middleware/csrf';
import { extractAuthPayload } from '../middleware/auth';
import { API_ERRORS } from '../config/api-error';

export const inquiryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    code: 'TOO_MANY_INQUIRIES',
    message: 'Too many consultation submissions from this network. Please wait a few minutes or message us on WhatsApp.',
  },
});

export const getPublicCms: RequestHandler = (_req, res) => {
  const cms = getCmsData();
  res.status(200).json(cms);
};

export const getFormChallenge: RequestHandler = (req, res) => {
  const challenge = createFormChallenge();
  const csrfToken = (req.cookies?.[CSRF_COOKIE_NAME] as string | undefined) ?? '';
  res.status(200).json({
    ...challenge,
    csrfToken,
  });
};

export const postPublicInquiry: RequestHandler = (req, res) => {
  const parsed = createInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Invalid inquiry fields.';
    const error = API_ERRORS.validation(firstIssue);
    res.status(error.status).json(error);
    return;
  }

  // Invisible honeypot check — quietly reject bots without tipping them off
  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    res.status(201).json({
      ticketId: 'EE-2026-0000',
      createdAt: new Date().toISOString(),
      message: 'Your inquiry has been logged.',
    });
    return;
  }

  const verification = verifyFormChallenge(
    parsed.data.challengeToken,
    parsed.data.challengeAnswer,
    parsed.data.formStartedAt
  );

  if (!verification.valid) {
    const error = API_ERRORS.validation(verification.reason ?? 'Security verification failed.');
    res.status(error.status).json(error);
    return;
  }

  const clientIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const saved = createInquiryRecord(parsed.data, clientIp);

  res.status(201).json({
    ticketId: saved.ticketId,
    createdAt: saved.createdAt,
    message: 'Thank you! Your secured consultation dossier has been assigned to an advisor.',
  });
};

export const putAdminCms: RequestHandler = (req, res) => {
  const candidate = {
    ...(req.body as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  };

  const parsed = cmsDataSchema.safeParse(candidate);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const pathLabel = firstIssue ? firstIssue.path.join('.') : 'cms';
    const message = firstIssue
      ? `${pathLabel}: ${firstIssue.message}`
      : 'Invalid CMS payload.';
    const error = API_ERRORS.validation(message);
    res.status(error.status).json(error);
    return;
  }

  const updated = saveCmsData(parsed.data);

  const actor = extractAuthPayload(req)?.email ?? 'unknown';
  appendAuditEntry({ actor, action: 'CMS_SAVED', detail: 'Site content updated' });

  res.status(200).json(updated);
};

export const postAdminResetCms: RequestHandler = (req, res) => {
  const fresh = resetCmsData();
  const actor = extractAuthPayload(req)?.email ?? 'unknown';
  appendAuditEntry({ actor, action: 'CMS_RESET', detail: 'Content restored to factory defaults' });
  res.status(200).json(fresh);
};

export const getAdminInquiries: RequestHandler = (_req, res) => {
  const inquiries = getInquiries();
  res.status(200).json({ inquiries });
};

export const patchAdminInquiry: RequestHandler = (req, res) => {
  const rawId = req.params.id;
  const inquiryId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!inquiryId) {
    const error = API_ERRORS.validation('Inquiry ID is required');
    res.status(error.status).json(error);
    return;
  }

  const parsed = updateInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    const error = API_ERRORS.validation('Invalid inquiry update payload');
    res.status(error.status).json(error);
    return;
  }

  const updated = updateInquiryRecord(inquiryId, parsed.data);
  if (!updated) {
    const error = API_ERRORS.notFound('Inquiry');
    res.status(error.status).json(error);
    return;
  }

  appendAuditEntry({
    actor: extractAuthPayload(req)?.email ?? 'unknown',
    action: 'INQUIRY_UPDATED',
    detail: `${updated.ticketId} updated`,
  });

  res.status(200).json({ inquiry: updated });
};

export const deleteAdminInquiry: RequestHandler = (req, res) => {
  const rawId = req.params.id;
  const inquiryId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!inquiryId) {
    const error = API_ERRORS.validation('Inquiry ID is required');
    res.status(error.status).json(error);
    return;
  }

  const deleted = deleteInquiryRecord(inquiryId);
  if (!deleted) {
    const error = API_ERRORS.notFound('Inquiry');
    res.status(error.status).json(error);
    return;
  }

  appendAuditEntry({
    actor: extractAuthPayload(req)?.email ?? 'unknown',
    action: 'INQUIRY_DELETED',
    detail: `Inquiry ${inquiryId} removed`,
  });

  res.status(204).send();
};
