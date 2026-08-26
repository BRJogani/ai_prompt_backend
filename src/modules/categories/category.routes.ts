import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '@middleware/authenticate';
import { authorize } from '@middleware/authorize';
import { validate } from '@middleware/validate';
import { CONTENT_WRITE_ROLES, CONTENT_MANAGE_ROLES } from '@constants/roles';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryStatusSchema,
  categoryListQuerySchema,
} from '@validators/category.validator';
import { idParamSchema, paginationQuerySchema } from '@validators/common.validator';

import { uploadMedia } from '@middleware/upload';

// ---------------------------------------------------------------------
// Admin — mounted at /api/v1/admin/categories
// ---------------------------------------------------------------------
export const adminCategoryRouter = Router();

adminCategoryRouter.use(authenticate);

adminCategoryRouter.get(
  '/',
  authorize(...CONTENT_WRITE_ROLES),
  validate(categoryListQuerySchema, 'query'),
  categoryController.adminList,
);
adminCategoryRouter.get(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  categoryController.adminGetById,
);
adminCategoryRouter.post(
  '/',
  authorize(...CONTENT_WRITE_ROLES),
  validate(createCategorySchema),
  categoryController.create,
);
adminCategoryRouter.post(
  '/upload-image',
  authorize(...CONTENT_WRITE_ROLES),
  uploadMedia,
  categoryController.uploadDirectImage,
);
adminCategoryRouter.post(
  '/:id/image',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  uploadMedia,
  categoryController.uploadImage,
);
adminCategoryRouter.put(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateCategorySchema),
  categoryController.update,
);
adminCategoryRouter.patch(
  '/:id',
  authorize(...CONTENT_WRITE_ROLES),
  validate(idParamSchema(), 'params'),
  validate(updateCategorySchema),
  categoryController.update,
);
adminCategoryRouter.patch(
  '/:id/status',
  authorize(...CONTENT_MANAGE_ROLES), // enabling/disabling is a content-management action, not a basic edit
  validate(idParamSchema(), 'params'),
  validate(categoryStatusSchema),
  categoryController.setStatus,
);
adminCategoryRouter.delete(
  '/:id',
  authorize(...CONTENT_MANAGE_ROLES), // deletion is restricted to CONTENT_ADMIN/SUPER_ADMIN, not EDITOR
  validate(idParamSchema(), 'params'),
  categoryController.remove,
);

// ---------------------------------------------------------------------
// Public — mounted at /api/v1/categories
// ---------------------------------------------------------------------
export const publicCategoryRouter = Router();

publicCategoryRouter.get('/', categoryController.publicList);
publicCategoryRouter.get('/:id', validate(idParamSchema(), 'params'), categoryController.publicGetById);
publicCategoryRouter.get(
  '/:id/prompts',
  validate(idParamSchema(), 'params'),
  validate(paginationQuerySchema, 'query'),
  categoryController.publicPrompts,
);

export default { adminCategoryRouter, publicCategoryRouter };
