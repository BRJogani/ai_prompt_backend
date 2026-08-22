import { z } from 'zod';

const adTypeEnum = z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED', 'NATIVE', 'APP_OPEN']);
const platformEnum = z.enum(['ANDROID', 'IOS', 'ALL']);
const frequencyTypeEnum = z.enum(['EVERY_N_ACTIONS', 'EVERY_N_MINUTES', 'ON_SCREEN_OPEN', 'MANUAL']);

export const createAdConfigSchema = z.object({
  /** Kept as a plain string (default "ADMOB") so new ad networks don't require a migration — see schema.prisma. */
  adNetwork: z.string().min(1).max(50).optional(),
  adType: adTypeEnum,
  platform: platformEnum.default('ALL'),
  adUnitId: z.string().max(200).optional(),
  enabled: z.boolean().optional(),
  frequencyType: frequencyTypeEnum.optional(),
  frequencyValue: z.number().int().min(0).optional(),
  cooldownSeconds: z.number().int().min(0).optional(),
  maxPerSession: z.number().int().min(0).optional(),
  showOnHome: z.boolean().optional(),
  showOnPromptDetail: z.boolean().optional(),
  showOnCategory: z.boolean().optional(),
  showOnSearch: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type CreateAdConfigInput = z.infer<typeof createAdConfigSchema>;

// adType/platform together form this row's identity (the unique constraint).
// Changing them would effectively make it a different config slot, so
// updates can't touch them — create a new row (or delete + recreate) instead.
export const updateAdConfigSchema = createAdConfigSchema.partial().omit({ adType: true, platform: true });
export type UpdateAdConfigInput = z.infer<typeof updateAdConfigSchema>;

export const adConfigListQuerySchema = z.object({
  adType: adTypeEnum.optional(),
  platform: platformEnum.optional(),
  enabled: z.coerce.boolean().optional(),
});
export type AdConfigListQuery = z.infer<typeof adConfigListQuerySchema>;

export const publicAdConfigQuerySchema = z.object({
  platform: z.enum(['ANDROID', 'IOS']),
});
export type PublicAdConfigQuery = z.infer<typeof publicAdConfigQuerySchema>;
