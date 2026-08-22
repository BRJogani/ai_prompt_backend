import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { DASHBOARD_READ_ROLES } from '@constants/roles';
import {
  topPromptsQuerySchema,
  topCategoriesQuerySchema,
  eventsTimeseriesQuerySchema,
} from '@validators/dashboard.validator';

export const adminDashboardRouter = Router();
adminDashboardRouter.use(authenticate, authorize(...DASHBOARD_READ_ROLES));

adminDashboardRouter.get('/', dashboardController.overview);
adminDashboardRouter.get('/top-prompts', validate(topPromptsQuerySchema, 'query'), dashboardController.topPrompts);
adminDashboardRouter.get(
  '/top-categories',
  validate(topCategoriesQuerySchema, 'query'),
  dashboardController.topCategories,
);
adminDashboardRouter.get(
  '/events-timeseries',
  validate(eventsTimeseriesQuerySchema, 'query'),
  dashboardController.eventsTimeseries,
);

export default adminDashboardRouter;
