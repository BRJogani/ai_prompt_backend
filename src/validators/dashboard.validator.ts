import { z } from 'zod';

export const topPromptsQuerySchema = z.object({
  metric: z.enum(['viewCount', 'copyCount', 'favoriteCount']).default('viewCount'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TopPromptsQuery = z.infer<typeof topPromptsQuerySchema>;

export const topCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TopCategoriesQuery = z.infer<typeof topCategoriesQuerySchema>;

const rangeEnum = z.enum(['today', 'yesterday', '7d', '30d']);
const analyticsEventTypeEnum = z.enum([
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

export const eventsTimeseriesQuerySchema = z.object({
  eventType: analyticsEventTypeEnum.optional(),
  range: rangeEnum.default('30d'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type EventsTimeseriesQuery = z.infer<typeof eventsTimeseriesQuerySchema>;
