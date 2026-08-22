import { z } from 'zod';
import { idSchema } from './common.validator';

export const reorderMediaSchema = z.object({
  order: z
    .array(
      z.object({
        id: idSchema,
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});
export type ReorderMediaInput = z.infer<typeof reorderMediaSchema>;
