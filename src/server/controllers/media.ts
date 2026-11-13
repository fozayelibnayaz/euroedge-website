import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { mediaUploadSchema } from '../../shared/cms-types';
import { createId } from '../../shared/cms-types';
import { getAuditLog, getCmsData, saveCmsData, appendAuditEntry } from '../services/cms-store';
import { deleteUploadByUrl, storeUpload } from '../services/media-store';
import { API_ERRORS } from '../config/api-error';
import { extractAuthPayload } from '../middleware/auth';

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    code: 'TOO_MANY_UPLOADS',
    message: 'Upload limit reached for this session. Please wait a few minutes.',
  },
});

export const getAdminMedia: RequestHandler = (_req, res) => {
  res.status(200).json({ media: getCmsData().media });
};

export const postAdminMedia: RequestHandler = (req, res) => {
  const payload = extractAuthPayload(req);
  if (!payload) {
    const err = API_ERRORS.unauthorized();
    res.status(err.status).json(err);
    return;
  }

  const parsed = mediaUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    const err = API_ERRORS.validation('Invalid upload payload.');
    res.status(err.status).json(err);
    return;
  }

  const result = storeUpload(parsed.data.mime, parsed.data.data, parsed.data.name);
  if (!result.ok) {
    const err = API_ERRORS.validation(result.reason);
    res.status(err.status).json(err);
    return;
  }

  const cms = getCmsData();
  const item = {
    id: createId('media'),
    name: result.upload.name,
    url: result.upload.url,
    mime: result.upload.mime,
    size: result.upload.size,
    alt: parsed.data.alt,
    createdAt: new Date().toISOString(),
  };
  const updated = saveCmsData({ ...cms, media: [item, ...cms.media] });

  appendAuditEntry({
    actor: payload.email,
    action: 'MEDIA_UPLOAD',
    detail: `Uploaded ${item.url}`,
  });

  res.status(201).json({ item, media: updated.media });
};

export const deleteAdminMedia: RequestHandler = (req, res) => {
  const payload = extractAuthPayload(req);
  if (!payload) {
    const err = API_ERRORS.unauthorized();
    res.status(err.status).json(err);
    return;
  }

  const rawId = req.params.id;
  const mediaId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!mediaId) {
    const err = API_ERRORS.validation('Media ID is required');
    res.status(err.status).json(err);
    return;
  }

  const cms = getCmsData();
  const target = cms.media.find((entry) => entry.id === mediaId);
  if (!target) {
    const err = API_ERRORS.notFound('Media');
    res.status(err.status).json(err);
    return;
  }

  deleteUploadByUrl(target.url);
  const updated = saveCmsData({ ...cms, media: cms.media.filter((entry) => entry.id !== mediaId) });

  appendAuditEntry({
    actor: payload.email,
    action: 'MEDIA_DELETE',
    detail: `Deleted ${target.url}`,
  });

  res.status(200).json({ media: updated.media });
};

export const getAdminAudit: RequestHandler = (_req, res) => {
  res.status(200).json({ entries: getAuditLog() });
};
