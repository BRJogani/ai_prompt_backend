import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  iconUrl: z.string().url().optional().or(z.literal('')).nullable(),
  coverImageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
export type CategoryStatusInput = z.infer<typeof categoryStatusSchema>;

export const categoryListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  isFeatured: z.coerce.boolean().optional(),
});
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
