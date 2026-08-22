import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

const contentTypeEnum = z.enum(['IMAGE', 'VIDEO', 'BOTH']);

export const createAiToolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  description: z.string().max(1000).optional(),
  iconUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  contentTypes: z.array(contentTypeEnum).min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type CreateAiToolInput = z.infer<typeof createAiToolSchema>;

export const updateAiToolSchema = createAiToolSchema.partial();
export type UpdateAiToolInput = z.infer<typeof updateAiToolSchema>;

export const aiToolStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
export type AiToolStatusInput = z.infer<typeof aiToolStatusSchema>;

export const aiToolListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type AiToolListQuery = z.infer<typeof aiToolListQuerySchema>;
