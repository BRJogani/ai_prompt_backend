import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = createTagSchema.partial();
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

export const tagListQuerySchema = paginationQuerySchema.extend({
  search: z.string().min(1).max(60).optional(),
});
export type TagListQuery = z.infer<typeof tagListQuerySchema>;
