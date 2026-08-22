import { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { sendSuccess } from '@utils/ApiResponse';
import { dashboardService } from './dashboard.service';
import { TopPromptsQuery, TopCategoriesQuery, EventsTimeseriesQuery } from '@validators/dashboard.validator';

export const dashboardController = {
  overview: catchAsync(async (_req: Request, res: Response) => {
    const data = await dashboardService.getOverview();
    return sendSuccess(res, data, 'Dashboard overview');
  }),

  topPrompts: catchAsync(async (req: Request, res: Response) => {
    const { metric, limit } = req.query as unknown as TopPromptsQuery;
    const data = await dashboardService.getTopPrompts(metric, limit);
    return sendSuccess(res, data, 'Top prompts');
  }),

  topCategories: catchAsync(async (req: Request, res: Response) => {
    const { limit } = req.query as unknown as TopCategoriesQuery;
    const data = await dashboardService.getTopCategories(limit);
    return sendSuccess(res, data, 'Top categories');
  }),

  eventsTimeseries: catchAsync(async (req: Request, res: Response) => {
    const { eventType, range, from, to } = req.query as unknown as EventsTimeseriesQuery;
    const data = await dashboardService.getEventsTimeseries(eventType, range, from, to);
    return sendSuccess(res, data, 'Events timeseries');
  }),
};

export default dashboardController;
