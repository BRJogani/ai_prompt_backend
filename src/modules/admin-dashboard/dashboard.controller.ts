import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { dashboardService } from './dashboard.service';
import {
  DashboardOverviewQuery,
  TopPromptsQuery,
  TopCategoriesQuery,
  EventsTimeseriesQuery,
  DauTimeseriesQuery,
  EngagementStatsQuery,
} from '@validators/dashboard.validator';

export const dashboardController = {
  overview: catchAsync(async (req: Request, res: Response) => {
    const { range, from, to } = req.query as unknown as DashboardOverviewQuery;
    const data = await dashboardService.getOverview(range || 'today', from, to);
    return sendSuccess(res, data, 'Dashboard overview');
  }),

  topPrompts: catchAsync(async (req: Request, res: Response) => {
    const { metric, limit, range, from, to } = req.query as unknown as TopPromptsQuery;
    const data = await dashboardService.getTopPrompts(metric, limit, range || 'today', from, to);
    return sendSuccess(res, data, 'Top prompts');
  }),

  topCategories: catchAsync(async (req: Request, res: Response) => {
    const { limit, range, from, to } = req.query as unknown as TopCategoriesQuery;
    const data = await dashboardService.getTopCategories(limit, range || 'today', from, to);
    return sendSuccess(res, data, 'Top categories');
  }),

  eventsTimeseries: catchAsync(async (req: Request, res: Response) => {
    const { eventType, range, from, to } = req.query as unknown as EventsTimeseriesQuery;
    const data = await dashboardService.getEventsTimeseries(eventType, range || 'today', from, to);
    return sendSuccess(res, data, 'Events timeseries');
  }),

  dauTimeseries: catchAsync(async (req: Request, res: Response) => {
    const { range, from, to } = req.query as unknown as DauTimeseriesQuery;
    const data = await dashboardService.getDauTimeseries(range || 'today', from, to);
    return sendSuccess(res, data, 'DAU timeseries');
  }),

  engagementStats: catchAsync(async (req: Request, res: Response) => {
    const { range, from, to } = req.query as unknown as EngagementStatsQuery;
    const data = await dashboardService.getEngagementAnalytics(range || 'today', from, to);
    return sendSuccess(res, data, 'Engagement and exploration analytics');
  }),
};

export default dashboardController;
