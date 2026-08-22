import { Router } from 'express';
import { adConfigController } from './ad-config.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  createAdConfigSchema,
  updateAdConfigSchema,
  adConfigListQuerySchema,
  publicAdConfigQuerySchema,
} from '@validators/ad-config.validator';
import { idParamSchema } from '@validators/common.validator';

/** Mounted at /api/v1/admin/ads. */
export const adminAdConfigRouter = Router();
adminAdConfigRouter.use(authenticate);

// Static route registered before '/:id' — same lesson as the public prompt
// routes in Phase 5: otherwise Express would try to match "disable-all" as
// a UUID :id.
adminAdConfigRouter.post('/disable-all', authorize(...CONTENT_MANAGE_ROLES), adConfigController.adminDisableAll);

adminAdConfigRouter.get(
  '/',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(adConfigListQuerySchema, 'query'),
  adConfigController.adminList,
);
adminAdConfigRouter.get(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  adConfigController.adminGetById,
);
adminAdConfigRouter.post(
  '/',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(createAdConfigSchema),
  adConfigController.adminCreate,
);
adminAdConfigRouter.patch(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateAdConfigSchema),
  adConfigController.adminUpdate,
);
adminAdConfigRouter.delete(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES),
  validate(idParamSchema(), 'params'),
  adConfigController.adminRemove,
);

/** Mounted at /api/v1/ads/config (Section 25's literal example path). */
export const publicAdConfigRouter = Router();
publicAdConfigRouter.get('/', validate(publicAdConfigQuerySchema, 'query'), adConfigController.publicGetConfig);

export default { adminAdConfigRouter, publicAdConfigRouter };
