import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { DASHBOARD_READ_ROLES } from '@constants/roles';
import { auditLogListQuerySchema } from '@validators/audit-log.validator';

export const adminAuditLogRouter = Router();
adminAuditLogRouter.get(
  '/',
  authenticate,
  authorize(...DASHBOARD_READ_ROLES),
  validate(auditLogListQuerySchema, 'query'),
  auditLogController.list,
);

export default adminAuditLogRouter;
