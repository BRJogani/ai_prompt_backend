import { Router } from 'express';
import { adminUserController } from './admin-user.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { adminUserListQuerySchema, updateAdminUserSchema } from '@validators/admin-user.validator';
import { idParamSchema } from '@validators/common.validator';

/**
 * Mounted at /api/v1/admin/admin-users. Restricted entirely to SUPER_ADMIN
 * — managing who else has admin access is more sensitive than ordinary
 * content management, so this doesn't share CONTENT_MANAGE_ROLES.
 */
export const adminAdminUserRouter = Router();
adminAdminUserRouter.use(authenticate, authorize('SUPER_ADMIN'));

adminAdminUserRouter.get('/', validate(adminUserListQuerySchema, 'query'), adminUserController.list);
adminAdminUserRouter.get('/:id', validate(idParamSchema(), 'params'), adminUserController.getById);
adminAdminUserRouter.patch(
  '/:id',
  validate(idParamSchema(), 'params'),
  validate(updateAdminUserSchema),
  adminUserController.update,
);
adminAdminUserRouter.delete('/:id', validate(idParamSchema(), 'params'), adminUserController.remove);

export default adminAdminUserRouter;
