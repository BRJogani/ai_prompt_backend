import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { resolveDeviceUser } from '@middleware/resolveDeviceUser';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { strictRateLimiter } from '@middleware/rateLimiter';
import { trackEventSchema } from '@validators/analytics.validator';
import { CONTENT_MANAGE_ROLES } from '@constants/roles';

/** Mounted at /api/v1/analytics. Stricter rate limit (Section 44) to deter fake event spam. */
export const publicAnalyticsRouter = Router();
publicAnalyticsRouter.post(
  '/events',
  strictRateLimiter,
  resolveDeviceUser,
  validate(trackEventSchema),
  analyticsController.track,
);

/** Mounted at /api/v1/admin/analytics. Dashboard/reporting endpoints land in Phase 9. */
export const adminAnalyticsRouter = Router();
adminAnalyticsRouter.post(
  '/recalculate-trending',
  authenticate,
  authorize(...CONTENT_MANAGE_ROLES),
  analyticsController.adminRecalculateTrending,
);

export default { publicAnalyticsRouter, adminAnalyticsRouter };
