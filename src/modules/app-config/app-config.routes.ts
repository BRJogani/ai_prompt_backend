import { Router } from 'express';
import { appSettingController } from './app-setting.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  appSettingKeyParamSchema,
  updateAppSettingSchema,
  createAppSettingSchema,
} from '@validators/app-setting.validator';

/** Mounted at /api/v1/admin/app-config. */
export const adminAppConfigRouter = Router();
adminAppConfigRouter.use(authenticate);

adminAppConfigRouter.get('/', authorize(...CONTENT_MANAGE_ROLES), appSettingController.adminList);
adminAppConfigRouter.get(
  '/:key',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(appSettingKeyParamSchema, 'params'),
  appSettingController.adminGetByKey,
);
adminAppConfigRouter.post(
  '/',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(createAppSettingSchema),
  appSettingController.adminCreate,
);
adminAppConfigRouter.patch(
  '/:key',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(appSettingKeyParamSchema, 'params'),
  validate(updateAppSettingSchema),
  appSettingController.adminUpdate,
);

/** Mounted at /api/v1/app/config. */
export const publicAppConfigRouter = Router();
publicAppConfigRouter.get('/', appSettingController.publicGetConfig);

export default { adminAppConfigRouter, publicAppConfigRouter };
