import { Router } from 'express';
import { appVersionController } from './app-version.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  appVersionPlatformParamSchema,
  upsertAppVersionSchema,
  checkVersionQuerySchema,
} from '@validators/app-version.validator';

/** Mounted at /api/v1/admin/app-version. */
export const adminAppVersionRouter = Router();
adminAppVersionRouter.use(authenticate);

adminAppVersionRouter.get('/', authorize(...CONTENT_MANAGE_ROLES), appVersionController.adminList);
adminAppVersionRouter.get(
  '/:platform',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(appVersionPlatformParamSchema, 'params'),
  appVersionController.adminGetByPlatform,
);
adminAppVersionRouter.put(
  '/:platform',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(appVersionPlatformParamSchema, 'params'),
  validate(upsertAppVersionSchema),
  appVersionController.adminUpsert,
);

/** Mounted at /api/v1/app/version. */
export const publicAppVersionRouter = Router();
publicAppVersionRouter.get('/', validate(checkVersionQuerySchema, 'query'), appVersionController.publicCheck);

export default { adminAppVersionRouter, publicAppVersionRouter };
