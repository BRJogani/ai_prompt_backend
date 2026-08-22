import { TargetPlatform } from '@prisma/client';
import { appVersionRepository } from './app-version.repository';
import { NotFoundError, ValidationError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';
import { isVersionLessThan } from '@utils/semver';

interface AppVersionInput {
  latestVersion: string;
  minimumVersion: string;
  forceUpdate?: boolean;
  updateMessage?: string;
  storeUrl?: string;
  maintenanceMode?: boolean;
}

export type UpdateRequirement = 'FORCE' | 'OPTIONAL' | 'NONE';

export const appVersionService = {
  async list() {
    return appVersionRepository.listAll();
  },

  async getByPlatform(platform: TargetPlatform) {
    const version = await appVersionRepository.findByPlatform(platform);
    if (!version) throw new NotFoundError(`No version configuration for platform "${platform}"`);
    return version;
  },

  async upsert(platform: TargetPlatform, input: AppVersionInput, adminId: string, ipAddress?: string) {
    if (isVersionLessThan(input.latestVersion, input.minimumVersion)) {
      throw new ValidationError('latestVersion cannot be lower than minimumVersion');
    }

    const version = await appVersionRepository.upsert(platform, input);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_VERSION,
      entityType: 'AppVersion',
      entityId: platform,
      metadata: input,
      ipAddress,
    });

    return version;
  },

  /**
   * Public version check (Section 26). If the client sends its installed
   * version, computes whether an update is required:
   *   below minimumVersion -> FORCE, below latestVersion -> OPTIONAL, else NONE.
   * `forceUpdate` in the response is true if either the admin's manual
   * override or the version comparison says so.
   */
  async check(platform: TargetPlatform, currentVersion?: string) {
    const config = await appVersionRepository.findByPlatform(platform);
    if (!config) throw new NotFoundError(`No version configuration for platform "${platform}"`);

    let updateRequired: UpdateRequirement = 'NONE';
    if (currentVersion) {
      if (isVersionLessThan(currentVersion, config.minimumVersion)) {
        updateRequired = 'FORCE';
      } else if (isVersionLessThan(currentVersion, config.latestVersion)) {
        updateRequired = 'OPTIONAL';
      }
    }

    return {
      platform: config.platform,
      latestVersion: config.latestVersion,
      minimumVersion: config.minimumVersion,
      forceUpdate: config.forceUpdate || updateRequired === 'FORCE',
      updateMessage: config.updateMessage,
      storeUrl: config.storeUrl,
      maintenanceMode: config.maintenanceMode,
      updateRequired,
    };
  },
};

export default appVersionService;
