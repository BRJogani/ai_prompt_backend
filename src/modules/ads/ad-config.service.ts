import { AdType, TargetPlatform } from '@prisma/client';
import { adConfigRepository } from './ad-config.repository';
import { appSettingService } from '@modules/app-config/app-setting.service';
import { ConflictError, NotFoundError } from '@utils/ApiError';
import { recordAuditLog } from '@services/audit.service';
import { AUDIT_ACTIONS } from '@constants/adminActions';

interface AdConfigInput {
  adNetwork?: string;
  adType: AdType;
  platform?: TargetPlatform;
  adUnitId?: string;
  enabled?: boolean;
  frequencyType?: 'EVERY_N_ACTIONS' | 'EVERY_N_MINUTES' | 'ON_SCREEN_OPEN' | 'MANUAL';
  frequencyValue?: number;
  cooldownSeconds?: number;
  maxPerSession?: number;
  showOnHome?: boolean;
  showOnPromptDetail?: boolean;
  showOnCategory?: boolean;
  showOnSearch?: boolean;
  sortOrder?: number;
}

/** Maps the Prisma enum to the camelCase keys the client-facing response uses (Section 24). */
const AD_TYPE_RESPONSE_KEY: Record<AdType, string> = {
  BANNER: 'banner',
  INTERSTITIAL: 'interstitial',
  REWARDED: 'rewarded',
  NATIVE: 'native',
  APP_OPEN: 'appOpen',
};

export const adConfigService = {
  async create(input: AdConfigInput, adminId: string, ipAddress?: string) {
    const platform = input.platform ?? 'ALL';
    const existing = await adConfigRepository.findByTypeAndPlatform(input.adType, platform);
    if (existing) {
      throw new ConflictError(`An ad config for ${input.adType}/${platform} already exists`);
    }

    const config = await adConfigRepository.create({
      adNetwork: input.adNetwork ?? 'ADMOB',
      adType: input.adType,
      platform,
      // Never hard-code production ad unit IDs into the source or seed
      // data (Section 58) — this starts empty until an admin sets it.
      adUnitId: input.adUnitId ?? '',
      enabled: input.enabled ?? false,
      frequencyType: input.frequencyType ?? 'MANUAL',
      frequencyValue: input.frequencyValue ?? 0,
      cooldownSeconds: input.cooldownSeconds ?? 0,
      maxPerSession: input.maxPerSession ?? 0,
      showOnHome: input.showOnHome ?? true,
      showOnPromptDetail: input.showOnPromptDetail ?? true,
      showOnCategory: input.showOnCategory ?? true,
      showOnSearch: input.showOnSearch ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AD_CONFIG,
      entityType: 'AdConfig',
      entityId: config.id,
      metadata: { created: true, adType: input.adType, platform },
      ipAddress,
    });

    return config;
  },

  async update(id: string, input: Partial<AdConfigInput>, adminId: string, ipAddress?: string) {
    const existing = await adConfigRepository.findById(id);
    if (!existing) throw new NotFoundError('Ad config not found');

    const updated = await adConfigRepository.update(id, input);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AD_CONFIG,
      entityType: 'AdConfig',
      entityId: id,
      metadata: input,
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, adminId: string, ipAddress?: string) {
    const existing = await adConfigRepository.findById(id);
    if (!existing) throw new NotFoundError('Ad config not found');

    await adConfigRepository.delete(id);

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AD_CONFIG,
      entityType: 'AdConfig',
      entityId: id,
      metadata: { deleted: true },
      ipAddress,
    });
  },

  async getById(id: string) {
    const config = await adConfigRepository.findById(id);
    if (!config) throw new NotFoundError('Ad config not found');
    return config;
  },

  async list(params: { adType?: AdType; platform?: TargetPlatform; enabled?: boolean }) {
    return adConfigRepository.list(params);
  },

  /** Immediate kill switch (Section 25) — disables every ad config row across every type/platform. */
  async disableAll(adminId: string, ipAddress?: string) {
    const result = await adConfigRepository.disableAll();

    await recordAuditLog({
      adminId,
      action: AUDIT_ACTIONS.UPDATE_AD_CONFIG,
      entityType: 'AdConfig',
      metadata: { disableAll: true, count: result.count },
      ipAddress,
    });

    return result;
  },

  /**
   * Builds the public ad configuration response (Section 24) for a given
   * platform. A platform-specific row (ANDROID/IOS) always wins over the
   * ALL-platform fallback row for the same ad type, regardless of query
   * result order. The master `ads_enabled` feature flag (Phase 7) is
   * AND'd with each row's own `enabled` flag, so either layer — the
   * master switch or a single ad type — can act as a kill switch
   * independently.
   */
  async getPublicConfig(platform: TargetPlatform) {
    const [rows, masterEnabled] = await Promise.all([
      adConfigRepository.findForPlatform(platform),
      appSettingService.getBoolean('ads_enabled', false),
    ]);

    const byType = new Map<AdType, (typeof rows)[number]>();
    for (const row of rows) {
      if (row.platform === 'ALL') byType.set(row.adType, row);
    }
    for (const row of rows) {
      if (row.platform === platform) byType.set(row.adType, row);
    }

    const ads: Record<string, unknown> = {};
    for (const [adType, key] of Object.entries(AD_TYPE_RESPONSE_KEY) as [AdType, string][]) {
      const row = byType.get(adType);
      ads[key] = {
        enabled: masterEnabled && (row?.enabled ?? false),
        adUnitId: row?.adUnitId ?? '',
        frequencyType: row?.frequencyType ?? 'MANUAL',
        frequencyValue: row?.frequencyValue ?? 0,
        cooldownSeconds: row?.cooldownSeconds ?? 0,
        maxPerSession: row?.maxPerSession ?? 0,
        showOnHome: row?.showOnHome ?? false,
        showOnPromptDetail: row?.showOnPromptDetail ?? false,
        showOnCategory: row?.showOnCategory ?? false,
        showOnSearch: row?.showOnSearch ?? false,
      };
    }

    return { ads };
  },
};

export default adConfigService;
