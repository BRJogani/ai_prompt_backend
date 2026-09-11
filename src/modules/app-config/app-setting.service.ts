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
    const autoCreatedKeys = ['shuffle_enabled', 'daily_shuffle_enabled', 'shuffle_interval', 'daily_shuffle_salt', 'top_pinned_prompt_ids'];
    if (!existing && !autoCreatedKeys.includes(key)) {
      throw new NotFoundError(`Setting "${key}" not found`);
    }
    const updated = await appSettingRepository.upsert(key, {
      value,
      valueType: existing?.valueType ?? (value === 'true' || value === 'false' ? 'boolean' : 'string'),
      description: existing?.description ?? (key === 'daily_shuffle_enabled' ? 'Master toggle for daily synchronized prompt shuffling across all devices.' : key === 'daily_shuffle_salt' ? 'Dynamic seed salt for daily prompt shuffling.' : undefined),
    });

    if (key.includes('shuffle') || key.includes('top_pinned')) {
      try {
        const { clearDailyShuffleCache } = await import('@modules/prompts/daily-shuffle.service');
        clearDailyShuffleCache();
      } catch {
        // ignore if not loaded yet
      }
    }

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_APP_CONFIG,
      entityType: 'AppSetting',
      entityId: key,
      metadata: { value, created: !existing },
      ipAddress,
    });

    return updated;
  },

  async reshuffleDaily(adminId: string, ipAddress?: string) {
    const salt = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    return this.update('daily_shuffle_salt', salt, adminId, ipAddress);
  },

  /** Reads the complete feed shuffle configuration. */
  async getShuffleConfig(): Promise<{ enabled: boolean; interval: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; salt: string }> {
    const [enabledSetting, intervalSetting, saltSetting] = await Promise.all([
      appSettingRepository.findByKey('shuffle_enabled').then(s => s ?? appSettingRepository.findByKey('daily_shuffle_enabled')),
      appSettingRepository.findByKey('shuffle_interval'),
      appSettingRepository.findByKey('daily_shuffle_salt'),
    ]);

    const enabled = enabledSetting ? toBoolean(enabledSetting.value) : true;
    let interval: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY';
    if (intervalSetting && ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(intervalSetting.value.toUpperCase())) {
      interval = intervalSetting.value.toUpperCase() as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    }
    const salt = saltSetting?.value || '';

    return { enabled, interval, salt };
  },

  /** Retrieves the ordered list of prompt IDs pinned to the top of the feed. */
  async getTopPinnedPromptIds(): Promise<string[]> {
    const setting = await appSettingRepository.findByKey('top_pinned_prompt_ids');
    if (!setting || !setting.value) return [];
    try {
      const parsed = JSON.parse(setting.value);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  },

  /** Saves an explicit ordered list of top pinned prompt IDs. */
  async setTopPinnedPromptIds(ids: string[], adminId: string, ipAddress?: string): Promise<string[]> {
    const cleanedIds = Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0)));
    await this.update('top_pinned_prompt_ids', JSON.stringify(cleanedIds), adminId, ipAddress);
    return cleanedIds;
  },

  /** Toggles a prompt ID into or out of the top pinned list. */
  async toggleTopPinnedPrompt(promptId: string, adminId: string, ipAddress?: string): Promise<{ pinned: boolean; pinnedIds: string[] }> {
    const current = await this.getTopPinnedPromptIds();
    let updated: string[];
    let pinned: boolean;
    if (current.includes(promptId)) {
      updated = current.filter((id) => id !== promptId);
      pinned = false;
    } else {
      updated = [promptId, ...current];
      pinned = true;
    }
    await this.setTopPinnedPromptIds(updated, adminId, ipAddress);
    return { pinned, pinnedIds: updated };
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

    const isShuffleEnabled = map.has('shuffle_enabled')
      ? toBoolean(map.get('shuffle_enabled')!)
      : getBool('daily_shuffle_enabled', true);
    const shuffleInterval = map.get('shuffle_interval') ?? 'DAILY';

    return {
      appName: get('app_name', 'AI Prompt Inspiration'),
      supportEmail: get('support_email'),
      privacyPolicyUrl: get('privacy_policy_url'),
      termsUrl: get('terms_url'),
      aboutText: get('about_text'),
      featureFlags: {
        shuffleEnabled: isShuffleEnabled,
        shuffleInterval,
        dailyShuffleEnabled: isShuffleEnabled,
        videoEnabled: getBool('video_enabled', true),
        searchEnabled: getBool('search_enabled', true),
        historyEnabled: getBool('history_enabled', true),
        favoritesEnabled: getBool('favorites_enabled', true),
        sharingEnabled: getBool('sharing_enabled', true),
        trendingEnabled: getBool('trending_enabled', true),
        notificationsEnabled: getBool('notifications_enabled', false),
        adsEnabled: getBool('ads_enabled', false),
      },
      shuffle: {
        enabled: isShuffleEnabled,
        interval: shuffleInterval,
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
