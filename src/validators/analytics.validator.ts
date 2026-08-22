import { z } from 'zod';
import { idSchema } from './common.validator';

const eventTypeEnum = z.enum([
  'APP_OPEN',
  'PROMPT_VIEW',
  'PROMPT_COPY',
  'PROMPT_FAVORITE',
  'PROMPT_UNFAVORITE',
  'PROMPT_SHARE',
  'VIDEO_VIEW',
  'IMAGE_VIEW',
  'CATEGORY_VIEW',
  'SEARCH',
  'AI_TOOL_CLICK',
]);

export const trackEventSchema = z.object({
  eventType: eventTypeEnum,
  promptId: idSchema.optional(),
  categoryId: idSchema.optional(),
  aiToolId: idSchema.optional(),
  /** Free-form payload — e.g. the search query text, or a share destination. */
  metadata: z.record(z.unknown()).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;
