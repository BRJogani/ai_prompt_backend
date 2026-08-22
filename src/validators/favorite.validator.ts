import { z } from 'zod';
import { idSchema } from './common.validator';

export const addFavoriteSchema = z.object({
  promptId: idSchema,
});
export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
