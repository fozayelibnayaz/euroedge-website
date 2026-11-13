import { Router } from 'express';
import { API_PATHS } from '../config/constants';
import { getKey } from '../controllers/api';
import { getAdminAccount, putAdminCredentials } from '../controllers/auth';
import {
  deleteAdminInquiry,
  getAdminInquiries,
  getFormChallenge,
  getPublicCms,
  inquiryRateLimiter,
  patchAdminInquiry,
  postAdminResetCms,
  postPublicInquiry,
  putAdminCms,
} from '../controllers/cms';
import {
  deleteAdminMedia,
  getAdminAudit,
  getAdminMedia,
  postAdminMedia,
  uploadRateLimiter,
} from '../controllers/media';
import { ensureAuthenticated } from '../middleware/auth';

const router = Router();

// Public CMS & secured form endpoints
router.get(API_PATHS.CMS, getPublicCms);
router.get(API_PATHS.FORM_CHALLENGE, getFormChallenge);
router.post(API_PATHS.INQUIRIES, inquiryRateLimiter, postPublicInquiry);

// Authenticated Admin CMS, media, CRM & security endpoints
router.get(API_PATHS.KEY, ensureAuthenticated, getKey);
router.put(API_PATHS.ADMIN_CMS, ensureAuthenticated, putAdminCms);
router.post(API_PATHS.ADMIN_CMS_RESET, ensureAuthenticated, postAdminResetCms);
router.get(API_PATHS.ADMIN_INQUIRIES, ensureAuthenticated, getAdminInquiries);
router.patch(`${API_PATHS.ADMIN_INQUIRIES}/:id`, ensureAuthenticated, patchAdminInquiry);
router.delete(`${API_PATHS.ADMIN_INQUIRIES}/:id`, ensureAuthenticated, deleteAdminInquiry);
router.get(API_PATHS.ADMIN_MEDIA, ensureAuthenticated, getAdminMedia);
router.post(API_PATHS.ADMIN_MEDIA, ensureAuthenticated, uploadRateLimiter, postAdminMedia);
router.delete(`${API_PATHS.ADMIN_MEDIA}/:id`, ensureAuthenticated, deleteAdminMedia);
router.get(API_PATHS.ADMIN_AUDIT, ensureAuthenticated, getAdminAudit);
router.get(API_PATHS.ADMIN_CREDENTIALS, ensureAuthenticated, getAdminAccount);
router.put(API_PATHS.ADMIN_CREDENTIALS, ensureAuthenticated, putAdminCredentials);

export default router;
