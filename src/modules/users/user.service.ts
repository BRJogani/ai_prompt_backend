import { DevicePlatform } from '@prisma/client';
import { userRepository } from './user.repository';

interface DeviceMetadata {
  platform?: DevicePlatform;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  language?: string;
}

export const userService = {
  /**
   * Finds the User row for this device UUID, or creates one on first
   * sight (Section 4 — no registration/login, just a client-generated
   * UUID). Every call also refreshes `lastActiveAt` and backfills any
   * newly-provided metadata, without collecting anything beyond what's
   * already in the User model (no PII).
   */
  async resolveOrCreate(uniqueId: string, metadata: DeviceMetadata) {
    const existing = await userRepository.findByUniqueId(uniqueId);

    if (existing) {
      return userRepository.touch(existing.id, {
        lastActiveAt: new Date(),
        ...(metadata.appVersion ? { appVersion: metadata.appVersion } : {}),
        ...(metadata.deviceModel ? { deviceModel: metadata.deviceModel } : {}),
        ...(metadata.osVersion ? { osVersion: metadata.osVersion } : {}),
        ...(metadata.language ? { language: metadata.language } : {}),
      });
    }

    return userRepository.create({
      uniqueId,
      platform: metadata.platform ?? 'OTHER',
      appVersion: metadata.appVersion,
      deviceModel: metadata.deviceModel,
      osVersion: metadata.osVersion,
      language: metadata.language,
    });
  },
};

export default userService;
