import { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '@config/cloudinary';
import { CloudinaryError } from '@utils/ApiError';
import { logger } from '@config/logger';

/** Top-level Cloudinary folders, per the recommended structure in Section 8. */
export type CloudinaryFolder = 'categories' | 'prompts' | 'ai-tools' | 'banners';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  duration?: number;
  format: string;
}

function assertConfigured(): void {
  if (!isCloudinaryConfigured) {
    throw new CloudinaryError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }
}

function buildFolderPath(folder: CloudinaryFolder, resourceId?: string): string {
  const base = 'ai-prompt-app';
  return resourceId ? `${base}/${folder}/${resourceId}` : `${base}/${folder}`;
}

function uploadBuffer(buffer: Buffer, folder: string, resourceType: 'image' | 'video'): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary returned no result'));
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export const cloudinaryService = {
  /** Uploads an image and returns its secure URL plus an auto-generated thumbnail. */
  async uploadImage(buffer: Buffer, folder: CloudinaryFolder, resourceId?: string): Promise<CloudinaryUploadResult> {
    assertConfigured();
    try {
      const result = await uploadBuffer(buffer, buildFolderPath(folder, resourceId), 'image');
      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        thumbnailUrl: cloudinary.url(result.public_id, {
          secure: true,
          transformation: [{ width: 400, height: 400, crop: 'thumb', gravity: 'auto' }],
        }),
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (err) {
      logger.error({ err }, 'Cloudinary image upload failed');
      throw new CloudinaryError('Failed to upload image to Cloudinary');
    }
  },

  /** Uploads a video and returns its secure URL plus a JPEG thumbnail generated from the first frame. */
  async uploadVideo(buffer: Buffer, folder: CloudinaryFolder, resourceId?: string): Promise<CloudinaryUploadResult> {
    assertConfigured();
    try {
      const result = await uploadBuffer(buffer, buildFolderPath(folder, resourceId), 'video');
      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        thumbnailUrl: cloudinary.url(result.public_id, {
          resource_type: 'video',
          secure: true,
          format: 'jpg',
          transformation: [{ width: 400, height: 400, crop: 'thumb', gravity: 'auto' }, { start_offset: '0' }],
        }),
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
      };
    } catch (err) {
      logger.error({ err }, 'Cloudinary video upload failed');
      throw new CloudinaryError('Failed to upload video to Cloudinary');
    }
  },

  /** Permanently deletes an asset. Safe to call even if the asset was already removed. */
  async deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    assertConfigured();
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      logger.error({ err, publicId }, 'Cloudinary asset deletion failed');
      throw new CloudinaryError('Failed to delete media asset from Cloudinary');
    }
  },

  /** Returns a delivery URL with automatic format/quality negotiation (Section 8: "optimized URLs"). */
  getOptimizedUrl(publicId: string, resourceType: 'image' | 'video' = 'image'): string {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      fetch_format: 'auto',
      quality: 'auto',
    });
  },
};

export default cloudinaryService;
