import { z } from 'zod';
import { paginationQuerySchema, idSchema } from './common.validator';

export const auditLogListQuerySchema = paginationQuerySchema.extend({
  action: z.string().min(1).max(100).optional(),
  entityType: z.string().min(1).max(100).optional(),
  adminId: idSchema.optional(),
});
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
