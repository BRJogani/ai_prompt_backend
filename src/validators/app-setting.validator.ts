import { z } from 'zod';

export const appSettingKeyParamSchema = z.object({
  key: z.string().min(1).max(100),
});

export const updateAppSettingSchema = z.object({
  value: z.string().max(2000),
});
export type UpdateAppSettingInput = z.infer<typeof updateAppSettingSchema>;

export const createAppSettingSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase snake_case (letters, digits, underscores)'),
  value: z.string().max(2000),
  valueType: z.enum(['boolean', 'string', 'json', 'number']).optional(),
  description: z.string().max(500).optional(),
});
export type CreateAppSettingInput = z.infer<typeof createAppSettingSchema>;
