import { z } from 'zod';

/**
 * Standard `?page=&limit=` query validation (Section 30). Coerces string
 * query params to numbers and applies sane defaults/bounds so every list
 * endpoint behaves consistently.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idSchema = z.string().min(1, 'ID must not be empty');

/** Builds a `{ [paramName]: id }` params schema, e.g. idParamSchema('promptId'). */
export function idParamSchema(paramName = 'id') {
  return z.object({ [paramName]: z.string().min(1, `${paramName} must not be empty`) });
}
