import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  const allowed = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES];
  if (allowed.includes(file.mimetype)) {
    callback(null, true);
    return;
  }
  // Multer forwards this to Express's error handling automatically.
  callback(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`));
}

/**
 * Single-file upload middleware, field name "file". Buffers the file in
 * memory (never touches disk) so it can be streamed straight to Cloudinary.
 * The size limit here is the upper bound across both media types — the
 * tighter per-type limits (10MB image / 100MB video) are enforced in the
 * media service, since multer can't apply different limits per mimetype.
 */
export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
}).single('file');

export default uploadMedia;
