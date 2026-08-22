import { z } from 'zod';

const platformEnum = z.enum(['ANDROID', 'IOS', 'ALL']);
const versionString = z.string().regex(/^\d+(\.\d+){0,2}$/, 'Expected a version like "1.2.3"');

export const appVersionPlatformParamSchema = z.object({
  platform: platformEnum,
});

export const upsertAppVersionSchema = z.object({
  latestVersion: versionString,
  minimumVersion: versionString,
  forceUpdate: z.boolean().optional(),
  updateMessage: z.string().max(500).optional(),
  storeUrl: z.string().url().optional(),
  maintenanceMode: z.boolean().optional(),
});
export type UpsertAppVersionInput = z.infer<typeof upsertAppVersionSchema>;

export const checkVersionQuerySchema = z.object({
  platform: platformEnum,
  currentVersion: versionString.optional(),
});
export type CheckVersionQuery = z.infer<typeof checkVersionQuerySchema>;
