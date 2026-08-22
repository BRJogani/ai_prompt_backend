import { z } from 'zod';
import { idSchema } from './common.validator';

const sectionTypeEnum = z.enum(['TRENDING', 'LATEST', 'POPULAR', 'POPULAR_VIDEO', 'POPULAR_IMAGE', 'CATEGORY', 'FEATURED']);

export const createHomeSectionSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(120),
    sectionType: sectionTypeEnum,
    categoryId: idSchema.optional(),
    itemLimit: z.number().int().min(1).max(50).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => data.sectionType !== 'CATEGORY' || !!data.categoryId, {
    message: 'categoryId is required when sectionType is CATEGORY',
    path: ['categoryId'],
  });
export type CreateHomeSectionInput = z.infer<typeof createHomeSectionSchema>;

// A separate (non-refined) schema for updates — .refine() schemas can't be
// derived with .partial(), and update requests shouldn't require every field.
export const updateHomeSectionSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  sectionType: sectionTypeEnum.optional(),
  categoryId: idSchema.optional(),
  itemLimit: z.number().int().min(1).max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdateHomeSectionInput = z.infer<typeof updateHomeSectionSchema>;

export const homeSectionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
export type HomeSectionStatusInput = z.infer<typeof homeSectionStatusSchema>;
