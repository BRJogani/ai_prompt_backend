import { Router } from 'express';
import { reportController } from './report.controller';
import { resolveDeviceUser } from '@middleware/resolveDeviceUser';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { DASHBOARD_READ_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import { createReportSchema, updateReportStatusSchema, reportListQuerySchema } from '@validators/report.validator';
import { idParamSchema } from '@validators/common.validator';

/** Mounted at /api/v1/reports. */
export const publicReportRouter = Router();
publicReportRouter.post('/', resolveDeviceUser, validate(createReportSchema), reportController.create);

/** Mounted at /api/v1/admin/reports. */
export const adminReportRouter = Router();
adminReportRouter.use(authenticate);

adminReportRouter.get(
  '/',
  authorize(...DASHBOARD_READ_ROLES),
  validate(reportListQuerySchema, 'query'),
  reportController.adminList,
);
adminReportRouter.get(
  '/:id',
  authorize(...DASHBOARD_READ_ROLES),
  validate(idParamSchema(), 'params'),
  reportController.adminGetById,
);
adminReportRouter.patch(
  '/:id/status',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateReportStatusSchema),
  reportController.adminUpdateStatus,
);

export default { publicReportRouter, adminReportRouter };
