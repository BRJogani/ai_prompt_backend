import { z } from 'zod';
import { idSchema } from './common.validator';

export const addHistorySchema = z.object({
  promptId: idSchema,
});
export type AddHistoryInput = z.infer<typeof addHistorySchema>;

export const clearHistoryQuerySchema = z.object({
  /** Optional — clears a single entry instead of the whole history when provided. */
  promptId: idSchema.optional(),
});
export type ClearHistoryQuery = z.infer<typeof clearHistoryQuerySchema>;
