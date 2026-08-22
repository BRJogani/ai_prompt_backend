import { appSettingRepository } from './app-setting.repository';
import { NotFoundError, ConflictError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

function toBoolean(value: string): boolean {
  return value === 'true' || value === '1';
}

export const appSettingService = {
  async list() {
    return appSettingRepository.listAll();
  },

  async getByKey(key: string) {
    const setting = await appSettingRepository.findByKey(key);
    if (!setting) throw new NotFoundError(`Setting "${key}" not found`);
    return setting;
  },

  async create(
    input: { key: string; value: string; valueType?: string; description?: string },
    adminId: string,
    ipAddress?: string,
  ) {
    const existing = await appSettingRepository.findByKey(input.key);
    if (existing) throw new ConflictError(`Setting "${input.key}" already exists`);

    const setting = await appSettingRepository.upsert(input.key, input);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_APP_CONFIG,
      entityType: 'AppSetting',
      entityId: input.key,
      metadata: { created: true, value: input.value },
      ipAddress,
    });

    return setting;
  },

  async update(key: string, value: string, adminId: string, ipAddress?: string) {
    const existing = await appSettingRepository.findByKey(key);
    if (!existing) throw new NotFoundError(`Setting "${key}" not found`);

    const updated = await appSettingRepository.upsert(key, { value });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_APP_CONFIG,
      entityType: 'AppSetting',
      entityId: key,
      metadata: { value },
      ipAddress,
    });

    return updated;
  },

  /** Cheap single-flag reader — used by the video-visibility gate, which only needs one key. */
  async getBoolean(key: string, fallback = false): Promise<boolean> {
    const setting = await appSettingRepository.findByKey(key);
    if (!setting) return fallback;
    return toBoolean(setting.value);
  },

  /**
   * Builds the combined public config response (Section 59: video
   * settings, feature flags, and general app settings in one call) from a
   * single query rather than one round-trip per key.
   */
  async getPublicConfig() {
    const settings = await appSettingRepository.listAll();
    const map = new Map(settings.map((s) => [s.key, s.value]));
    const get = (key: string, fallback = ''): string => map.get(key) ?? fallback;
    const getBool = (key: string, fallback = false): boolean => (map.has(key) ? toBoolean(map.get(key)!) : fallback);

    return {
      appName: get('app_name', 'AI Prompt Inspiration'),
      supportEmail: get('support_email'),
      privacyPolicyUrl: get('privacy_policy_url'),
      termsUrl: get('terms_url'),
      aboutText: get('about_text'),
      featureFlags: {
        videoEnabled: getBool('video_enabled', true),
        searchEnabled: getBool('search_enabled', true),
        historyEnabled: getBool('history_enabled', true),
        favoritesEnabled: getBool('favorites_enabled', true),
        sharingEnabled: getBool('sharing_enabled', true),
        trendingEnabled: getBool('trending_enabled', true),
        notificationsEnabled: getBool('notifications_enabled', false),
        adsEnabled: getBool('ads_enabled', false),
      },
      video: {
        globalEnabled: getBool('video_enabled', true),
      },
      maintenance: {
        enabled: getBool('maintenance_mode', false),
        message: get('maintenance_message', 'We are currently updating the application.'),
      },
      // Full per-ad-type configuration (Section 24) ships in Phase 8 — this
      // reflects only the master kill switch until the AdConfig table exists.
      ads: {
        enabled: getBool('ads_enabled', false),
      },
    };
  },
};

export default appSettingService;
