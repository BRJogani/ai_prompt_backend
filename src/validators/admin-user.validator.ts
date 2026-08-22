import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

const adminRoleEnum = z.enum(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'ANALYTICS']);

export const adminUserListQuerySchema = paginationQuerySchema.extend({
  role: adminRoleEnum.optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const updateAdminUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: adminRoleEnum.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
