import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
} from '../config/constants';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const PUBLIC_PREFIX = '/uploads';

/** Magic-byte signatures accepted for upload (SVG is deliberately excluded). */
const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

export const ensureUploadDir = (): void => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

export const sanitizeFileName = (raw: string): string => {
  const base = path.basename(raw).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 80) || 'upload';
};

export interface StoredUpload {
  url: string;
  name: string;
  mime: string;
  size: number;
}

export type UploadResult =
  | { ok: true; upload: StoredUpload }
  | { ok: false; reason: string };

/**
 * Validates and writes a base64 image payload.
 * The declared mime is never trusted: the file signature is sniffed first and
 * the stored extension is derived from that sniff, which prevents an attacker
 * from uploading active content (SVG/HTML) behind an image content-type.
 */
export const storeUpload = (
  declaredMime: string,
  base64Data: string,
  originalName: string
): UploadResult => {
  if (!ALLOWED_IMAGE_MIMES.includes(declaredMime as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    return { ok: false, reason: 'Unsupported file type. Upload PNG, JPG or WEBP images.' };
  }

  const dataUrlMatch = /^data:[^;,]+;base64,(.*)$/s.exec(base64Data);
  const rawBase64 = dataUrlMatch ? dataUrlMatch[1] : base64Data;

  const buffer = Buffer.from(rawBase64 ?? '', 'base64');
  if (buffer.length === 0) {
    return { ok: false, reason: 'The uploaded file appears to be empty.' };
  }

  // base64 expands by ~4/3, so reject inflated payloads before decoding cost.
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` };
  }

  const signature = SIGNATURES.find((entry) => entry.test(buffer));
  if (!signature) {
    return { ok: false, reason: 'File contents do not match a supported image format.' };
  }

  if (signature.mime !== declaredMime) {
    return { ok: false, reason: 'Declared file type does not match the file contents.' };
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(signature.ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return { ok: false, reason: 'Unsupported file extension.' };
  }

  ensureUploadDir();

  const randomName = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
  const safeOriginal = sanitizeFileName(originalName).replace(/\.[^.]+$/, '');
  const fileName = `${safeOriginal.slice(0, 40)}-${randomName}.${signature.ext}`;
  const target = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(target, buffer);

  return {
    ok: true,
    upload: {
      url: `${PUBLIC_PREFIX}/${fileName}`,
      name: fileName,
      mime: signature.mime,
      size: buffer.length,
    },
  };
};

export const deleteUploadByUrl = (url: string): boolean => {
  if (!url.startsWith(`${PUBLIC_PREFIX}/`)) {
    return false;
  }
  const fileName = path.basename(url);
  if (fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  const target = path.join(UPLOAD_DIR, fileName);
  if (!target.startsWith(UPLOAD_DIR) || !fs.existsSync(target)) {
    return false;
  }
  fs.unlinkSync(target);
  return true;
};
