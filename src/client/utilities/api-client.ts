import { API_PATHS } from './constants';
import { getCsrfToken } from './csrf';
import {
  type AuditLogEntry,
  type CmsData,
  type CreateInquiryInput,
  type FormChallengePayload,
  type InquirySubmission,
  type MediaItem,
  type UpdateInquiryInput,
} from '@/shared/cms-types';

const AUTH_TOKEN_STORAGE_KEY = 'euroedge_admin_jwt';

export const getStoredAdminToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredAdminToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (token) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
};

const buildHeaders = (includeJson = true): HeadersInit => {
  const headers: Record<string, string> = {
    'X-Requested-With': 'EuroEdgeClient',
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const bearer = getStoredAdminToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  return headers;
};

export const fetchCmsData = async (): Promise<CmsData> => {
  const response = await fetch(API_PATHS.CMS, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Failed to load site content');
  }

  return response.json() as Promise<CmsData>;
};

export const fetchFormChallenge = async (): Promise<FormChallengePayload> => {
  const response = await fetch(API_PATHS.FORM_CHALLENGE, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Failed to initialize security check');
  }

  return response.json() as Promise<FormChallengePayload>;
};

export const submitSecuredInquiry = async (
  payload: CreateInquiryInput
): Promise<{ ticketId: string; createdAt: string; message: string }> => {
  const response = await fetch(API_PATHS.INQUIRIES, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      ...payload,
      _csrf: getCsrfToken(),
    }),
  });

  const data = (await response.json()) as {
    ticketId?: string;
    createdAt?: string;
    message?: string;
  };

  if (!response.ok || !data.ticketId) {
    throw new Error(data.message ?? 'Could not submit inquiry. Please verify fields.');
  }

  return {
    ticketId: data.ticketId,
    createdAt: data.createdAt ?? new Date().toISOString(),
    message: data.message ?? 'Inquiry received.',
  };
};

export const loginAdminSession = async (
  username: string,
  password: string
): Promise<{ email: string; name: string }> => {
  const response = await fetch(API_PATHS.SESSION, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      username,
      password,
      _csrf: getCsrfToken(),
    }),
  });

  const data = (await response.json()) as {
    user?: { email: string; name: string };
    token?: string;
    message?: string;
  };

  if (!response.ok || !data.user) {
    throw new Error(data.message ?? 'Invalid username or password.');
  }

  if (data.token) {
    setStoredAdminToken(data.token);
  }

  return data.user;
};

export const logoutAdminSession = async (): Promise<void> => {
  const bearer = getStoredAdminToken();
  setStoredAdminToken(null);
  try {
    await fetch(API_PATHS.SESSION, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'EuroEdgeClient',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken() } : {}),
      },
    });
  } catch {
    // ignore network cleanup errors
  }
};

export const checkAdminSession = async (): Promise<{
  authenticated: boolean;
  user?: { email: string; name: string };
}> => {
  const response = await fetch(API_PATHS.AUTH_ME, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return response.json() as Promise<{
    authenticated: boolean;
    user?: { email: string; name: string };
  }>;
};

export const updateAdminCmsData = async (nextCms: CmsData): Promise<CmsData> => {
  const response = await fetch(API_PATHS.ADMIN_CMS, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      ...nextCms,
      _csrf: getCsrfToken(),
    }),
  });

  const data = (await response.json()) as CmsData & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? 'Failed to save CMS updates.');
  }

  return data;
};

export const resetAdminCmsData = async (): Promise<CmsData> => {
  const response = await fetch(API_PATHS.ADMIN_CMS_RESET, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({ _csrf: getCsrfToken() }),
  });

  if (!response.ok) {
    throw new Error('Failed to reset CMS content.');
  }

  return response.json() as Promise<CmsData>;
};

export const fetchAdminInquiries = async (): Promise<InquirySubmission[]> => {
  const response = await fetch(API_PATHS.ADMIN_INQUIRIES, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Unauthorized or unable to load inquiries.');
  }

  const body = (await response.json()) as { inquiries: InquirySubmission[] };
  return body.inquiries;
};

export const patchAdminInquiryItem = async (
  inquiryId: string,
  updates: UpdateInquiryInput
): Promise<InquirySubmission> => {
  const response = await fetch(`${API_PATHS.ADMIN_INQUIRIES}/${inquiryId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      ...updates,
      _csrf: getCsrfToken(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update inquiry record.');
  }

  const body = (await response.json()) as { inquiry: InquirySubmission };
  return body.inquiry;
};

export const deleteAdminInquiryItem = async (inquiryId: string): Promise<void> => {
  const response = await fetch(`${API_PATHS.ADMIN_INQUIRIES}/${inquiryId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({ _csrf: getCsrfToken() }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete inquiry record.');
  }
};

export const updateAdminCredentials = async (payload: {
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}): Promise<{ email: string; updatedAt: string }> => {
  const response = await fetch(API_PATHS.ADMIN_CREDENTIALS, {
    method: 'PUT',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      ...payload,
      _csrf: getCsrfToken(),
    }),
  });

  const data = (await response.json()) as {
    email?: string;
    updatedAt?: string;
    token?: string;
    message?: string;
  };

  if (!response.ok || !data.email) {
    throw new Error(data.message ?? 'Could not update credentials.');
  }

  if (data.token) {
    setStoredAdminToken(data.token);
  }

  return {
    email: data.email,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
};

export const uploadAdminMedia = async (file: File): Promise<MediaItem> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => { reject(new Error('Could not read the selected file.')); };
    reader.readAsDataURL(file);
  });

  const response = await fetch(API_PATHS.ADMIN_MEDIA, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({
      name: file.name,
      mime: file.type,
      data: base64,
      _csrf: getCsrfToken(),
    }),
  });

  const data = (await response.json()) as { item?: MediaItem; message?: string };
  if (!response.ok || !data.item) {
    throw new Error(data.message ?? 'Upload failed.');
  }
  return data.item;
};

export const deleteAdminMediaItem = async (mediaId: string): Promise<MediaItem[]> => {
  const response = await fetch(`${API_PATHS.ADMIN_MEDIA}/${mediaId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(true),
    body: JSON.stringify({ _csrf: getCsrfToken() }),
  });

  if (!response.ok) {
    throw new Error('Could not delete that file.');
  }

  const body = (await response.json()) as { media: MediaItem[] };
  return body.media;
};

export const fetchAdminAudit = async (): Promise<AuditLogEntry[]> => {
  const response = await fetch(API_PATHS.ADMIN_AUDIT, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as { entries: AuditLogEntry[] };
  return body.entries;
};

export const fetchAdminAccount = async (): Promise<{
  email: string;
  updatedAt: string;
  mustRotate: boolean;
}> => {
  const response = await fetch(API_PATHS.ADMIN_CREDENTIALS, {
    credentials: 'include',
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error('Could not load account details.');
  }

  return response.json() as Promise<{ email: string; updatedAt: string; mustRotate: boolean }>;
};

/** Alias used by the admin studio when re-pulling published content. */
export const refreshCmsData = fetchCmsData;
