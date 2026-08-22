import { z } from 'zod';
import { paginationQuerySchema, idSchema } from './common.validator';

const reasonEnum = z.enum(['INAPPROPRIATE', 'BROKEN_CONTENT', 'WRONG_CATEGORY', 'COPYRIGHT', 'OTHER']);
const statusEnum = z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']);

export const createReportSchema = z.object({
  promptId: idSchema,
  reason: reasonEnum,
  description: z.string().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportStatusSchema = z.object({
  status: statusEnum,
});
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;

export const reportListQuerySchema = paginationQuerySchema.extend({
  status: statusEnum.optional(),
});
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
