import { mediaRepository } from './media.repository';
import { promptRepository } from '@modules/prompts/prompt.repository';
import { cloudinaryService } from '@services/cloudinary.service';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '@middleware/upload';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

/** Classifies an uploaded file and enforces the per-type size limit from Section 45. */
function classifyAndValidate(file: Express.Multer.File): 'IMAGE' | 'VIDEO' {
  const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype);
  const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype);

  if (!isImage && !isVideo) {
    throw new ValidationError(`Unsupported file type: ${file.mimetype}`);
  }
  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError(`Image exceeds the ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB size limit`);
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new ValidationError(`Video exceeds the ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB size limit`);
  }

  return isImage ? 'IMAGE' : 'VIDEO';
}

export const mediaService = {
  async uploadForPrompt(promptId: string, file: Express.Multer.File, adminId: string, ipAddress?: string) {
    const prompt = await promptRepository.findById(promptId);
    if (!prompt) throw new NotFoundError('Prompt not found');

    const mediaType = classifyAndValidate(file);
    const uploadResult =
      mediaType === 'IMAGE'
        ? await cloudinaryService.uploadImage(file.buffer, 'prompts', promptId)
        : await cloudinaryService.uploadVideo(file.buffer, 'prompts', promptId);

    const sortOrder = await mediaRepository.count(promptId);

    const media = await mediaRepository.create({
      promptId,
      mediaType,
      cloudinaryPublicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
      format: uploadResult.format,
      sortOrder,
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPLOAD_MEDIA,
      entityType: 'PromptMedia',
      entityId: media.id,
      metadata: { promptId, mediaType },
      ipAddress,
    });

    return media;
  },

  async replace(mediaId: string, file: Express.Multer.File, adminId: string, ipAddress?: string) {
    const existing = await mediaRepository.findById(mediaId);
    if (!existing) throw new NotFoundError('Media not found');

    const mediaType = classifyAndValidate(file);
    const uploadResult =
      mediaType === 'IMAGE'
        ? await cloudinaryService.uploadImage(file.buffer, 'prompts', existing.promptId)
        : await cloudinaryService.uploadVideo(file.buffer, 'prompts', existing.promptId);

    // Delete the old asset only after the new one succeeds, so a failed
    // upload never leaves the prompt without any media at all.
    await cloudinaryService.deleteAsset(existing.cloudinaryPublicId, existing.mediaType === 'VIDEO' ? 'video' : 'image');

    const updated = await mediaRepository.update(mediaId, {
      mediaType,
      cloudinaryPublicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
      format: uploadResult.format,
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.REPLACE_MEDIA,
      entityType: 'PromptMedia',
      entityId: mediaId,
      ipAddress,
    });

    return updated;
  },

  async remove(mediaId: string, adminId: string, ipAddress?: string) {
    const existing = await mediaRepository.findById(mediaId);
    if (!existing) throw new NotFoundError('Media not found');

    await cloudinaryService.deleteAsset(existing.cloudinaryPublicId, existing.mediaType === 'VIDEO' ? 'video' : 'image');
    await mediaRepository.delete(mediaId);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.DELETE_MEDIA,
      entityType: 'PromptMedia',
      entityId: mediaId,
      metadata: { promptId: existing.promptId },
      ipAddress,
    });
  },

  async reorder(promptId: string, order: Array<{ id: string; sortOrder: number }>, adminId: string, ipAddress?: string) {
    await Promise.all(order.map((item) => mediaRepository.updateSortOrder(item.id, item.sortOrder)));

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.REORDER_MEDIA,
      entityType: 'PromptMedia',
      entityId: promptId,
      metadata: { order },
      ipAddress,
    });

    return mediaRepository.findByPrompt(promptId);
  },

  async listForPrompt(promptId: string) {
    return mediaRepository.findByPrompt(promptId);
  },
};

export default mediaService;
