import { z } from 'zod';
import { idSchema, paginationQuerySchema } from './common.validator';

const contentTypeEnum = z.enum(['IMAGE', 'VIDEO', 'BOTH']);
const promptStatusEnum = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']);

export const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  description: z.string().max(500).optional(),
  promptText: z.string().min(1, 'promptText is required'),
  categoryId: idSchema,
  aiToolId: idSchema.optional(),
  contentType: contentTypeEnum.default('IMAGE'),
  status: promptStatusEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  /** Tag names or slugs — resolved to Tag rows, creating any that don't exist yet. */
  tagSlugs: z.array(z.string().min(1)).max(20).optional(),
});
export type CreatePromptInput = z.infer<typeof createPromptSchema>;

export const updatePromptSchema = createPromptSchema.partial();
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

export const promptFlagsSchema = z
  .object({
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
  })
  .refine((data) => data.isFeatured !== undefined || data.isTrending !== undefined, {
    message: 'At least one of isFeatured or isTrending must be provided',
  });
export type PromptFlagsInput = z.infer<typeof promptFlagsSchema>;

export const attachTagsSchema = z.object({
  tagSlugs: z.array(z.string().min(1)).min(1).max(20),
});
export type AttachTagsInput = z.infer<typeof attachTagsSchema>;

/** Route has both :id (prompt) and :tagId params — a plain idParamSchema('id') would strip tagId. */
export const promptTagParamsSchema = z.object({
  id: idSchema,
  tagId: idSchema,
});

export const promptListQuerySchema = paginationQuerySchema.extend({
  status: promptStatusEnum.optional(),
  categoryId: idSchema.optional(),
  aiToolId: idSchema.optional(),
  contentType: contentTypeEnum.optional(),
  isFeatured: z.coerce.boolean().optional(),
  isTrending: z.coerce.boolean().optional(),
  search: z.string().min(1).max(120).optional(),
});
export type PromptListQuery = z.infer<typeof promptListQuerySchema>;

// ---------------------------------------------------------------------
// Public browsing / search (Sections 14, 29, 31)
// ---------------------------------------------------------------------
const sortEnum = z.enum(['latest', 'trending', 'popular', 'most_viewed', 'most_favorited', 'most_copied']);

export const publicPromptListQuerySchema = paginationQuerySchema.extend({
  categoryId: idSchema.optional(),
  aiToolId: idSchema.optional(),
  contentType: contentTypeEnum.optional(),
  sort: sortEnum.default('latest'),
});
export type PublicPromptListQuery = z.infer<typeof publicPromptListQuerySchema>;

export const promptSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1, 'q is required').max(200),
});
export type PromptSearchQuery = z.infer<typeof promptSearchQuerySchema>;
