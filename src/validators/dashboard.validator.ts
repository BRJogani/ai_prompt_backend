import { z } from 'zod';

export const dashboardRangeEnum = z.enum([
  'today',
  'yesterday',
  '7d',
  '30d',
  'this_month',
  'last_month',
  'all_time',
  'custom',
]);
export type DashboardRange = z.infer<typeof dashboardRangeEnum>;

export const dashboardOverviewQuerySchema = z.object({
  range: dashboardRangeEnum.default('today').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type DashboardOverviewQuery = z.infer<typeof dashboardOverviewQuerySchema>;

export const topPromptsQuerySchema = z.object({
  metric: z.enum(['viewCount', 'copyCount', 'favoriteCount', 'shareCount', 'trendingScore']).default('viewCount'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  range: dashboardRangeEnum.default('today').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type TopPromptsQuery = z.infer<typeof topPromptsQuerySchema>;

export const topCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  range: dashboardRangeEnum.default('today').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type TopCategoriesQuery = z.infer<typeof topCategoriesQuerySchema>;

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
  range: dashboardRangeEnum.default('today'),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type EventsTimeseriesQuery = z.infer<typeof eventsTimeseriesQuerySchema>;

export const dauTimeseriesQuerySchema = z.object({
  range: dashboardRangeEnum.default('today'),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type DauTimeseriesQuery = z.infer<typeof dauTimeseriesQuerySchema>;

export const engagementStatsQuerySchema = z.object({
  range: dashboardRangeEnum.default('today').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type EngagementStatsQuery = z.infer<typeof engagementStatsQuerySchema>;
